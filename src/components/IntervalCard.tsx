import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, intervalColors } from '@/constants/colors';
import type { WorkoutInterval } from '@/types';
import { formatLongDuration } from '@/utils/time';

interface IntervalCardProps {
  interval: WorkoutInterval;
  index: number;
  total: number;
  onChange: (patch: Partial<WorkoutInterval>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

function Stepper({ value, suffix, step, onChange }: { value: number; suffix: string; step: number; onChange: (next: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepButton} onPress={() => onChange(value - step)}><Ionicons name="remove" size={18} color={colors.textPrimary} /></Pressable>
      <View style={styles.stepValueWrap}>
        <Text style={styles.stepValue}>{suffix === 'SPM' ? value : formatLongDuration(value)}</Text>
        {suffix === 'SPM' ? <Text style={styles.stepSuffix}>{suffix}</Text> : null}
      </View>
      <Pressable style={styles.stepButton} onPress={() => onChange(value + step)}><Ionicons name="add" size={18} color={colors.textPrimary} /></Pressable>
    </View>
  );
}

export function IntervalCard({ interval, index, total, onChange, onMove, onRemove }: IntervalCardProps) {
  const accent = intervalColors[interval.type];
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={[styles.index, { backgroundColor: accent }]}><Text style={styles.indexText}>{index + 1}</Text></View>
        <View style={styles.headingCopy}>
          <Text style={styles.name}>{interval.name}</Text>
          <Text style={[styles.type, { color: accent }]}>{interval.type.toUpperCase()}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable disabled={index === 0} onPress={() => onMove(-1)} hitSlop={8}><Ionicons name="arrow-up" size={18} color={index === 0 ? colors.textMuted : colors.textSecondary} /></Pressable>
          <Pressable disabled={index === total - 1} onPress={() => onMove(1)} hitSlop={8}><Ionicons name="arrow-down" size={18} color={index === total - 1 ? colors.textMuted : colors.textSecondary} /></Pressable>
          <Pressable disabled={total === 1} onPress={onRemove} hitSlop={8}><Ionicons name="trash-outline" size={18} color={total === 1 ? colors.textMuted : colors.danger} /></Pressable>
        </View>
      </View>
      <View style={styles.controls}>
        <View style={styles.control}><Text style={styles.label}>DURATION</Text><Stepper value={interval.durationSec} suffix="SEC" step={15} onChange={(durationSec) => onChange({ durationSec })} /></View>
        <View style={styles.control}><Text style={styles.label}>TARGET</Text><Stepper value={interval.targetSpm} suffix="SPM" step={2} onChange={(targetSpm) => onChange({ targetSpm })} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center' },
  index: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  indexText: { color: colors.accentInk, fontWeight: '900' },
  headingCopy: { flex: 1, marginLeft: 11 },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  type: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 17, paddingHorizontal: 4 },
  controls: { flexDirection: 'row', gap: 10, marginTop: 16 },
  control: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 7 },
  stepper: { minHeight: 44, borderRadius: 13, backgroundColor: colors.backgroundSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.divider },
  stepButton: { width: 37, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  stepValueWrap: { alignItems: 'center' },
  stepValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stepSuffix: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
});
