export const DEFAULT_SPOTIFY_CLIENT_ID = '81903a11e1284ca0a5215a98be9e1108';
export const SPOTIFY_WEB_CALLBACK_STORAGE_KEY = 'trackstar.spotify.auth.callback.v1';

export function resolveSpotifyClientId(configuredClientId?: string): string {
  return configuredClientId?.trim() || DEFAULT_SPOTIFY_CLIENT_ID;
}

export function resolveSpotifyRedirectUri(
  platform: string,
  generatedRedirectUri: string,
  configuredRedirectUri?: string,
): string {
  const configured = configuredRedirectUri?.trim();
  if (!configured) return generatedRedirectUri;

  // Expo's web auth popup must return to the same HTTP(S) origin so it can
  // deliver the authorization result to the opener. A native custom scheme
  // from a shared .env file cannot complete that browser handshake.
  if (platform === 'web' && !/^https?:\/\//i.test(configured)) {
    return generatedRedirectUri;
  }

  return configured;
}

export function publishSpotifyWebCallback(
  callbackUrl: string,
  storage: Pick<Storage, 'setItem'>,
): void {
  storage.setItem(SPOTIFY_WEB_CALLBACK_STORAGE_KEY, callbackUrl);
}
