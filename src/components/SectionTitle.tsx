import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 6 },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  detail: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});
