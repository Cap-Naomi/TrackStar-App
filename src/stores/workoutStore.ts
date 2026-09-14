import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_WORKOUT } from '@/constants/defaults';
import { validateWorkoutPlan } from '@/domain/workout';
import { trackStarStorage } from '@/services/persistence';
import type { Genre, WorkoutInterval, WorkoutPlan } from '@/types';

interface WorkoutState {
  plan: WorkoutPlan;
  demoMode: boolean;
  setPlan: (plan: WorkoutPlan) => void;
  setDemoMode: (enabled: boolean) => void;
  setGenres: (genres: Genre[]) => void;
  updateInterval: (id: string, patch: Partial<WorkoutInterval>) => void;
  addInterval: () => void;
  removeInterval: (id: string) => void;
  moveInterval: (id: string, direction: -1 | 1) => void;
  resetPlan: () => void;
}

function freshDefaultPlan(): WorkoutPlan {
  return { ...DEFAULT_WORKOUT, intervals: DEFAULT_WORKOUT.intervals.map((interval) => ({ ...interval })) };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      plan: freshDefaultPlan(),
      demoMode: true,
      setPlan: (plan) => set({ plan: validateWorkoutPlan(plan) }),
      setDemoMode: (demoMode) => set({ demoMode }),
      setGenres: (genres) => set((state) => ({ plan: { ...state.plan, genres } })),
      updateInterval: (id, patch) =>
        set((state) => ({
          plan: {
            ...state.plan,
            intervals: state.plan.intervals.map((interval) =>
              interval.id === id
                ? {
                    ...interval,
                    ...patch,
                    durationSec: Math.max(1, Math.round(patch.durationSec ?? interval.durationSec)),
                    targetSpm: Math.min(220, Math.max(100, Math.round(patch.targetSpm ?? interval.targetSpm))),
                  }
                : interval,
            ),
          },
        })),
      addInterval: () =>
        set((state) => ({
          plan: {
            ...state.plan,
            intervals: [
              ...state.plan.intervals,
              {
                id: `interval-${Date.now()}`,
                name: 'Steady Run',
                type: 'steady',
                durationSec: 60,
                targetSpm: 165,
              },
            ],
          },
        })),
      removeInterval: (id) =>
        set((state) => ({
          plan: state.plan.intervals.length <= 1
            ? state.plan
            : { ...state.plan, intervals: state.plan.intervals.filter((interval) => interval.id !== id) },
        })),
      moveInterval: (id, direction) =>
        set((state) => {
          const index = state.plan.intervals.findIndex((interval) => interval.id === id);
          const nextIndex = index + direction;
          if (index < 0 || nextIndex < 0 || nextIndex >= state.plan.intervals.length) return state;
          const intervals = [...state.plan.intervals];
          const current = intervals[index];
          const next = intervals[nextIndex];
          if (!current || !next) return state;
          intervals[index] = next;
          intervals[nextIndex] = current;
          return { plan: { ...state.plan, intervals } };
        }),
      resetPlan: () => set({ plan: freshDefaultPlan(), demoMode: true }),
    }),
    {
      name: 'trackstar.workout.v1',
      storage: createJSONStorage(() => trackStarStorage),
      partialize: ({ plan, demoMode }) => ({ plan, demoMode }),
    },
  ),
);
