export const SPOTIFY_LIBRARY_SCOPES = [
  'user-read-private',
  'user-top-read',
  'user-library-read',
] as const;

export const SPOTIFY_PLAYBACK_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
] as const;

export const SPOTIFY_SCOPES = [
  ...SPOTIFY_LIBRARY_SCOPES,
  ...SPOTIFY_PLAYBACK_SCOPES,
];

export function hasSpotifyPlaybackScopes(scope?: string): boolean {
  if (!scope) return false;
  const granted = new Set(scope.split(/\s+/).filter(Boolean));
  return SPOTIFY_PLAYBACK_SCOPES.every((required) => granted.has(required));
}
