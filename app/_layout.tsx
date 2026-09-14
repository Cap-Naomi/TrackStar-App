import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { SpotifyAuthProvider } from '@/providers/spotify/SpotifyAuthProvider';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') document.body.style.backgroundColor = colors.background;
  }, []);

  return (
    <SafeAreaProvider>
      <SpotifyAuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="plan" />
          <Stack.Screen name="preview" />
          <Stack.Screen name="run" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="summary" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="callback" options={{ animation: 'fade' }} />
        </Stack>
      </SpotifyAuthProvider>
    </SafeAreaProvider>
  );
}
