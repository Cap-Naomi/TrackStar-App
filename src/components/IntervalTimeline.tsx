import { StyleSheet, Text, View } from 'react-native';
import { colors, intervalColors } from '@/constants/colors';
import type { WorkoutInterval } from '@/types';
import { totalWorkoutDuration } from '@/domain/intervals';

export function IntervalTimeline({ intervals, showLabels = true }: { intervals: WorkoutInterval[]; showLabels?: boolean }) {
  const total = Math.max(1, totalWorkoutDuration(intervals));
  return (
    <View>
      <View style={styles.bar}>
        {intervals.map((interval, index) => (
          <View
            key={interval.id}
            style={[
              styles.segment,
              { flex: interval.durationSec / total, backgroundColor: intervalColors[interval.type] },
              index === 0 && styles.first,
              index === intervals.length - 1 && styles.last,
            ]}
          />
        ))}
      </View>
      {showLabels ? (
        <View style={styles.labels}>
          {intervals.map((interval) => (
            <View key={interval.id} style={styles.labelItem}>
              <View style={[styles.dot, { backgroundColor: intervalColors[interval.type] }]} />
              <Text numberOfLines={1} style={styles.label}>{interval.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 10, flexDirection: 'row', gap: 3, overflow: 'hidden' },
  segment: { minWidth: 6 },
  first: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  last: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  labels: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  labelItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
