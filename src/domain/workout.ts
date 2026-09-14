import { z } from 'zod';
import { DEMO_WORKOUT_DURATIONS } from '@/constants/defaults';
import type { WorkoutPlan } from '@/types';

const genreSchema = z.enum(['pop', 'rap', 'hyperpop', 'indie', 'rock', 'anything']);
const intervalTypeSchema = z.enum(['warmup', 'steady', 'sprint', 'recovery', 'cooldown']);

export const workoutPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  genres: z.array(genreSchema),
  intervals: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: intervalTypeSchema,
      durationSec: z.number().int().min(1).max(7200),
      targetSpm: z.number().int().min(100).max(220),
      genres: z.array(genreSchema).optional(),
    }),
  ).min(1),
});

export function validateWorkoutPlan(value: WorkoutPlan): WorkoutPlan {
  return workoutPlanSchema.parse(value) as WorkoutPlan;
}

export function compressWorkoutForDemo(plan: WorkoutPlan): WorkoutPlan {
  return {
    ...plan,
    id: `${plan.id}-demo`,
    name: `${plan.name} · Demo`,
    intervals: plan.intervals.map((interval, index) => ({
      ...interval,
      durationSec: DEMO_WORKOUT_DURATIONS[index] ?? 10,
    })),
  };
}
