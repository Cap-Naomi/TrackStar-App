import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { MetricCard } from '@/components/MetricCard';
import { RunChart } from '@/components/RunChart';
import { AppButton } from '@/components/AppButton';
import { SectionTitle } from '@/components/SectionTitle';
import { colors } from '@/constants/colors';
import { useRunStore } from '@/stores/runStore';
import { formatDuration } from '@/utils/time';

export default function SummaryScreen() {
  const { width } = useWindowDimensions();
  const compact = width <= 375;
  const summary = useRunStore((state) => state.lastSummary);
  if (!summary) {
    return (
      <Screen scroll={false} contentStyle={styles.empty}>
        <Ionicons name="trail-sign-outline" size={52} color={colors.accent} />
        <Text style={styles.emptyTitle}>No finished run yet</Text>
        <Text style={styles.emptyBody}>Complete a TrackStar session and your cadence story will appear here.</Text>
        <View style={styles.emptyButton}><AppButton label="Plan a run" onPress={() => router.replace('/plan')} /></View>
      </Screen>
    );
  }

  const complete = summary.completedIntervals === summary.totalIntervals;
  return (
    <Screen>
      <View style={styles.top}><BrandMark compact /><Text style={styles.date}>{new Date(summary.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text></View>
      <View style={[styles.hero, compact && styles.compactHero]}>
        <LinearGradient colors={['rgba(200,255,85,0.22)', 'rgba(200,255,85,0.02)']} style={[styles.scoreHalo, compact && styles.compactScoreHalo]}>
          <View style={[styles.scoreCircle, compact && styles.compactScoreCircle]}><Text style={[styles.score, compact && styles.compactScore]}>{summary.beatMatchPercent}</Text><Text style={[styles.percent, compact && styles.compactPercent]}>%</Text></View>
        </LinearGradient>
        <Text style={styles.eyebrow}>{complete ? 'WORKOUT COMPLETE' : 'RUN SAVED'}</Text>
        <Text style={styles.title}>{summary.beatMatchPercent >= 85 ? 'You found the pocket.' : summary.beatMatchPercent >= 65 ? 'Rhythm is building.' : 'Every step counts.'}</Text>
        <Text style={styles.subtitle}>Your overall Beat Match score</Text>
      </View>

      <View style={styles.metrics}>
        <MetricCard label="AVG CADENCE" value={summary.averageCadence} suffix="SPM" accent />
        <MetricCard label="TIME IN TARGET" value={`${summary.timeInTargetPercent}%`} />
        <MetricCard label="CONSISTENCY" value={`${summary.cadenceConsistency}%`} />
        <MetricCard label="EST. STEPS" value={summary.estimatedSteps} />
      </View>

      <View style={[styles.sessionRow, compact && styles.compactSessionRow]}>
        <View style={[styles.sessionItem, compact && styles.compactSessionItem]}><Ionicons name="time-outline" size={18} color={colors.cyan} /><View><Text style={styles.sessionLabel}>DURATION</Text><Text style={styles.sessionValue}>{formatDuration(summary.durationSec)}</Text></View></View>
        <View style={styles.sessionDivider} />
        <View style={[styles.sessionItem, compact && styles.compactSessionItem]}><Ionicons name="flag-outline" size={18} color={colors.warning} /><View><Text style={styles.sessionLabel}>INTERVALS</Text><Text style={styles.sessionValue}>{summary.completedIntervals}/{summary.totalIntervals}</Text></View></View>
        <View style={styles.sessionDivider} />
        <View style={[styles.sessionItem, compact && styles.compactSessionItem]}><Ionicons name="locate-outline" size={18} color="#8F9BFF" /><View><Text style={styles.sessionLabel}>AVG TARGET</Text><Text style={styles.sessionValue}>{summary.averageTarget}</Text></View></View>
      </View>

      <SectionTitle title="The cadence story" detail={`${summary.timeline.length} data points`} />
      <RunChart points={summary.timeline} />

      <View style={styles.insight}>
        <View style={styles.insightIcon}><Ionicons name="sparkles" size={20} color={colors.accentInk} /></View>
        <View style={styles.insightCopy}><Text style={styles.insightTitle}>Coach note</Text><Text style={styles.insightBody}>{summary.timeInTargetPercent >= 70 ? 'Strong control. You stayed close to the plan while letting the beat do the coaching.' : 'Try following the kick drum on your next run. Shorter, lighter steps will make the rhythm easier to hold.'}</Text></View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Run it again" icon="refresh" onPress={() => router.replace('/preview')} />
        <AppButton label="Build another workout" icon="create-outline" variant="secondary" onPress={() => router.replace('/plan')} />
        <AppButton label="Back to start" variant="ghost" onPress={() => router.replace('/')} />
      </View>
      <Text style={styles.disclaimer}>Fitness estimates only. TrackStar is not a medical device.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
  compactHero: { paddingTop: 4, paddingBottom: 18 },
  scoreHalo: { width: 162, height: 162, borderRadius: 81, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  compactScoreHalo: { width: 140, height: 140, borderRadius: 70 },
  scoreCircle: { width: 124, height: 124, borderRadius: 62, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: colors.background, borderWidth: 2, borderColor: colors.accent },
  compactScoreCircle: { width: 108, height: 108, borderRadius: 54 },
  score: { color: colors.textPrimary, fontSize: 61, fontWeight: '900', letterSpacing: -4, fontVariant: ['tabular-nums'] },
  compactScore: { fontSize: 52 },
  percent: { color: colors.accent, fontSize: 20, fontWeight: '900', alignSelf: 'flex-start', marginTop: 38 },
  compactPercent: { fontSize: 17, marginTop: 34 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 7, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: 19, paddingVertical: 15, marginBottom: 20 },
  compactSessionRow: { paddingHorizontal: 4 },
  sessionItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  compactSessionItem: { flexDirection: 'column', gap: 4 },
  sessionDivider: { width: 1, height: 28, backgroundColor: colors.divider },
  sessionLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  sessionValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '900', marginTop: 2 },
  insight: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(200,255,85,0.075)', borderWidth: 1, borderColor: 'rgba(200,255,85,0.2)', borderRadius: 19, padding: 15, marginTop: 14 },
  insightIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  insightCopy: { flex: 1 },
  insightTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  insightBody: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 4 },
  actions: { gap: 10, marginTop: 22 },
  disclaimer: { color: colors.textMuted, textAlign: 'center', fontSize: 9, marginTop: 16 },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', marginTop: 18 },
  emptyBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 8 },
  emptyButton: { width: '100%', marginTop: 24 },
});
