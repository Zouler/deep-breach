import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export function SectionHeader({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
    <View style={styles.wrap}>
      {kicker ? <Text style={styles.kicker}>{kicker.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 8 },
  kicker: {
    color: theme.phosphorAmber,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    fontFamily: theme.fontMono,
  },
  title: { color: theme.paperBone, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  sub: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },
});
