import type { Genre, WorkoutPlan } from '@/types';

export const GENRES: { value: Genre; label: string }[] = [
  { value: 'pop', label: 'Pop' },
  { value: 'rap', label: 'Rap' },
  { value: 'hyperpop', label: 'Hyperpop' },
  { value: 'indie', label: 'Indie' },
  { value: 'rock', label: 'Rock' },
  { value: 'anything', label: 'Anything' },
];

export const DEFAULT_WORKOUT: WorkoutPlan = {
  id: 'trackstar-starter',
  name: 'Demo Progression',
  createdAt: '2026-09-14T00:00:00.000Z',
  genres: ['pop', 'indie'],
  intervals: [
    { id: 'warm-up', name: 'Warm Up', type: 'warmup', durationSec: 45, targetSpm: 145 },
    { id: 'tempo-run', name: 'Tempo Run', type: 'steady', durationSec: 90, targetSpm: 165 },
    { id: 'sprint', name: 'Push', type: 'sprint', durationSec: 30, targetSpm: 178 },
    { id: 'recovery', name: 'Recovery', type: 'recovery', durationSec: 45, targetSpm: 145 },
  ],
};

export const DEMO_WORKOUT_DURATIONS = [10, 14, 10, 12] as const;
