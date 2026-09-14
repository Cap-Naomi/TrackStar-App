import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { trackStarStorage } from '@/services/persistence';
import type { Genre } from '@/types';

interface ProfileState {
  heightCm: number;
  preferredUnit: 'metric' | 'imperial';
  genres: Genre[];
  onboardingComplete: boolean;
  setHeight: (heightCm: number) => void;
  setUnit: (unit: 'metric' | 'imperial') => void;
  toggleGenre: (genre: Genre) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const INITIAL_PROFILE = {
  heightCm: 175,
  preferredUnit: 'metric' as const,
  genres: ['pop', 'indie'] as Genre[],
  onboardingComplete: false,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...INITIAL_PROFILE,
      setHeight: (heightCm) => set({ heightCm }),
      setUnit: (preferredUnit) => set({ preferredUnit }),
      toggleGenre: (genre) =>
        set((state) => ({
          genres: state.genres.includes(genre)
            ? state.genres.filter((value) => value !== genre)
            : [...state.genres.filter((value) => value !== 'anything'), genre],
        })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      reset: () => set(INITIAL_PROFILE),
    }),
    {
      name: 'trackstar.profile.v1',
      storage: createJSONStorage(() => trackStarStorage),
      partialize: ({ heightCm, preferredUnit, genres, onboardingComplete }) => ({
        heightCm,
        preferredUnit,
        genres,
        onboardingComplete,
      }),
    },
  ),
);
