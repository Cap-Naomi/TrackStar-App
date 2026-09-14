import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';

export function GenreChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, justifyContent: 'center' },
  selected: { backgroundColor: 'rgba(200,255,85,0.13)', borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  selectedLabel: { color: colors.accent },
});
