import { RunSessionEngine } from '@/domain/session';
import type { Track, WorkoutPlan } from '@/types';

const plan: WorkoutPlan = {
  id: 'test', name: 'Test', createdAt: new Date(0).toISOString(), genres: ['anything'],
  intervals: [
    { id: 'one', name: 'One', type: 'warmup', durationSec: 10, targetSpm: 145 },
    { id: 'two', name: 'Two', type: 'steady', durationSec: 10, targetSpm: 170 },
  ],
};
const tracks: Track[] = [
  { id: 'a', title: 'A', artist: 'T', bpm: 145, genres: ['pop'], durationMs: 1000, familiarityScore: 1, artworkColors: ['#000', '#111'] },
  { id: 'b', title: 'B', artist: 'T', bpm: 170, genres: ['pop'], durationMs: 1000, familiarityScore: 1, artworkColors: ['#000', '#111'] },
];

describe('RunSessionEngine', () => {
  it('selects intervals from elapsed time and completes', () => {
    const engine = new RunSessionEngine(plan, tracks, undefined, () => 0);
    expect(engine.start(0).active?.index).toBe(0);
    expect(engine.tick(11000).active?.index).toBe(1);
    expect(engine.tick(20000).status).toBe('completed');
  });

  it('does not count paused time', () => {
    const engine = new RunSessionEngine(plan, tracks, undefined, () => 0);
    engine.start(0);
    engine.tick(5000);
    engine.pause(5000);
    expect(engine.tick(8000).elapsedSec).toBe(5);
    engine.resume(8000);
    expect(engine.tick(10000).elapsedSec).toBe(7);
  });

  it('does not claim a beat match when Spotify BPM is unknown', () => {
    const spotifyTrack: Track = {
      id: 'spotify-a',
      title: 'Spotify A',
      artist: 'T',
      bpm: null,
      genres: ['anything'],
      durationMs: 1000,
      familiarityScore: 1,
      artworkColors: ['#000', '#111'],
      source: 'spotify',
    };
    const engine = new RunSessionEngine(plan, [spotifyTrack], undefined, () => 0);

    engine.start(0);
    const snapshot = engine.updateCadence({
      timestampMs: 1000,
      rawSpm: 145,
      smoothedSpm: 145,
      confidence: 1,
      source: 'simulation',
    });

    expect(snapshot.trackMatch.mode).toBe('unknown');
    expect(snapshot.beatMatchPercent).toBeNull();
  });
});
