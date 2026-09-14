import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

export function MetricCard({ label, value, suffix, accent }: { label: string; value: string | number; suffix?: string; accent?: boolean }) {
  return (
    <View style={[styles.card, accent && styles.accentCard]}>
      <Text style={[styles.label, accent && styles.accentLabel]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
        {suffix ? <Text style={[styles.suffix, accent && styles.accentLabel]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 138, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: 19, padding: 16 },
  accentCard: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  accentLabel: { color: 'rgba(17,25,7,0.65)' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 8 },
  value: { color: colors.textPrimary, fontSize: 27, lineHeight: 31, fontWeight: '900', fontVariant: ['tabular-nums'] },
  accentValue: { color: colors.accentInk },
  suffix: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
});
