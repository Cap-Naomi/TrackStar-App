import { clamp } from '@/utils/math';

export function calculateCoachingTempo(actualSpm: number | null, targetSpm: number): number {
  if (actualSpm == null) return targetSpm;
  const difference = targetSpm - actualSpm;
  if (Math.abs(difference) <= 5) return targetSpm;
  return Math.round(actualSpm + clamp(difference, -6, 6));
}
