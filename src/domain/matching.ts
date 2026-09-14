import type { Genre, Track } from '@/types';
import { clamp } from '@/utils/math';

export type TempoMode = 'direct' | 'half-time' | 'double-time' | 'unknown';

export interface TempoMatch {
  effectiveTempo: number;
  mode: TempoMode;
}

export interface ScoredTrack {
  track: Track;
  score: number;
  effectiveTempo: number;
  mode: TempoMode;
}

export function tempoMatchForCadence(trackBpm: number | null, targetSpm: number): TempoMatch {
  if (trackBpm == null || trackBpm <= 0) return { effectiveTempo: targetSpm, mode: 'unknown' };
  const candidates: TempoMatch[] = [
    { effectiveTempo: trackBpm, mode: 'direct' },
    { effectiveTempo: trackBpm * 2, mode: 'half-time' },
    { effectiveTempo: trackBpm / 2, mode: 'double-time' },
  ];
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate.effectiveTempo - targetSpm) < Math.abs(best.effectiveTempo - targetSpm)
      ? candidate
      : best,
  );
}

export function effectiveTempoForCadence(trackBpm: number | null, targetSpm: number): number {
  return tempoMatchForCadence(trackBpm, targetSpm).effectiveTempo;
}

export function scoreTrack(input: {
  track: Track;
  desiredTempo: number;
  selectedGenres: Genre[];
  recentlyPlayed: string[];
}): ScoredTrack {
  const { track, desiredTempo, selectedGenres, recentlyPlayed } = input;
  const match = tempoMatchForCadence(track.bpm, desiredTempo);
  const tempoDifference = Math.abs(match.effectiveTempo - desiredTempo);
  const tempoScore = match.mode === 'unknown' ? 0.65 : clamp(1 - tempoDifference / 15, 0, 1);
  const genreScore =
    selectedGenres.length === 0 ||
    selectedGenres.includes('anything') ||
    track.genres.includes('anything') ||
    track.genres.some((genre) => selectedGenres.includes(genre))
      ? 1
      : 0;
  const freshnessScore = recentlyPlayed.includes(track.id) ? 0 : 1;
  const score =
    tempoScore * 0.55 +
    genreScore * 0.2 +
    clamp(track.familiarityScore, 0, 1) * 0.15 +
    freshnessScore * 0.1;

  return { track, score: Math.round(score * 100), ...match };
}

export function rankTracks(input: {
  tracks: Track[];
  desiredTempo: number;
  selectedGenres: Genre[];
  recentlyPlayed?: string[];
}): ScoredTrack[] {
  return input.tracks
    .map((track) =>
      scoreTrack({
        track,
        desiredTempo: input.desiredTempo,
        selectedGenres: input.selectedGenres,
        recentlyPlayed: input.recentlyPlayed ?? [],
      }),
    )
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title));
}

export function selectTrack(input: Parameters<typeof rankTracks>[0], random: () => number = Math.random): ScoredTrack {
  const ranked = rankTracks(input);
  if (ranked.length === 0) throw new Error('Track catalog is empty');
  const pool = ranked.slice(0, Math.min(3, ranked.length));
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] ?? ranked[0]!;
}
