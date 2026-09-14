import type { RunDataPoint, RunSummary } from '@/types';
import { average, clamp, standardDeviation } from '@/utils/math';

export function calculateInstantBeatMatch(actualSpm: number, effectiveSongSpm: number): number {
  return clamp(1 - Math.abs(actualSpm - effectiveSongSpm) / 15, 0, 1);
}

export function calculateCadenceConsistency(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const mean = average(samples);
  if (mean === 0) return 0;
  return clamp(1 - standardDeviation(samples) / mean, 0, 1);
}

export function calculateTimeInTarget(points: readonly RunDataPoint[]): number {
  const valid = points.filter((point) => point.actualSpm != null && point.confidence >= 0.5);
  if (valid.length === 0) return 0;
  const inTarget = valid.filter((point) => Math.abs(point.actualSpm! - point.targetSpm) <= 5);
  return inTarget.length / valid.length;
}

export function createRunSummary(input: {
  points: RunDataPoint[];
  durationSec: number;
  completedIntervals: number;
  totalIntervals: number;
  now?: Date;
}): RunSummary {
  const valid = input.points.filter(
    (point): point is RunDataPoint & { actualSpm: number } => point.actualSpm != null && point.confidence >= 0.5,
  );
  const cadence = valid.map((point) => point.actualSpm);
  const target = input.points.map((point) => point.targetSpm);
  const matches = valid
    .filter((point) => point.effectiveSongSpm != null)
    .map((point) => calculateInstantBeatMatch(point.actualSpm, point.effectiveSongSpm!));
  const averageCadence = average(cadence);

  return {
    id: `run-${input.now?.getTime() ?? Date.now()}`,
    completedAt: (input.now ?? new Date()).toISOString(),
    durationSec: Math.round(input.durationSec),
    estimatedSteps: Math.round((averageCadence * input.durationSec) / 60),
    averageCadence: Math.round(averageCadence),
    averageTarget: Math.round(average(target)),
    cadenceConsistency: Math.round(calculateCadenceConsistency(cadence) * 100),
    timeInTargetPercent: Math.round(calculateTimeInTarget(input.points) * 100),
    beatMatchPercent: Math.round(average(matches) * 100),
    completedIntervals: input.completedIntervals,
    totalIntervals: input.totalIntervals,
    timeline: input.points,
  };
}
