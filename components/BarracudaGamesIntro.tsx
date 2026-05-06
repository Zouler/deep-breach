import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import barracudaGamesLogo from '@/assets/branding/barracuda-games-logo.png';

const FADE_IN_MS = 400;
const HOLD_MS = 1200;
const FADE_OUT_MS = 400;

type Props = {
  onDone: () => void;
};

/**
 * Studio splash: plays once per mount (~2s). Does not block hydration elsewhere.
 */
export function BarracudaGamesIntro({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
    ]);
    seq.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => seq.stop();
  }, [onDone, opacity]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.inner, { opacity }]}>
        <View style={styles.logoFrame}>
          {imgFailed ? (
            <Text style={styles.fallback}>Barracuda Games</Text>
          ) : (
            <Image
              source={barracudaGamesLogo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Barracuda Games"
              onError={() => setImgFailed(true)}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    /** Match flattened logo matte (asset had no alpha; grid was baked-in RGB). */
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  /** RN: % widths on Image need a parent with explicit width, or they resolve to 0. */
  inner: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logoFrame: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
  },
  fallback: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
});
