import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  source: ImageSourcePropType;
  size?: number;
};

/** Small instrument-framed crew portrait for cards and briefings. */
export function PortraitFrame({ source, size = 72 }: Props) {
  const border = Math.max(1, Math.round(size * 0.03));
  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: theme.radiusInstrument,
          borderWidth: border,
        },
      ]}
    >
      <Image source={source} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.tickTL} />
      <View style={styles.tickBR} />
    </View>
  );
}

const tick = {
  position: 'absolute' as const,
  width: 6,
  height: 6,
  borderColor: theme.cornerTick,
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBgSolid,
  },
  image: { width: '100%', height: '100%' },
  tickTL: {
    ...tick,
    top: 2,
    left: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  tickBR: {
    ...tick,
    bottom: 2,
    right: 2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
});
