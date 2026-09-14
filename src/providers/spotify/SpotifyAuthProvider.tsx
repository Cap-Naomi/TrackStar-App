import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  resolveSpotifyClientId,
  resolveSpotifyRedirectUri,
  SPOTIFY_WEB_CALLBACK_STORAGE_KEY,
} from '@/providers/spotify/spotifyAuthConfig';
import { fetchSpotifyLibrary, SpotifyApiError } from '@/services/spotifyApi';
import {
  clearSpotifyToken,
  readSpotifyToken,
  saveSpotifyToken,
  type StoredSpotifyToken,
} from '@/services/spotifyTokenStorage';
import { useSpotifyStore } from '@/stores/spotifyStore';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const SPOTIFY_SCOPES = ['user-read-private', 'user-top-read', 'user-library-read'];
const clientId = resolveSpotifyClientId(process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID);

interface SpotifyAuthContextValue {
  configured: boolean;
  redirectUri: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sync: () => Promise<void>;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | null>(null);

function tokenIsFresh(token: StoredSpotifyToken): boolean {
  if (!token.expiresIn) return true;
  return token.issuedAt + token.expiresIn - 60 > Date.now() / 1000;
}

function toStoredToken(response: AuthSession.TokenResponse, previous?: StoredSpotifyToken): StoredSpotifyToken {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? previous?.refreshToken,
    expiresIn: response.expiresIn,
    issuedAt: response.issuedAt,
    scope: response.scope ?? previous?.scope,
  };
}

async function getFreshToken(): Promise<StoredSpotifyToken | null> {
  const stored = await readSpotifyToken();
  if (!stored || tokenIsFresh(stored)) return stored;
  if (!stored.refreshToken || !clientId) return null;
  const response = await AuthSession.refreshAsync({
    clientId,
    refreshToken: stored.refreshToken,
    scopes: SPOTIFY_SCOPES,
  }, SPOTIFY_DISCOVERY);
  const refreshed = toStoredToken(response, stored);
  await saveSpotifyToken(refreshed);
  return refreshed;
}

export function SpotifyAuthProvider({ children }: PropsWithChildren) {
  const generatedRedirectUri = AuthSession.makeRedirectUri({
    scheme: 'trackstar-spotify',
    path: 'callback',
  });
  const redirectUri = resolveSpotifyRedirectUri(
    Platform.OS,
    generatedRedirectUri,
    process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI,
  );
  const setStatus = useSpotifyStore((state) => state.setStatus);
  const setConnection = useSpotifyStore((state) => state.setConnection);
  const setError = useSpotifyStore((state) => state.setError);
  const clear = useSpotifyStore((state) => state.clear);
  const processingCode = useRef<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: clientId || 'spotify-client-id-not-configured',
    redirectUri,
    scopes: SPOTIFY_SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  }, SPOTIFY_DISCOVERY);

  const syncWithToken = useCallback(async (token: StoredSpotifyToken) => {
    setStatus('syncing');
    const library = await fetchSpotifyLibrary(token.accessToken);
    setConnection(library.profile, library.tracks);
  }, [setConnection, setStatus]);

  const handleError = useCallback(async (error: unknown) => {
    let message = error instanceof Error ? error.message : 'Spotify could not be connected.';
    if (error instanceof SpotifyApiError && error.status === 403) {
      message = 'Spotify denied access. For a development-mode app, confirm the app owner has Premium and this listener is allowlisted.';
    } else if (error instanceof SpotifyApiError && error.status === 429) {
      message = 'Spotify is rate-limiting syncs. Wait a moment, then try again.';
    }
    if (error instanceof SpotifyApiError && (error.status === 401 || error.status === 403)) {
      await clearSpotifyToken();
      clear();
    }
    setError(message);
  }, [clear, setError]);

  const sync = useCallback(async () => {
    if (!clientId) {
      Alert.alert('Spotify setup needed', `Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID and register this redirect URI in the Spotify dashboard:\n\n${redirectUri}`);
      return;
    }
    try {
      const token = await getFreshToken();
      if (!token) {
        clear();
        return;
      }
      await syncWithToken(token);
    } catch (error) {
      await handleError(error);
    }
  }, [clear, handleError, redirectUri, syncWithToken]);

  useEffect(() => {
    if (clientId) void sync();
    else setStatus(useSpotifyStore.getState().profile ? 'connected' : 'disconnected');
  }, [setStatus, sync]);

  const handleAuthResponse = useCallback((authResponse: AuthSession.AuthSessionResult) => {
    if (authResponse.type === 'dismiss' || authResponse.type === 'cancel') {
      if (!processingCode.current) setStatus('disconnected');
      return;
    }
    if (authResponse.type === 'error') {
      setError(authResponse.error?.description ?? 'Spotify authorization was denied.');
      return;
    }
    if (authResponse.type !== 'success') return;
    const code = authResponse.params.code;
    if (!code || !request?.codeVerifier || processingCode.current === code) return;
    processingCode.current = code;
    void (async () => {
      try {
        setStatus('syncing');
        const tokenResponse = await AuthSession.exchangeCodeAsync({
          clientId,
          code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier! },
        }, SPOTIFY_DISCOVERY);
        const token = toStoredToken(tokenResponse);
        await saveSpotifyToken(token);
        await syncWithToken(token);
      } catch (error) {
        await handleError(error);
      }
    })();
  }, [handleError, redirectUri, request, setError, setStatus, syncWithToken]);

  useEffect(() => {
    if (response) handleAuthResponse(response);
  }, [handleAuthResponse, response]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !request) return;

    const receiveCallback = (event: StorageEvent) => {
      if (event.key !== SPOTIFY_WEB_CALLBACK_STORAGE_KEY || !event.newValue) return;
      localStorage.removeItem(SPOTIFY_WEB_CALLBACK_STORAGE_KEY);
      handleAuthResponse(request.parseReturnUrl(event.newValue));
    };

    window.addEventListener('storage', receiveCallback);
    return () => window.removeEventListener('storage', receiveCallback);
  }, [handleAuthResponse, request]);

  const connect = useCallback(async () => {
    if (!clientId) {
      Alert.alert('Spotify setup needed', `Create a Spotify developer app, set EXPO_PUBLIC_SPOTIFY_CLIENT_ID, and allowlist this exact redirect URI:\n\n${redirectUri}`);
      return;
    }
    if (!request) {
      setError('Spotify sign-in is still loading. Try again in a moment.');
      return;
    }
    try {
      if (Platform.OS === 'web') localStorage.removeItem(SPOTIFY_WEB_CALLBACK_STORAGE_KEY);
      setStatus('connecting');
      await promptAsync();
    } catch (error) {
      await handleError(error);
    }
  }, [handleError, promptAsync, redirectUri, request, setError, setStatus]);

  const disconnect = useCallback(async () => {
    await clearSpotifyToken();
    clear();
  }, [clear]);

  const value = useMemo(() => ({
    configured: Boolean(clientId),
    redirectUri,
    connect,
    disconnect,
    sync,
  }), [connect, disconnect, redirectUri, sync]);

  return <SpotifyAuthContext.Provider value={value}>{children}</SpotifyAuthContext.Provider>;
}

export function useSpotifyAuth() {
  const context = useContext(SpotifyAuthContext);
  if (!context) throw new Error('useSpotifyAuth must be used inside SpotifyAuthProvider');
  return context;
}
