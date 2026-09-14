import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { layout } from '@/constants/layout';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, footer, contentStyle }: ScreenProps) {
  const { width } = useWindowDimensions();
  const compact = width <= 390;
  const narrow = width <= 340;
  const responsivePadding = narrow ? 12 : compact ? 16 : layout.screenPadding;
  const content = <View style={[styles.content, { paddingHorizontal: responsivePadding }, compact && styles.compactContent, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.glow} />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : content}
      {footer ? <SafeAreaView edges={['bottom']} style={styles.footer}><View style={[styles.footerContent, { paddingHorizontal: responsivePadding }]}>{footer}</View></SafeAreaView> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(200,255,85,0.055)',
    top: -170,
    right: -70,
  },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 28,
  },
  compactContent: { paddingTop: 8, paddingBottom: 20 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: 'rgba(8,10,9,0.97)',
    paddingTop: 14,
  },
  footerContent: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
});
