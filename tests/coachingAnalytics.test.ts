import { calculateCadenceConsistency, calculateInstantBeatMatch, calculateTimeInTarget, createRunSummary } from '@/domain/analytics';
import { calculateCoachingTempo } from '@/domain/coaching';
import type { RunDataPoint } from '@/types';

const point = (actualSpm: number | null, targetSpm = 170, confidence = 0.9): RunDataPoint => ({
  timestampMs: 0,
  actualSpm,
  targetSpm,
  songBpm: 170,
  effectiveSongSpm: 170,
  confidence,
  intervalId: 'steady',
});

describe('adaptive coaching', () => {
  it('uses target when cadence is missing or already close', () => {
    expect(calculateCoachingTempo(null, 170)).toBe(170);
    expect(calculateCoachingTempo(166, 170)).toBe(170);
  });

  it('limits the nudge to six SPM', () => {
    expect(calculateCoachingTempo(158, 170)).toBe(164);
    expect(calculateCoachingTempo(180, 165)).toBe(174);
  });
});

describe('run analytics', () => {
  it('scores perfect beat alignment as 100%', () => {
    expect(calculateInstantBeatMatch(170, 170)).toBe(1);
  });

  it('ignores low-confidence and missing samples', () => {
    expect(calculateTimeInTarget([point(170), point(150, 170, 0.2), point(null)])).toBe(1);
  });

  it('handles empty arrays without invalid values', () => {
    expect(calculateCadenceConsistency([])).toBe(0);
    const summary = createRunSummary({ points: [], durationSec: 0, completedIntervals: 0, totalIntervals: 1, now: new Date(0) });
    expect(summary.averageCadence).toBe(0);
    expect(summary.beatMatchPercent).toBe(0);
    expect(Number.isNaN(summary.timeInTargetPercent)).toBe(false);
  });
});
