import { clamp } from '@/utils/math';

export function estimateCadenceFromSpeed(speedMph: number, heightCm: number): number {
  const estimate = 155 + 6 * (speedMph - 5) - 0.12 * (heightCm - 170);
  return Math.round(clamp(estimate, 130, 190));
}
