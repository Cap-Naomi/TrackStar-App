import type { Track } from '@/types';

export interface PlaybackProvider {
  load(track: Track, targetTempo?: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seekToStart(): Promise<void>;
  getPositionMs(): Promise<number>;
  release(): Promise<void>;
}
