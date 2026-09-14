import { effectiveTempoForCadence, rankTracks, scoreTrack, tempoMatchForCadence } from '@/domain/matching';
import type { Track } from '@/types';

const direct: Track = { id: 'direct', title: 'Direct', artist: 'Test', bpm: 170, genres: ['rock'], durationMs: 1000, familiarityScore: 0.5, artworkColors: ['#000', '#111'] };
const half: Track = { id: 'half', title: 'Half', artist: 'Test', bpm: 85, genres: ['pop'], durationMs: 1000, familiarityScore: 0.5, artworkColors: ['#000', '#111'] };

describe('music matching', () => {
  it('matches 85 BPM to 170 SPM in half-time', () => {
    expect(effectiveTempoForCadence(85, 170)).toBe(170);
    expect(tempoMatchForCadence(85, 170).mode).toBe('half-time');
  });

  it('matches 170 BPM directly to 170 SPM', () => {
    expect(tempoMatchForCadence(170, 170)).toEqual({ effectiveTempo: 170, mode: 'direct' });
  });

  it('uses genre preference and repetition penalty in ranking', () => {
    const freshPop = scoreTrack({ track: half, desiredTempo: 170, selectedGenres: ['pop'], recentlyPlayed: [] });
    const repeatedRock = scoreTrack({ track: direct, desiredTempo: 170, selectedGenres: ['pop'], recentlyPlayed: ['direct'] });
    expect(freshPop.score).toBeGreaterThan(repeatedRock.score);
    expect(rankTracks({ tracks: [direct, half], desiredTempo: 170, selectedGenres: ['pop'], recentlyPlayed: ['direct'] })[0]?.track.id).toBe('half');
  });

  it('keeps personalized tracks without tempo metadata eligible', () => {
    const personal: Track = { id: 'personal', title: 'Favorite', artist: 'Listener pick', bpm: null, genres: ['anything'], durationMs: 1000, familiarityScore: 1, artworkColors: ['#000', '#111'], source: 'spotify' };
    expect(tempoMatchForCadence(personal.bpm, 166)).toEqual({ effectiveTempo: 166, mode: 'unknown' });
    expect(scoreTrack({ track: personal, desiredTempo: 166, selectedGenres: ['rock'], recentlyPlayed: [] }).score).toBeGreaterThan(0);
  });
});
