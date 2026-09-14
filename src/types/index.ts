export type Genre = 'pop' | 'rap' | 'hyperpop' | 'indie' | 'rock' | 'anything';

export type IntervalType = 'warmup' | 'steady' | 'sprint' | 'recovery' | 'cooldown';

export interface WorkoutInterval {
  id: string;
  name: string;
  type: IntervalType;
  durationSec: number;
  targetSpm: number;
  genres?: Genre[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  intervals: WorkoutInterval[];
  genres: Genre[];
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genres: Genre[];
  durationMs: number;
  familiarityScore: number;
  bundledAudioKey?: string;
  spotifyUrl?: string;
  spotifyUri?: string;
  album?: string;
  artworkUrl?: string;
  source?: 'demo' | 'spotify';
  artworkColors: readonly [string, string];
}

export interface SpotifyProfile {
  id: string;
  displayName: string;
  imageUrl?: string;
  product?: string;
}

export interface CadenceSample {
  timestampMs: number;
  rawSpm: number | null;
  smoothedSpm: number | null;
  confidence: number;
  source: 'accelerometer' | 'ios-pedometer' | 'android-step' | 'simulation';
}

export interface RunDataPoint {
  timestampMs: number;
  actualSpm: number | null;
  targetSpm: number;
  songBpm: number | null;
  effectiveSongSpm: number | null;
  confidence: number;
  intervalId: string;
}

export interface RunSummary {
  id: string;
  completedAt: string;
  durationSec: number;
  estimatedSteps: number;
  averageCadence: number;
  averageTarget: number;
  cadenceConsistency: number;
  timeInTargetPercent: number;
  beatMatchPercent: number;
  completedIntervals: number;
  totalIntervals: number;
  timeline: RunDataPoint[];
}

export type CadenceSource = 'sensor' | 'simulation';
