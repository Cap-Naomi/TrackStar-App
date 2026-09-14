import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';
import type { Track } from '@/types';
import type { PlaybackProvider } from './PlaybackProvider';

const AUDIO_SOURCES: Record<string, AudioSource> = {
  'pulse-145': require('../../../assets/audio/pulse-145.wav'),
  'pulse-164': require('../../../assets/audio/pulse-164.wav'),
  'pulse-172': require('../../../assets/audio/pulse-172.wav'),
  'pulse-178': require('../../../assets/audio/pulse-178.wav'),
};

export class DemoAudioPlaybackProvider implements PlaybackProvider {
  private player: AudioPlayer | null = null;
  private shouldPlay = false;

  async load(track: Track, targetTempo = 164): Promise<void> {
    const fallbackKey = targetTempo < 155 ? 'pulse-145' : targetTempo < 168 ? 'pulse-164' : targetTempo < 175 ? 'pulse-172' : 'pulse-178';
    const source = AUDIO_SOURCES[track.bundledAudioKey ?? fallbackKey];
    if (!source) return;
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix', shouldPlayInBackground: true });
    if (!this.player) {
      this.player = createAudioPlayer(source, { updateInterval: 500 });
      this.player.loop = true;
      this.player.volume = 0.8;
    } else {
      this.player.replace(source);
      this.player.loop = true;
    }
    if (this.shouldPlay) this.player.play();
  }

  async play(): Promise<void> {
    this.shouldPlay = true;
    this.player?.play();
  }

  async pause(): Promise<void> {
    this.shouldPlay = false;
    this.player?.pause();
  }

  async stop(): Promise<void> {
    this.shouldPlay = false;
    this.player?.pause();
    if (this.player) await this.player.seekTo(0);
  }

  async seekToStart(): Promise<void> {
    if (this.player) await this.player.seekTo(0);
  }

  async getPositionMs(): Promise<number> {
    return Math.round((this.player?.currentTime ?? 0) * 1000);
  }

  async release(): Promise<void> {
    this.player?.remove();
    this.player = null;
  }
}
