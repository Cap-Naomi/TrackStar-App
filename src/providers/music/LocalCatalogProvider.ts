import { TRACKS } from '@/data/tracks';
import type { MusicCatalogProvider } from './MusicCatalogProvider';

export class LocalCatalogProvider implements MusicCatalogProvider {
  async getCandidates(input: Parameters<MusicCatalogProvider['getCandidates']>[0]) {
    const available = TRACKS.filter((track) => !input.excludedTrackIds.includes(track.id));
    return available.length > 0 ? available : TRACKS;
  }
}
