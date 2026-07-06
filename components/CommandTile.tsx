import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  emphasis?: boolean;
  onPress: () => void;
};

export function CommandTile({ title, subtitle, emphasis, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        emphasis ? styles.tileEmphasis : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.rail} />
      <View style={styles.body}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.panelBorderStrong,
    borderRadius: theme.radiusInstrument,
    backgroundColor: theme.panelBg,
    paddingVertical: 12,
    paddingRight: 10,
    overflow: 'hidden',
  },
  tileEmphasis: {
    borderColor: theme.instrumentCyan,
    backgroundColor: theme.panelRailBg,
  },
  pressed: { opacity: 0.85 },
  rail: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: theme.phosphorAmber,
    marginRight: 10,
  },
  body: { flex: 1 },
  title: {
    color: theme.paperBone,
    fontFamily: theme.fontMono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  chevron: { color: theme.mutedSteel, fontSize: 20, marginLeft: 4 },
});
