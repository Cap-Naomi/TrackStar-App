import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/colors';
import type { RunDataPoint } from '@/types';

function pathFor(points: RunDataPoint[], width: number, height: number, accessor: (point: RunDataPoint) => number | null): string {
  if (points.length === 0) return '';
  return points.map((point, index) => {
    const value = accessor(point);
    const x = 34 + (index / Math.max(1, points.length - 1)) * (width - 46);
    const y = value == null ? height - 18 : 10 + ((190 - value) / 70) * (height - 30);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

export function RunChart({ points }: { points: RunDataPoint[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(620, screenWidth - 40);
  const height = 190;
  return (
    <View style={styles.card}>
      <View style={styles.legend}>
        <Text style={styles.title}>Cadence over time</Text>
        <View style={styles.legendItems}><Text style={styles.actual}>● Actual</Text><Text style={styles.target}>● Target</Text><Text style={styles.music}>● Music</Text></View>
      </View>
      <Svg width={width - 32} height={height} viewBox={`0 0 ${width - 32} ${height}`}>
        <Defs><LinearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={colors.cyan} /><Stop offset="1" stopColor={colors.accent} /></LinearGradient></Defs>
        {[130, 160, 190].map((value) => {
          const y = 10 + ((190 - value) / 70) * (height - 30);
          return <Line key={value} x1="34" x2={width - 46} y1={y} y2={y} stroke={colors.divider} strokeWidth="1" strokeDasharray="4 5" />;
        })}
        {[130, 160, 190].map((value) => {
          const y = 10 + ((190 - value) / 70) * (height - 30);
          return <SvgText key={value} x="0" y={y + 4} fontSize="9" fontWeight="700" fill={colors.textMuted}>{value}</SvgText>;
        })}
        <Path d={pathFor(points, width - 32, height, (point) => point.targetSpm)} fill="none" stroke={colors.warning} strokeWidth="2" strokeDasharray="5 5" />
        <Path d={pathFor(points, width - 32, height, (point) => point.effectiveSongSpm)} fill="none" stroke="#8F9BFF" strokeWidth="2" opacity="0.9" />
        <Path d={pathFor(points, width - 32, height, (point) => point.actualSpm)} fill="none" stroke="url(#actualGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: 16, overflow: 'hidden' },
  legend: { marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  legendItems: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actual: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  target: { color: colors.warning, fontSize: 10, fontWeight: '700' },
  music: { color: '#8F9BFF', fontSize: 10, fontWeight: '700' },
});
