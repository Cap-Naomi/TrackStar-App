import type { SpotifyProfile, Track } from '@/types';

const API_ROOT = 'https://api.spotify.com/v1';

interface SpotifyImage {
  url: string;
}

interface SpotifyTrackObject {
  id: string;
  name: string;
  duration_ms: number;
  is_local?: boolean;
  uri: string;
  popularity?: number;
  external_urls: { spotify: string };
  artists: { name: string }[];
  album: { name: string; images?: SpotifyImage[] };
}

interface SpotifyMeResponse {
  id: string;
  display_name: string | null;
  product?: string;
  images?: SpotifyImage[];
}

interface SpotifyPage<T> {
  items: T[];
}

interface SpotifySavedTrack {
  track: SpotifyTrackObject;
}

export class SpotifyApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function spotifyGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    let message = `Spotify request failed (${response.status})`;
    try {
      const body = await response.json() as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // Keep the status-based message when Spotify returns a non-JSON error.
    }
    throw new SpotifyApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

function toTrack(track: SpotifyTrackObject, rank: number): Track {
  return {
    id: `spotify-${track.id}`,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(', '),
    album: track.album.name,
    bpm: null,
    genres: ['anything'],
    durationMs: track.duration_ms,
    familiarityScore: Math.max(0.55, 1 - rank * 0.015),
    spotifyUrl: track.external_urls.spotify,
    spotifyUri: track.uri,
    artworkUrl: track.album.images?.[0]?.url,
    artworkColors: ['#27322B', '#101512'],
    source: 'spotify',
  };
}

export async function fetchSpotifyLibrary(accessToken: string): Promise<{ profile: SpotifyProfile; tracks: Track[] }> {
  const [me, trackResults] = await Promise.all([
    spotifyGet<SpotifyMeResponse>(accessToken, '/me'),
    Promise.allSettled([
      spotifyGet<SpotifyPage<SpotifyTrackObject>>(accessToken, '/me/top/tracks?time_range=medium_term&limit=25'),
      spotifyGet<SpotifyPage<SpotifySavedTrack>>(accessToken, '/me/tracks?limit=25'),
    ]),
  ]);

  const [top, saved] = trackResults;
  if (top?.status === 'rejected' && saved?.status === 'rejected') throw top.reason;
  const topTracks = top?.status === 'fulfilled' ? top.value.items : [];
  const savedTracks = saved?.status === 'fulfilled' ? saved.value.items : [];

  const combined = [...topTracks, ...savedTracks.map((item) => item.track)];
  const unique = combined.filter((track, index, all) =>
    !track.is_local && all.findIndex((candidate) => candidate.id === track.id) === index,
  ).slice(0, 40);

  return {
    profile: {
      id: me.id,
      displayName: me.display_name?.trim() || 'Spotify listener',
      imageUrl: me.images?.[0]?.url,
      product: me.product,
    },
    tracks: unique.map(toTrack),
  };
}
