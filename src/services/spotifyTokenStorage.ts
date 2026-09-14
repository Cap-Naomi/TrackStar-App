import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'trackstar.spotify.token.v1';

export interface StoredSpotifyToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  issuedAt: number;
  scope?: string;
}

export async function readSpotifyToken(): Promise<StoredSpotifyToken | null> {
  const value = Platform.OS === 'web'
    ? await AsyncStorage.getItem(TOKEN_KEY)
    : await SecureStore.getItemAsync(TOKEN_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredSpotifyToken;
  } catch {
    await clearSpotifyToken();
    return null;
  }
}

export async function saveSpotifyToken(token: StoredSpotifyToken): Promise<void> {
  const value = JSON.stringify(token);
  if (Platform.OS === 'web') await AsyncStorage.setItem(TOKEN_KEY, value);
  else await SecureStore.setItemAsync(TOKEN_KEY, value);
}

export async function clearSpotifyToken(): Promise<void> {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
