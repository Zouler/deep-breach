import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 4 },
  title: { color: theme.text, fontSize: 18, fontWeight: '700' },
  sub: { color: theme.textMuted, fontSize: 13 },
});
