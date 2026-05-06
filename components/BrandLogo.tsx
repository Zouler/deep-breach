import { useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BRANDING_ASSETS } from '@/constants/brandingAssets';
import { theme } from '@/constants/theme';

type Props = {
  width?: number;
  height?: number;
};

/**
 * Safe logo: falls back to typographic mark if the image fails at runtime.
 */
export function BrandLogo({ width = 160, height = 160 }: Props) {
  const [failed, setFailed] = useState(false);
  const source: ImageSourcePropType = BRANDING_ASSETS.logo;

  if (failed) {
    return (
      <View style={[styles.fallback, { width, height }]}>
        <Text style={styles.fallbackTitle}>DEEP</Text>
        <Text style={styles.fallbackSub}>BREACH</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ width, height }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  fallbackTitle: {
    color: theme.accent,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  fallbackSub: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: 2,
  },
});
