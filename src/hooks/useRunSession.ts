import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { RunSessionEngine, DEMO_SESSION_CONFIG, STANDARD_SESSION_CONFIG, type RunSessionSnapshot } from '@/domain/session';
import { AccelerometerCadenceProvider } from '@/providers/cadence/AccelerometerCadenceProvider';
import type { CadenceProvider } from '@/providers/cadence/CadenceProvider';
import { SimulatedCadenceProvider } from '@/providers/cadence/SimulatedCadenceProvider';
import { DemoAudioPlaybackProvider } from '@/providers/playback/DemoAudioPlaybackProvider';
import { SpotifyRemotePlaybackProvider } from '@/providers/playback/SpotifyRemotePlaybackProvider';
import type { PlaybackProvider } from '@/providers/playback/PlaybackProvider';
import type { CadenceSource, RunSummary, Track, WorkoutPlan } from '@/types';

interface UseRunSessionInput {
  plan: WorkoutPlan;
  source: CadenceSource;
  demoMode: boolean;
  tracks: Track[];
  onComplete: (summary: RunSummary) => void;
}

export function useRunSession({ plan, source, demoMode, tracks, onComplete }: UseRunSessionInput) {
  const [countdown, setCountdown] = useState(3);
  const [snapshot, setSnapshot] = useState<RunSessionSnapshot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const engineRef = useRef<RunSessionEngine | null>(null);
  const cadenceRef = useRef<CadenceProvider | null>(null);
  const simulationRef = useRef<SimulatedCadenceProvider | null>(null);
  const playbackRef = useRef<PlaybackProvider | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const lastTrackIdRef = useRef<string | null>(null);
  const lastIntervalIndexRef = useRef(0);

  const handlePlaybackError = useCallback((error: unknown) => {
    setNotice(error instanceof Error ? error.message : 'Spotify playback is unavailable.');
  }, []);

  const applySnapshot = useCallback((next: RunSessionSnapshot) => {
    const playback = playbackRef.current;
    if (next.trackMatch.track.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = next.trackMatch.track.id;
      void playback?.load(next.trackMatch.track, next.desiredTempo).then(() => {
        if (next.status === 'running') return playback.play();
      }).catch(handlePlaybackError);
    }
    if (next.active && next.active.index !== lastIntervalIndexRef.current) {
      lastIntervalIndexRef.current = next.active.index;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSnapshot(next);
    if ((next.status === 'completed' || next.status === 'ended') && !completedRef.current) {
      completedRef.current = true;
      void playback?.stop().catch(handlePlaybackError);
      const summary = engineRef.current?.getSummary();
      if (summary) onComplete(summary);
    }
  }, [handlePlaybackError, onComplete]);

  useEffect(() => {
    let active = true;
    const countdownTimer = setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    const startTimer = setTimeout(() => {
      void (async () => {
        if (!active) return;
        const engine = new RunSessionEngine(plan, tracks, demoMode ? DEMO_SESSION_CONFIG : STANDARD_SESSION_CONFIG);
        const usesSpotify = tracks.some((track) => track.source === 'spotify' && track.spotifyUri);
        const playback: PlaybackProvider = usesSpotify
          ? new SpotifyRemotePlaybackProvider()
          : new DemoAudioPlaybackProvider();
        const simulation = new SimulatedCadenceProvider();
        let cadence: CadenceProvider = simulation;
        simulationRef.current = simulation;

        if (source === 'sensor') {
          const sensor = new AccelerometerCadenceProvider();
          try {
            const available = await sensor.isAvailable();
            const granted = available && (await sensor.requestPermission());
            if (granted) cadence = sensor;
            else setNotice('Motion sensor unavailable — switched to Demo Mode.');
          } catch {
            setNotice('Could not start motion sensor — switched to Demo Mode.');
          }
        }

        if (!active) return;
        engineRef.current = engine;
        playbackRef.current = playback;
        cadenceRef.current = cadence;
        const initial = engine.start(Date.now());
        applySnapshot(initial);
        await cadence.start((sample) => {
          const currentEngine = engineRef.current;
          if (currentEngine) applySnapshot(currentEngine.updateCadence(sample));
        });
        sessionTimerRef.current = setInterval(() => {
          const currentEngine = engineRef.current;
          if (currentEngine) applySnapshot(currentEngine.tick(Date.now()));
        }, 250);
      })();
    }, 3000);

    return () => {
      active = false;
      clearInterval(countdownTimer);
      clearTimeout(startTimer);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      void cadenceRef.current?.stop();
      void playbackRef.current?.release();
    };
  }, [applySnapshot, demoMode, plan, source, tracks]);

  const togglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !snapshot) return;
    const now = Date.now();
    if (snapshot.status === 'paused') {
      applySnapshot(engine.resume(now));
      void playbackRef.current?.play().catch(handlePlaybackError);
    } else {
      applySnapshot(engine.pause(now));
      void playbackRef.current?.pause().catch(handlePlaybackError);
    }
  }, [applySnapshot, handlePlaybackError, snapshot]);

  const skip = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    applySnapshot(engine.skip(Date.now()));
  }, [applySnapshot]);

  const end = useCallback(() => {
    const engine = engineRef.current;
    if (engine) applySnapshot(engine.end(Date.now()));
  }, [applySnapshot]);

  const setSimulatedCadence = useCallback((spm: number | null) => {
    simulationRef.current?.setCadence(spm);
  }, []);

  return { countdown, snapshot, notice, togglePause, skip, end, setSimulatedCadence };
}
