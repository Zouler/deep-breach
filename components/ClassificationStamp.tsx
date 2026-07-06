import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';

export type StampVariant = 'classified' | 'cleared' | 'vesselLost';

type Props = {
  variant: StampVariant;
  width?: number;
};

const STAMP_ASPECT = 512 / 256;

export function ClassificationStamp({ variant, width = 140 }: Props) {
  const source: ImageSourcePropType = GAME_ASSETS.stamps[variant];
  const height = width / STAMP_ASPECT;
  return (
    <Image
      source={source}
      style={[styles.stamp, { width, height, opacity: variant === 'classified' ? 0.42 : 0.5 }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
});
