import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { theme } from '@/constants/theme';
import type { DiveFlashKind } from '@/hooks/useDiveFeedback';

type Props = { kind: DiveFlashKind };

export function DiveFlashBand({ kind }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (kind === 'none') return;
    opacity.setValue(0.65);
    const anim = Animated.timing(opacity, {
      toValue: 0,
      duration: 520,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [kind, opacity]);

  const color =
    kind === 'hull'
      ? theme.danger
      : kind === 'oxygen'
        ? theme.warning
        : kind === 'water'
          ? theme.accent
          : kind === 'crack'
            ? theme.critical
            : kind === 'event'
              ? theme.ok
              : 'transparent';

  if (kind === 'none') return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.band, { opacity, backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 50,
    elevation: 6,
  },
});
