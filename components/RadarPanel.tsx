import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function RadarPanel({ label }: { label: string }) {
  return (
    <View style={styles.box}>
      <View style={styles.ring} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 120,
    borderRadius: theme.cardRadius,
    borderWidth: 1,
    borderColor: theme.radar,
    backgroundColor: '#071426',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#1d4ed855',
  },
  label: { color: theme.textMuted, letterSpacing: 1.2, fontSize: 12 },
});
