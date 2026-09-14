import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}

export function AppButton({ label, onPress, variant = 'primary', icon, disabled, loading, compact }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.accentInk : colors.textPrimary} /> : (
        <View style={styles.content}>
          <Text style={[styles.label, variant === 'primary' && styles.primaryLabel, variant === 'danger' && styles.dangerLabel]}>{label}</Text>
          {icon ? <Ionicons name={icon} size={19} color={variant === 'primary' ? colors.accentInk : variant === 'danger' ? colors.danger : colors.textPrimary} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 56, borderRadius: 18, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14 },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.divider },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(255,101,101,0.1)', borderWidth: 1, borderColor: 'rgba(255,101,101,0.3)' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  label: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  primaryLabel: { color: colors.accentInk },
  dangerLabel: { color: colors.danger },
});
