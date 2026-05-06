import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function RepairFeedbackBanner({
  tone,
  text,
}: {
  tone: 'ok' | 'err';
  text: string;
}) {
  return (
    <View style={[styles.wrap, tone === 'ok' ? styles.ok : styles.err]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  ok: { borderColor: '#166534', backgroundColor: '#052e1655' },
  err: { borderColor: '#b91c1c', backgroundColor: '#450a0a66' },
  text: { color: theme.text, fontWeight: '700', fontSize: 13, lineHeight: 18 },
});
