import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppButton } from '@/components/AppButton';
import { IntervalTimeline } from '@/components/IntervalTimeline';
import { AlbumArt } from '@/components/AlbumArt';
import { SectionTitle } from '@/components/SectionTitle';
import { SpotifyButton } from '@/components/SpotifyButton';
import { TRACKS } from '@/data/tracks';
import { colors, intervalColors } from '@/constants/colors';
import { compressWorkoutForDemo } from '@/domain/workout';
import { rankTracks } from '@/domain/matching';
import { totalWorkoutDuration } from '@/domain/intervals';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useRunStore } from '@/stores/runStore';
import { useSpotifyStore } from '@/stores/spotifyStore';
import { formatDuration, formatLongDuration } from '@/utils/time';

export default function PreviewScreen() {
  const { width } = useWindowDimensions();
  const compact = width <= 375;
  const spotifyTracks = useSpotifyStore((state) => state.tracks);
  const spotifyProfile = useSpotifyStore((state) => state.profile);
  const { plan, demoMode } = useWorkoutStore();
  const cadenceSource = useRunStore((state) => state.cadenceSource);
  const setCadenceSource = useRunStore((state) => state.setCadenceSource);
  const activePlan = demoMode ? compressWorkoutForDemo(plan) : plan;
  const catalog = spotifyTracks.length > 0 ? spotifyTracks : TRACKS;
  const queuedTrackIds: string[] = [];
  const firstTracks = activePlan.intervals.map((interval) => {
    const match = rankTracks({ tracks: catalog, desiredTempo: interval.targetSpm, selectedGenres: activePlan.genres, recentlyPlayed: queuedTrackIds })[0]!;
    queuedTrackIds.push(match.track.id);
    return match;
  });

  return (
    <Screen footer={<AppButton label="Start run" icon="play" onPress={() => router.push('/run')} />}>
      <Header eyebrow="RUN PREVIEW" title="Soundtrack ready" description={spotifyProfile ? `Built from ${spotifyProfile.displayName}'s Spotify favorites. Spotify BPM is unavailable, so these are personal picks rather than verified tempo matches.` : 'Each track is chosen to meet your cadence without making the rhythm feel forced.'} />

      <View style={styles.heroCard}>
        <View style={styles.heroTop}><View style={styles.heroCopy}><Text style={styles.planName}>{activePlan.name}</Text><Text style={styles.duration}>{formatLongDuration(totalWorkoutDuration(activePlan.intervals))}</Text></View><View style={styles.ready}><FontAwesome name="spotify" size={13} color={colors.spotify} /><Text style={styles.readyText}>SPOTIFY PICKS</Text></View></View>
        <IntervalTimeline intervals={activePlan.intervals} />
      </View>

      <SectionTitle title="Cadence source" detail="Switch anytime before start" />
      <View style={styles.sourceRow}>
        {([
          { value: 'simulation' as const, icon: 'options-outline' as const, title: 'Demo', body: 'Guaranteed sequence' },
          { value: 'sensor' as const, icon: 'phone-portrait-outline' as const, title: 'Real sensor', body: 'Jog with your phone' },
        ]).map((item) => (
          <Pressable key={item.value} accessibilityRole="button" onPress={() => setCadenceSource(item.value)} style={({ pressed }) => [styles.sourceCard, compact && styles.compactSourceCard, cadenceSource === item.value && styles.sourceActive, pressed && styles.pressed]}>
            <Ionicons name={item.icon} size={22} color={cadenceSource === item.value ? colors.accent : colors.textSecondary} />
            <Text style={styles.sourceTitle}>{item.title}</Text><Text style={styles.sourceBody}>{item.body}</Text>
            {cadenceSource === item.value ? <Ionicons style={styles.check} name="checkmark-circle" size={18} color={colors.accent} /> : null}
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Interval mix" detail={`${new Set(firstTracks.map((item) => item.track.id)).size} tracks queued`} />
      <View style={styles.trackList}>
        {activePlan.intervals.map((interval, index) => {
          const start = activePlan.intervals.slice(0, index).reduce((total, item) => total + item.durationSec, 0);
          const end = start + interval.durationSec;
          const match = firstTracks[index]!;
          return (
            <View style={styles.trackRow} key={interval.id}>
              <AlbumArt track={match.track} size={compact ? 50 : 58} />
              <View style={styles.trackCopy}>
                <View style={styles.intervalLine}><View style={[styles.smallDot, { backgroundColor: intervalColors[interval.type] }]} /><Text style={styles.intervalText}>{interval.name} · {formatDuration(start)}–{formatDuration(end)}</Text></View>
                <Text numberOfLines={1} style={styles.trackTitle}>{match.track.title}</Text>
                <Text numberOfLines={1} style={styles.trackMeta}>{match.track.artist} · {match.mode === 'unknown' ? 'Personal pick' : match.mode === 'half-time' ? `${match.track.bpm} BPM ×2` : `${match.track.bpm} BPM`}</Text>
              </View>
              <View style={styles.trackActions}><View style={styles.targetPill}><Text style={[styles.targetValue, compact && styles.compactTargetValue]}>{interval.targetSpm}</Text><Text style={styles.targetLabel}>SPM</Text></View><SpotifyButton compact url={match.track.spotifyUrl} accessibilityLabel={`Open ${match.track.title} on Spotify`} /></View>
            </View>
          );
        })}
      </View>
      <View style={styles.offlineNote}><Ionicons name="information-circle-outline" size={19} color={colors.cyan} /><Text style={styles.offlineCopy}>{spotifyProfile ? 'Open Spotify on your phone, computer, or Web Player before starting. TrackStar will control that Spotify device.' : "Without Spotify connected, the center run control plays TrackStar's bundled cadence beat."}</Text></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: colors.surfaceRaised, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.divider, marginBottom: 22 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  heroCopy: { flex: 1, paddingRight: 8 },
  planName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  duration: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(105,228,214,0.08)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  readyText: { color: colors.spotify, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  sourceRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  sourceCard: { flex: 1, minHeight: 108, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: 18, padding: 14 },
  compactSourceCard: { minHeight: 100, padding: 12 },
  sourceActive: { borderColor: colors.accent, backgroundColor: 'rgba(200,255,85,0.07)' },
  pressed: { opacity: 0.74 },
  sourceTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 9 },
  sourceBody: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  check: { position: 'absolute', top: 12, right: 12 },
  trackList: { gap: 9 },
  trackRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: colors.divider, padding: 10 },
  trackCopy: { flex: 1, marginLeft: 11 },
  intervalLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  smallDot: { width: 6, height: 6, borderRadius: 3 },
  intervalText: { color: colors.textSecondary, fontSize: 9, fontWeight: '700' },
  trackTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 4 },
  trackMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  targetPill: { alignItems: 'center', minWidth: 46 },
  targetValue: { color: colors.accent, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  compactTargetValue: { fontSize: 15 },
  targetLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  trackActions: { alignItems: 'center', gap: 5, marginLeft: 4 },
  offlineNote: { flexDirection: 'row', gap: 10, borderRadius: 16, backgroundColor: 'rgba(105,228,214,0.06)', padding: 14, marginTop: 15 },
  offlineCopy: { flex: 1, color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
});
