import type { ReactNode } from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  source?: ImageSourcePropType;
  children: ReactNode;
  /** Inner padding for overlay content. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative HUD panel shell. If the image fails to decode, we fall back to a styled View.
 * (Metro static requires still need the file to exist; decode/runtime errors should never crash UI.)
 */
export function HudFrame({ source, children, padding = 14, style }: Props) {
  if (!source) {
    return <View style={[styles.fallback, { padding }, style]}>{children}</View>;
  }

  return (
    <ImageBackground
      source={source}
      resizeMode="stretch"
      style={[styles.root, style]}
      imageStyle={styles.image}
    >
      <View style={[styles.inner, { padding }]}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  image: { opacity: 0.95 },
  inner: {},
  fallback: {
    borderWidth: 1,
    borderColor: '#38bdf833',
    backgroundColor: '#020617cc',
    borderRadius: 14,
  },
});

