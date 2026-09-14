import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useSpotifyAuth } from '@/providers/spotify/SpotifyAuthProvider';
import { useSpotifyStore } from '@/stores/spotifyStore';

export function SpotifyConnectCard() {
  const { configured, authSupported, connect, disconnect, sync } = useSpotifyAuth();
  const { status, profile, tracks, error } = useSpotifyStore();
  const busy = status === 'connecting' || status === 'syncing';
  const connected = Boolean(profile);

  return (
    <View style={[styles.card, connected && styles.connectedCard]}>
      <View style={styles.header}>
        <View style={styles.logo}><FontAwesome name="spotify" size={24} color={colors.spotify} /></View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{connected ? 'SPOTIFY CONNECTED' : 'YOUR MUSIC'}</Text>
          <Text numberOfLines={1} style={styles.title}>{connected ? profile?.displayName : 'Bring your favorites'}</Text>
          <Text style={styles.body}>{connected ? `${tracks.length} top and saved tracks ready for your runs.` : authSupported ? 'Sign in to use your top and saved songs in every run.' : 'Spotify OAuth cannot return to a project running inside Expo Go.'}</Text>
        </View>
        {connected ? <Ionicons name="checkmark-circle" size={22} color={colors.spotify} /> : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {connected ? (
        <View style={styles.actionRow}>
          <Pressable disabled={busy} onPress={() => void sync()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator size="small" color={colors.spotify} /> : <Ionicons name="refresh" size={17} color={colors.spotify} />}
            <Text style={styles.secondaryLabel}>{busy ? 'SYNCING' : 'SYNC MUSIC'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => void disconnect()} style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}>
            <Text style={styles.disconnectLabel}>DISCONNECT</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable disabled={busy} onPress={() => void connect()} style={({ pressed }) => [styles.connectButton, pressed && styles.pressed, busy && styles.disabled]}>
          {busy ? <ActivityIndicator color="#07150C" /> : <FontAwesome name="spotify" size={19} color="#07150C" />}
          <Text style={styles.connectLabel}>{busy ? 'CONNECTING…' : !authSupported ? 'Use web or development build' : configured ? 'Sign in with Spotify' : 'Configure Spotify sign-in'}</Text>
        </Pressable>
      )}
      <Text style={styles.permission}>{authSupported ? 'Reads your profile and music, and controls playback on your Spotify devices. TrackStar never receives your Spotify password.' : 'For Android testing, use the HTTPS web app in Chrome or create a development build with TrackStar’s callback scheme.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: 16 },
  connectedCard: { borderColor: 'rgba(30,215,96,0.3)', backgroundColor: 'rgba(30,215,96,0.055)' },
  header: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,215,96,0.1)' },
  copy: { flex: 1, marginHorizontal: 11 },
  eyebrow: { color: colors.spotify, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginTop: 3 },
  body: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  connectButton: { minHeight: 50, marginTop: 14, borderRadius: 15, backgroundColor: colors.spotify, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  connectLabel: { color: '#07150C', fontSize: 14, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  secondaryButton: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(30,215,96,0.28)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryLabel: { color: colors.spotify, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  disconnectButton: { minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  disconnectLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  permission: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 11, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 10, lineHeight: 15, marginTop: 10 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.6 },
});
