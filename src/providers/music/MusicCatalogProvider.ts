import type { Genre, Track } from '@/types';

export interface MusicCatalogProvider {
  getCandidates(input: { genres: Genre[]; targetSpm: number; excludedTrackIds: string[] }): Promise<Track[]>;
}
