import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { AlbumArt } from '@/components/AlbumArt';
import { SpotifyButton } from '@/components/SpotifyButton';
import { colors, intervalColors } from '@/constants/colors';
import { compressWorkoutForDemo } from '@/domain/workout';
import { useRunSession } from '@/hooks/useRunSession';
import { useRunStore } from '@/stores/runStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSpotifyStore } from '@/stores/spotifyStore';
import { TRACKS } from '@/data/tracks';
import type { RunSummary } from '@/types';
import { formatDuration } from '@/utils/time';

export default function RunScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width <= 375;
  const compactHeight = height <= 800;
  const tiny = width <= 340 || height <= 700;
  const spotifyTracks = useSpotifyStore((state) => state.tracks);
  const catalog = spotifyTracks.length > 0 ? spotifyTracks : TRACKS;
  const plan = useWorkoutStore((state) => state.plan);
  const demoMode = useWorkoutStore((state) => state.demoMode);
  const source = useRunStore((state) => state.cadenceSource);
  const saveSummary = useRunStore((state) => state.saveSummary);
  const activePlan = useMemo(() => demoMode ? compressWorkoutForDemo(plan) : plan, [demoMode, plan]);
  const [manualCadence, setManualCadence] = useState(160);
  const [manualEnabled, setManualEnabled] = useState(false);
  const onComplete = useCallback((summary: RunSummary) => {
    saveSummary(summary);
    router.replace('/summary');
  }, [saveSummary]);
  const { countdown, snapshot, notice, togglePause, skip, end, setSimulatedCadence } = useRunSession({ plan: activePlan, source, demoMode, tracks: catalog, onComplete });

  if (!snapshot) {
    return (
      <Screen scroll={false} contentStyle={styles.countdownScreen}>
        <BrandMark />
        <View style={styles.countdownWrap}>
          <Text style={styles.countdownEyebrow}>GET READY</Text>
          <Text style={styles.countdown}>{countdown || 'GO'}</Text>
          <Text style={styles.countdownSub}>Find your rhythm. The first beat is queued.</Text>
        </View>
        <View style={styles.countdownPlan}>
          <Ionicons name="flag-outline" size={19} color={colors.accent} />
          <Text style={styles.countdownPlanText}>{activePlan.name} · {formatDuration(activePlan.intervals.reduce((sum, item) => sum + item.durationSec, 0))}</Text>
        </View>
      </Screen>
    );
  }

  const active = snapshot.active;
  const paused = snapshot.status === 'paused';
  const progress = snapshot.totalSec > 0 ? snapshot.elapsedSec / snapshot.totalSec : 0;
  const actual = snapshot.actualSpm ?? '—';
  const accent = active ? intervalColors[active.interval.type] : colors.accent;

  const confirmEnd = () => Alert.alert('End this run?', 'Your session so far will still be summarized.', [
    { text: 'Keep running', style: 'cancel' },
    { text: 'End run', style: 'destructive', onPress: end },
  ]);

  const chooseCadence = (value: number) => {
    setManualEnabled(true);
    setManualCadence(value);
    setSimulatedCadence(value);
  };

  return (
    <Screen scroll={compactHeight} contentStyle={[styles.screen, compactHeight && styles.scrollableScreen]}>
      <View style={styles.runTop}>
        <BrandMark compact />
        <View style={styles.badges}>
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>{source === 'simulation' ? 'DEMO' : 'LIVE'}</Text></View>
          <Pressable onPress={confirmEnd} style={styles.endButton}><Text style={styles.endText}>END</Text></Pressable>
        </View>
      </View>
      {notice ? <View style={styles.notice}><Ionicons name="information-circle" size={16} color={colors.warning} /><Text style={styles.noticeText}>{notice}</Text></View> : null}

      <View style={[styles.progressHeader, compactHeight && styles.compactProgressHeader]}>
        <View><Text style={[styles.intervalType, { color: accent }]}>{active?.interval.type.toUpperCase()}</Text><Text style={styles.intervalName}>{active?.interval.name ?? 'Finishing'}</Text></View>
        <View style={styles.timeWrap}><Text style={styles.time}>{formatDuration(active?.remainingSec ?? 0)}</Text><Text style={styles.timeLabel}>REMAINING</Text></View>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: accent }]} /></View>

      <View style={[styles.cadenceZone, compactHeight && styles.compactCadenceZone]}>
        {snapshot.isAdjusting ? <View style={styles.adjusting}><Ionicons name="sparkles" size={13} color={colors.accentInk} /><Text style={styles.adjustingText}>ADJUSTING SOUNDTRACK</Text></View> : <View style={styles.stable}><View style={styles.stableDot} /><Text style={styles.stableText}>CADENCE LOCKED</Text></View>}
        <View style={[styles.cadenceRing, compactHeight && styles.compactCadenceRing, tiny && styles.tinyCadenceRing, { borderColor: accent }]}>
          <View style={[styles.cadenceInner, compactHeight && styles.compactCadenceInner, tiny && styles.tinyCadenceInner]}>
            <Text style={[styles.actual, compactHeight && styles.compactActual, tiny && styles.tinyActual]}>{actual}</Text>
            <Text style={styles.actualLabel}>ACTUAL SPM</Text>
          </View>
        </View>
        <View style={styles.metricStrip}>
          <View style={styles.liveMetric}><Text style={styles.liveMetricLabel}>TARGET</Text><Text style={styles.liveMetricValue}>{active?.interval.targetSpm ?? 0}</Text></View>
          <View style={styles.metricDivider} />
          <View style={styles.liveMetric}><Text style={styles.liveMetricLabel}>BEAT MATCH</Text><Text style={[styles.liveMetricValue, { color: snapshot.beatMatchPercent >= 75 ? colors.accent : colors.warning }]}>{snapshot.beatMatchPercent}%</Text></View>
          <View style={styles.metricDivider} />
          <View style={styles.liveMetric}><Text style={styles.liveMetricLabel}>CONFIDENCE</Text><Text style={styles.liveMetricValue}>{Math.round(snapshot.confidence * 100)}%</Text></View>
        </View>
      </View>

      <View style={[styles.nowPlaying, compact && styles.compactNowPlaying]}>
        <AlbumArt track={snapshot.trackMatch.track} size={compact ? 54 : 66} />
        <View style={styles.songCopy}><Text style={styles.playingLabel}>PACE PICK</Text><Text numberOfLines={1} style={styles.songTitle}>{snapshot.trackMatch.track.title}</Text><Text numberOfLines={1} style={styles.artist}>{snapshot.trackMatch.track.artist}</Text></View>
        <View style={styles.nowPlayingActions}><View style={styles.tempo}><Text style={[styles.tempoValue, compact && styles.compactTempoValue]}>{snapshot.trackMatch.mode === 'unknown' ? '♥' : Math.round(snapshot.trackMatch.effectiveTempo)}</Text><Text style={styles.tempoLabel}>{snapshot.trackMatch.mode === 'unknown' ? 'YOUR PICK' : 'BPM'}</Text></View><SpotifyButton compact url={snapshot.trackMatch.track.spotifyUrl} accessibilityLabel={`Open ${snapshot.trackMatch.track.title} on Spotify`} /></View>
      </View>

      <View style={[styles.controls, compact && styles.compactControls]}>
        <Pressable onPress={skip} style={styles.sideControl}><Ionicons name="play-skip-forward" size={23} color={colors.textPrimary} /><Text style={styles.controlLabel}>SKIP</Text></Pressable>
        <Pressable onPress={togglePause} style={styles.pause}><Ionicons name={paused ? 'play' : 'pause'} size={32} color={colors.accentInk} /></Pressable>
        <View style={styles.sideControl}><Ionicons name="footsteps" size={23} color={colors.textPrimary} /><Text style={styles.controlLabel}>{snapshot.points.length * 3} STEPS</Text></View>
      </View>

      {source === 'simulation' ? (
        <View style={styles.demoPanel}>
          <View style={styles.demoHeading}><Text style={styles.demoTitle}>Demo cadence control</Text><Pressable onPress={() => { setManualEnabled(false); setSimulatedCadence(null); }}><Text style={styles.auto}>{manualEnabled ? 'USE AUTO' : 'AUTO ACTIVE'}</Text></Pressable></View>
          <Slider minimumValue={120} maximumValue={190} step={1} value={manualCadence} onValueChange={chooseCadence} minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.divider} thumbTintColor={colors.accent} />
          <View style={styles.presets}>{[
            { label: 'SLOW', value: 145 }, { label: 'TARGET', value: active?.interval.targetSpm ?? 165 }, { label: 'FAST', value: 180 },
          ].map((item) => <Pressable key={item.label} onPress={() => chooseCadence(item.value)} style={styles.preset}><Text style={styles.presetText}>{item.label} · {item.value}</Text></Pressable>)}</View>
        </View>
      ) : null}
      {paused ? <View style={styles.pausedOverlay} pointerEvents="none"><Text style={styles.pausedText}>PAUSED</Text></View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 14 },
  scrollableScreen: { flexGrow: 1 },
  countdownScreen: { flex: 1, justifyContent: 'space-between', paddingBottom: 32 },
  countdownWrap: { alignItems: 'center' },
  countdownEyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  countdown: { color: colors.textPrimary, fontSize: 132, lineHeight: 145, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -7 },
  countdownSub: { color: colors.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22, maxWidth: 290 },
  countdownPlan: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 17, padding: 16, borderWidth: 1, borderColor: colors.divider },
  countdownPlanText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  runTop: { height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,255,85,0.1)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  liveText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  endButton: { borderRadius: 11, backgroundColor: 'rgba(255,101,101,0.09)', paddingHorizontal: 12, paddingVertical: 7 },
  endText: { color: colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  notice: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,184,77,0.08)', padding: 9, borderRadius: 10, marginTop: 7 },
  noticeText: { color: colors.warning, fontSize: 10, flex: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 },
  compactProgressHeader: { marginTop: 12 },
  intervalType: { fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  intervalName: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 3 },
  timeWrap: { alignItems: 'flex-end' },
  time: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timeLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.divider, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  cadenceZone: { alignItems: 'center', marginTop: 13 },
  compactCadenceZone: { marginTop: 8 },
  adjusting: { height: 25, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: 13, paddingHorizontal: 10 },
  adjustingText: { color: colors.accentInk, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  stable: { height: 25, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan },
  stableText: { color: colors.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  cadenceRing: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 6, backgroundColor: colors.backgroundSoft, shadowColor: colors.accent, shadowOpacity: 0.12, shadowRadius: 20 },
  compactCadenceRing: { width: 158, height: 158, borderRadius: 79 },
  tinyCadenceRing: { width: 142, height: 142, borderRadius: 71 },
  cadenceInner: { width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  compactCadenceInner: { width: 130, height: 130, borderRadius: 65 },
  tinyCadenceInner: { width: 116, height: 116, borderRadius: 58 },
  actual: { color: colors.textPrimary, fontSize: 70, lineHeight: 73, fontWeight: '900', letterSpacing: -4, fontVariant: ['tabular-nums'] },
  compactActual: { fontSize: 60, lineHeight: 63 },
  tinyActual: { fontSize: 52, lineHeight: 55 },
  actualLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  metricStrip: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  liveMetric: { minWidth: 84, alignItems: 'center' },
  liveMetricLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  liveMetricValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 2 },
  metricDivider: { width: 1, height: 28, backgroundColor: colors.divider },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: 10, marginTop: 15 },
  compactNowPlaying: { marginTop: 10, padding: 8 },
  songCopy: { flex: 1, marginLeft: 11 },
  playingLabel: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  songTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginTop: 4 },
  artist: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  tempo: { alignItems: 'center', minWidth: 57 },
  tempoValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  compactTempoValue: { fontSize: 17 },
  tempoLabel: { color: colors.textMuted, fontSize: 6, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  nowPlayingActions: { alignItems: 'center', gap: 5 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44, marginVertical: 13 },
  compactControls: { gap: 30, marginVertical: 10 },
  sideControl: { width: 58, alignItems: 'center', gap: 4 },
  controlLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  pause: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  demoPanel: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.divider, paddingHorizontal: 13, paddingVertical: 10 },
  demoHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoTitle: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
  auto: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  presets: { flexDirection: 'row', gap: 6 },
  preset: { flex: 1, backgroundColor: colors.backgroundSoft, borderRadius: 9, alignItems: 'center', paddingVertical: 6 },
  presetText: { color: colors.textSecondary, fontSize: 8, fontWeight: '800' },
  pausedOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,10,9,0.7)', alignItems: 'center', justifyContent: 'center' },
  pausedText: { color: colors.textPrimary, fontSize: 38, fontWeight: '900', letterSpacing: 4 },
});
