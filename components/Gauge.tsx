import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  label: string;
  value: number;
  tone?: 'neutral' | 'warning' | 'danger' | 'critical' | 'ok';
};

export function Gauge({ label, value, tone = 'neutral' }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    tone === 'critical'
      ? theme.critical
      : tone === 'danger'
        ? theme.danger
        : tone === 'warning'
          ? theme.warning
          : tone === 'ok'
            ? theme.ok
            : theme.accent;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(clamped)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: theme.textMuted, fontSize: 13 },
  value: { color: theme.text, fontWeight: '700' },
  track: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#0b1a2f',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  fill: { height: '100%' },
});
