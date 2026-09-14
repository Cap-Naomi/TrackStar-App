import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { trackStarStorage } from '@/services/persistence';
import type { SpotifyProfile, Track } from '@/types';

export type SpotifyStatus = 'disconnected' | 'connecting' | 'syncing' | 'connected' | 'error';

interface SpotifyState {
  status: SpotifyStatus;
  profile: SpotifyProfile | null;
  tracks: Track[];
  error: string | null;
  setStatus: (status: SpotifyStatus) => void;
  setConnection: (profile: SpotifyProfile, tracks: Track[]) => void;
  setError: (error: string) => void;
  clear: () => void;
}

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set) => ({
      status: 'disconnected',
      profile: null,
      tracks: [],
      error: null,
      setStatus: (status) => set({ status, error: null }),
      setConnection: (profile, tracks) => set({ status: 'connected', profile, tracks, error: null }),
      setError: (error) => set({ status: 'error', error }),
      clear: () => set({ status: 'disconnected', profile: null, tracks: [], error: null }),
    }),
    {
      name: 'trackstar.spotify.library.v1',
      storage: createJSONStorage(() => trackStarStorage),
      partialize: ({ profile, tracks }) => ({ profile, tracks }),
      onRehydrateStorage: () => (state) => {
        if (state?.profile && state.tracks.length > 0) state.setStatus('syncing');
      },
    },
  ),
);
