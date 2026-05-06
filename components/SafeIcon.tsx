import { useState } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  size: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Small guard so a bad/corrupt image doesn't take down the screen.
 * (Bundled requires still must exist at build time.)
 */
export function SafeIcon({ source, size, style }: Props) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return null;
  }
  return (
    <Image
      source={source}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      onError={() => setOk(false)}
    />
  );
}
