import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';

export type StampVariant = 'classified' | 'cleared' | 'vesselLost';

type Props = {
  variant: StampVariant;
  width?: number;
  /** Stamp alignment within its row */
  align?: 'start' | 'end';
};

const STAMP_ASPECT = 512 / 256;

const STAMP_OPACITY: Record<StampVariant, number> = {
  classified: 0.34,
  cleared: 0.4,
  vesselLost: 0.46,
};

export function ClassificationStamp({ variant, width = 140, align = 'start' }: Props) {
  const source: ImageSourcePropType = GAME_ASSETS.stamps[variant];
  const height = width / STAMP_ASPECT;
  return (
    <Image
      source={source}
      style={[
        styles.stamp,
        align === 'end' ? styles.alignEnd : styles.alignStart,
        { width, height, opacity: STAMP_OPACITY[variant] },
      ]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  stamp: {
    marginBottom: 6,
  },
  alignStart: { alignSelf: 'flex-start' },
  alignEnd: { alignSelf: 'flex-end' },
});
