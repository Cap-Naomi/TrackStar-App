import { Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { openSpotify } from '@/services/spotify';

export function SpotifyButton({ url, label, accessibilityLabel, compact = false }: { url?: string; label?: string; accessibilityLabel?: string; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label ?? 'Open on Spotify'}
      onPress={() => void openSpotify(url)}
      style={({ pressed }) => [styles.button, compact && styles.compact, pressed && styles.pressed]}
    >
      <FontAwesome name="spotify" size={compact ? 17 : 19} color={colors.spotify} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, backgroundColor: 'rgba(30,215,96,0.1)', borderWidth: 1, borderColor: 'rgba(30,215,96,0.28)' },
  compact: { width: 38, minHeight: 38, paddingHorizontal: 0, borderRadius: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  label: { color: colors.spotify, fontSize: 13, fontWeight: '900' },
});
