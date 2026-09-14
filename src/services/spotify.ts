import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

export const MALCOLM_TODD_SPOTIFY_URL = 'https://open.spotify.com/artist/7eKkW1zo5uzW8kUntiiBvz';

export async function openSpotify(url = MALCOLM_TODD_SPOTIFY_URL) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open Spotify', 'Check your connection and try again.');
  }
}
