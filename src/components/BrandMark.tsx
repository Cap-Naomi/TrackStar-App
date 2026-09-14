import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, compact && styles.compactMark]}>
        <Ionicons name="pulse" size={compact ? 18 : 22} color={colors.accentInk} />
      </View>
      <Text style={[styles.wordmark, compact && styles.compactText]}>TRACKSTAR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  compactMark: { width: 30, height: 30, borderRadius: 10 },
  wordmark: { color: colors.textPrimary, fontSize: 18, lineHeight: 22, fontWeight: '900', letterSpacing: 1.6 },
  compactText: { fontSize: 15, letterSpacing: 1.3 },
});
