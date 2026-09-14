import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/colors';

export default function SpotifyCallbackScreen() {
  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.spotify} />
        <Text style={styles.title}>Finishing Spotify sign-in…</Text>
        <Text style={styles.body}>You can return to TrackStar if this window does not close automatically.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: 22, padding: 28 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: 'center' },
});
