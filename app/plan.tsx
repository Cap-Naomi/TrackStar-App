import { StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { IntervalCard } from '@/components/IntervalCard';
import { AppButton } from '@/components/AppButton';
import { SectionTitle } from '@/components/SectionTitle';
import { IntervalTimeline } from '@/components/IntervalTimeline';
import { colors } from '@/constants/colors';
import { totalWorkoutDuration } from '@/domain/intervals';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatLongDuration } from '@/utils/time';

export default function PlanScreen() {
  const { plan, demoMode, setDemoMode, updateInterval, addInterval, removeInterval, moveInterval } = useWorkoutStore();
  const total = totalWorkoutDuration(plan.intervals);
  return (
    <Screen footer={<AppButton label="Preview soundtrack" icon="arrow-forward" onPress={() => router.push('/preview')} />}>
      <Header eyebrow="WORKOUT BUILDER" title="Plan your rhythm" description="Set the cadence for each chapter. TrackStar will handle the transitions." />

      <View style={styles.overview}>
        <View style={styles.overviewTop}>
          <View><Text style={styles.overviewName}>{plan.name}</Text><Text style={styles.overviewMeta}>{plan.intervals.length} intervals · {formatLongDuration(total)}</Text></View>
          <View style={styles.bpmIcon}><Ionicons name="pulse" size={22} color={colors.accent} /></View>
        </View>
        <IntervalTimeline intervals={plan.intervals} />
      </View>

      <View style={styles.demoCard}>
        <View style={styles.demoIcon}><Ionicons name="flash" size={19} color={colors.accentInk} /></View>
        <View style={styles.demoCopy}><Text style={styles.demoTitle}>Hackathon Demo Mode</Text><Text style={styles.demoBody}>Compresses this workout to 46 seconds.</Text></View>
        <Switch value={demoMode} onValueChange={setDemoMode} trackColor={{ false: colors.divider, true: colors.accentDark }} thumbColor={demoMode ? colors.accent : colors.textSecondary} />
      </View>

      <SectionTitle title="Intervals" detail="Tap ± to tune" />
      {plan.intervals.map((interval, index) => (
        <IntervalCard
          key={interval.id}
          interval={interval}
          index={index}
          total={plan.intervals.length}
          onChange={(patch) => updateInterval(interval.id, patch)}
          onMove={(direction) => moveInterval(interval.id, direction)}
          onRemove={() => removeInterval(interval.id)}
        />
      ))}
      <AppButton label="Add interval" icon="add" variant="secondary" onPress={addInterval} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  overview: { backgroundColor: colors.surfaceRaised, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.divider, marginBottom: 12 },
  overviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  overviewName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  overviewMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  bpmIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(200,255,85,0.1)', alignItems: 'center', justifyContent: 'center' },
  demoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200,255,85,0.075)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(200,255,85,0.22)', padding: 14, marginBottom: 20 },
  demoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  demoCopy: { flex: 1, marginLeft: 11 },
  demoTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  demoBody: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
});
