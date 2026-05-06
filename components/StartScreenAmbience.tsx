import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { theme } from '@/constants/theme';

const BUBBLE_COUNT = 10;

/**
 * Lightweight ambient layer: slow bubbles + soft sonar sweep (no Reanimated worklets).
 */
export function StartScreenAmbience() {
  const sweep = useRef(new Animated.Value(0)).current;
  const bubbles = useRef(Array.from({ length: BUBBLE_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 6500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  useEffect(() => {
    const loops = bubbles.map((v, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 4500 + i * 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 4500 + i * 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return anim;
    });
    return () => loops.forEach((anim) => anim.stop());
  }, [bubbles]);

  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.vignette]} />
      {bubbles.map((b, i) => {
        const left = 8 + ((i * 73) % 100);
        const size = 4 + (i % 3) * 2;
        const translateY = b.interpolate({ inputRange: [0, 1], outputRange: [12, -140] });
        const opacity = b.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.22, 0.08] });
        return (
          <Animated.View
            key={i}
            style={[
              styles.bubble,
              {
                left: `${left}%`,
                bottom: `${6 + (i % 5) * 4}%`,
                width: size,
                height: size,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
      <View style={styles.sonarWrap}>
        <Animated.View style={[styles.sonarRing, { transform: [{ rotate }] }]} />
        <View style={styles.sonarCore} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vignette: {
    backgroundColor: '#020617',
    opacity: 0.92,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: theme.accent,
  },
  sonarWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sonarRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: '#1e3a8a55',
  },
  sonarCore: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#22d3ee22',
  },
});
