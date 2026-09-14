import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';

interface HeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ eyebrow, title, description, showBack = true, right }: HeaderProps) {
  const { width } = useWindowDimensions();
  const compact = width <= 375;
  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : <View />}
        {right}
      </View>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      {description ? <Text style={[styles.description, compact && styles.compactDescription]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  compactWrapper: { marginBottom: 19 },
  topRow: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  back: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  eyebrow: { color: colors.accent, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1.5, fontSize: 12, marginBottom: 7 },
  title: { color: colors.textPrimary, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -0.8 },
  compactTitle: { fontSize: 28, lineHeight: 33 },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 520 },
  compactDescription: { fontSize: 14, lineHeight: 20 },
});
