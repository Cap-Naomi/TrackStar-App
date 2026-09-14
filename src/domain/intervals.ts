import type { WorkoutInterval } from '@/types';

export interface ActiveInterval {
  interval: WorkoutInterval;
  index: number;
  elapsedInIntervalSec: number;
  remainingSec: number;
}

export function totalWorkoutDuration(intervals: readonly WorkoutInterval[]): number {
  return intervals.reduce((total, interval) => total + Math.max(0, interval.durationSec), 0);
}

export function getActiveInterval(intervals: readonly WorkoutInterval[], elapsedSec: number): ActiveInterval | null {
  let cursor = 0;
  for (let index = 0; index < intervals.length; index += 1) {
    const interval = intervals[index];
    if (!interval) continue;
    const end = cursor + interval.durationSec;
    if (elapsedSec < end) {
      return {
        interval,
        index,
        elapsedInIntervalSec: Math.max(0, elapsedSec - cursor),
        remainingSec: Math.max(0, end - elapsedSec),
      };
    }
    cursor = end;
  }
  return null;
}
