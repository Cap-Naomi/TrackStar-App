import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { trackStarStorage } from '@/services/persistence';
import type { CadenceSource, RunSummary } from '@/types';

interface RunState {
  cadenceSource: CadenceSource;
  lastSummary: RunSummary | null;
  recentRuns: RunSummary[];
  setCadenceSource: (source: CadenceSource) => void;
  saveSummary: (summary: RunSummary) => void;
  clearHistory: () => void;
}

export const useRunStore = create<RunState>()(
  persist(
    (set) => ({
      cadenceSource: 'simulation',
      lastSummary: null,
      recentRuns: [],
      setCadenceSource: (cadenceSource) => set({ cadenceSource }),
      saveSummary: (summary) =>
        set((state) => ({ lastSummary: summary, recentRuns: [summary, ...state.recentRuns].slice(0, 10) })),
      clearHistory: () => set({ lastSummary: null, recentRuns: [] }),
    }),
    {
      name: 'trackstar.runs.v1',
      storage: createJSONStorage(() => trackStarStorage),
      partialize: ({ cadenceSource, lastSummary, recentRuns }) => ({ cadenceSource, lastSummary, recentRuns }),
    },
  ),
);
