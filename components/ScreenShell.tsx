import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Full-bleed atmospheric background (game screens). */
  backgroundImage?: ImageSourcePropType;
  /** Darken background for readability (0 = none, 1 = opaque). */
  backgroundScrimOpacity?: number;
  /** Subtle COLD HULL instrument scanline tile — does not block touches. */
  scanlineOverlay?: boolean;
  /** Override scanline strength (defaults to theme.scanlineOpacity). */
  scanlineOpacity?: number;
};

export function ScreenShell({
  children,
  scroll,
  contentStyle,
  backgroundImage,
  backgroundScrimOpacity = 0.72,
  scanlineOverlay = false,
  scanlineOpacity = theme.scanlineOpacity,
}: Props) {
  const transparent = Boolean(backgroundImage);
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.scroll, contentStyle]}>{children}</ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  if (backgroundImage) {
    return (
      <ImageBackground source={backgroundImage} style={styles.bgRoot} resizeMode="cover">
        <View
          pointerEvents="none"
          style={[
            styles.scrim,
            { backgroundColor: `rgba(2, 8, 18, ${backgroundScrimOpacity})` },
          ]}
        />
        {scanlineOverlay ? (
          <View pointerEvents="none" style={styles.scanlineWrap}>
            <Image
              source={GAME_ASSETS.scanlineNoiseOverlay}
              style={[styles.scanline, { opacity: scanlineOpacity }]}
              resizeMode="repeat"
            />
          </View>
        ) : null}
        <SafeAreaView style={[styles.safe, transparent && styles.safeTransparent]}>{body}</SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.plainRoot}>
      {scanlineOverlay ? (
        <View pointerEvents="none" style={styles.scanlineWrap}>
          <Image
            source={GAME_ASSETS.scanlineNoiseOverlay}
            style={[styles.scanline, { opacity: scanlineOpacity }]}
            resizeMode="repeat"
          />
        </View>
      ) : null}
      <SafeAreaView style={styles.safe}>{body}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgRoot: { flex: 1, width: '100%', height: '100%' },
  plainRoot: { flex: 1, backgroundColor: theme.bg },
  scrim: { ...StyleSheet.absoluteFillObject },
  scanlineWrap: { ...StyleSheet.absoluteFillObject },
  scanline: { width: '100%', height: '100%' },
  safe: { flex: 1, backgroundColor: theme.bg },
  safeTransparent: { backgroundColor: 'transparent' },
  fill: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, paddingTop: 8, gap: 14 },
});
