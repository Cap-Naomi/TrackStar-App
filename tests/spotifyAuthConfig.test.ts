import {
  DEFAULT_SPOTIFY_CLIENT_ID,
  publishSpotifyWebCallback,
  resolveSpotifyClientId,
  resolveSpotifyRedirectUri,
  SPOTIFY_WEB_CALLBACK_STORAGE_KEY,
} from '@/providers/spotify/spotifyAuthConfig';

describe('Spotify auth configuration', () => {
  it('uses the bundled public client ID when no environment override exists', () => {
    expect(resolveSpotifyClientId()).toBe(DEFAULT_SPOTIFY_CLIENT_ID);
    expect(resolveSpotifyClientId('  custom-client-id  ')).toBe('custom-client-id');
  });

  it('uses the generated custom-scheme callback on native platforms', () => {
    expect(resolveSpotifyRedirectUri('ios', 'trackstar-spotify://callback')).toBe(
      'trackstar-spotify://callback',
    );
    expect(resolveSpotifyRedirectUri(
      'android',
      'trackstar-spotify://callback',
      ' custom-login://callback ',
    )).toBe('custom-login://callback');
  });

  it('does not let a native callback break Expo web auth completion', () => {
    const generated = 'http://127.0.0.1:8081/callback';
    expect(resolveSpotifyRedirectUri('web', generated, 'trackstar-spotify://callback')).toBe(generated);
    expect(resolveSpotifyRedirectUri('web', generated, 'https://trackstar.example/callback')).toBe(
      'https://trackstar.example/callback',
    );
  });

  it('publishes a web callback for the opener-independent handoff', () => {
    const storage = { setItem: jest.fn() };
    const callbackUrl = 'http://127.0.0.1:8081/callback?code=code&state=state';

    publishSpotifyWebCallback(callbackUrl, storage);

    expect(storage.setItem).toHaveBeenCalledWith(SPOTIFY_WEB_CALLBACK_STORAGE_KEY, callbackUrl);
  });
});
