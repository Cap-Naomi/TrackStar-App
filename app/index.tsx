import { Keyboard, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { AppButton } from '@/components/AppButton';
import { SpotifyConnectCard } from '@/components/SpotifyConnectCard';
import { GenreChip } from '@/components/GenreChip';
import { GENRES } from '@/constants/defaults';
import { colors } from '@/constants/colors';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';

const benefits = [
  { icon: 'pulse-outline' as const, label: 'Live cadence' },
  { icon: 'musical-notes-outline' as const, label: 'Adaptive music' },
  { icon: 'cloud-offline-outline' as const, label: 'Offline ready' },
];

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width <= 375;
  const short = height <= 740;
  const { heightCm, preferredUnit, genres, setHeight, setUnit, toggleGenre, completeOnboarding } = useProfileStore();
  const setGenres = useWorkoutStore((state) => state.setGenres);
  const displayHeight = preferredUnit === 'metric' ? String(heightCm) : String(Math.round(heightCm / 2.54));

  const continueToPlan = () => {
    Keyboard.dismiss();
    completeOnboarding();
    setGenres(genres.length > 0 ? genres : ['anything']);
    router.push('/plan');
  };

  return (
    <Screen>
      <View style={styles.brandRow}><BrandMark /><View style={styles.prototype}><Text style={styles.prototypeText}>MVP</Text></View></View>
      <View style={[styles.hero, short && styles.shortHero]}>
        <LinearGradient colors={['rgba(200,255,85,0.22)', 'rgba(105,228,214,0.02)']} style={[styles.heroOrb, short && styles.shortHeroOrb]}>
          <View style={[styles.heroRing, short && styles.shortHeroRing]}><Ionicons name="footsteps" size={short ? 41 : 54} color={colors.accent} /></View>
        </LinearGradient>
        <Text style={styles.eyebrow}>EVERY STEP. ON BEAT.</Text>
        <Text style={[styles.heroTitle, compact && styles.compactHeroTitle]}>Your pace has a <Text style={styles.heroAccent}>soundtrack.</Text></Text>
        <Text style={[styles.heroBody, compact && styles.compactHeroBody]}>TrackStar hears how you move and shapes the music around the runner you want to become.</Text>
      </View>

      <View style={styles.benefits}>
        {benefits.map((benefit) => <View style={styles.benefit} key={benefit.label}><Ionicons name={benefit.icon} size={19} color={colors.accent} /><Text style={styles.benefitText}>{benefit.label}</Text></View>)}
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>Set your baseline</Text>
        <Text style={styles.setupCopy}>Used only to estimate a comfortable starting cadence.</Text>
        <View style={styles.heightRow}>
          <TextInput
            accessibilityLabel="Height"
            keyboardType="number-pad"
            value={displayHeight}
            onChangeText={(value) => {
              const parsed = Number(value.replace(/\D/g, ''));
              if (parsed > 0) setHeight(preferredUnit === 'metric' ? parsed : Math.round(parsed * 2.54));
            }}
            style={styles.heightInput}
          />
          <View style={styles.unitToggle}>
            {(['metric', 'imperial'] as const).map((unit) => <Pressable key={unit} onPress={() => setUnit(unit)} style={[styles.unit, preferredUnit === unit && styles.unitActive]}><Text style={[styles.unitText, preferredUnit === unit && styles.unitTextActive]}>{unit === 'metric' ? 'CM' : 'IN'}</Text></Pressable>)}
          </View>
        </View>
        <Text style={styles.genreLabel}>WHAT MOVES YOU?</Text>
        <View style={styles.genreWrap}>{GENRES.map(({ value, label }) => <GenreChip key={value} label={label} selected={genres.includes(value)} onPress={() => toggleGenre(value)} />)}</View>
      </View>

      <View style={styles.spotifySection}><SpotifyConnectCard /></View>
      <View style={styles.actions}><AppButton label="Build my run" icon="arrow-forward" onPress={continueToPlan} /></View>
      <Text style={styles.privacy}><Ionicons name="lock-closed" size={11} /> Motion stays on your device. Spotify opens licensed music in Spotify; offline coaching uses bundled beat loops.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  prototype: { backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: colors.divider },
  prototypeText: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  hero: { alignItems: 'center', paddingTop: 12 },
  shortHero: { paddingTop: 2 },
  heroOrb: { width: 122, height: 122, borderRadius: 61, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  shortHeroOrb: { width: 92, height: 92, borderRadius: 46, marginBottom: 12 },
  heroRing: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,255,85,0.35)', backgroundColor: 'rgba(8,10,9,0.46)' },
  shortHeroRing: { width: 68, height: 68, borderRadius: 34 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 2.1, marginBottom: 10 },
  heroTitle: { color: colors.textPrimary, fontSize: 41, lineHeight: 44, fontWeight: '900', letterSpacing: -1.7, textAlign: 'center', maxWidth: 500 },
  compactHeroTitle: { fontSize: 34, lineHeight: 37, letterSpacing: -1.2 },
  heroAccent: { color: colors.accent },
  heroBody: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 430, marginTop: 12 },
  compactHeroBody: { fontSize: 14, lineHeight: 20, marginTop: 9 },
  benefits: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  benefit: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.backgroundSoft, borderRadius: 16, borderWidth: 1, borderColor: colors.divider },
  benefitText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  setupCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.divider, padding: 18 },
  setupTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  setupCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  heightRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  heightInput: { flex: 1, height: 52, backgroundColor: colors.backgroundSoft, color: colors.textPrimary, borderRadius: 15, borderWidth: 1, borderColor: colors.divider, paddingHorizontal: 16, fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unitToggle: { flexDirection: 'row', backgroundColor: colors.backgroundSoft, borderRadius: 15, padding: 4, borderWidth: 1, borderColor: colors.divider },
  unit: { width: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  unitActive: { backgroundColor: colors.surfaceBright },
  unitText: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  unitTextActive: { color: colors.accent },
  genreLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { gap: 10, marginTop: 16 },
  spotifySection: { marginTop: 16 },
  privacy: { color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 16, paddingHorizontal: 20 },
});
