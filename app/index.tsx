import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarracudaGamesIntro } from '@/components/BarracudaGamesIntro';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GAME_ASSETS } from '@/constants/assets';
import { monoData, theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function StartScreen() {
  const router = useRouter();
  const { dispatch, hydrated, hasSaveFile } = useGame();
  const [introDone, setIntroDone] = useState(false);

  const onIntroDone = useCallback(() => setIntroDone(true), []);

  if (!introDone) {
    return <BarracudaGamesIntro onDone={onIntroDone} />;
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.instrumentCyan} size="large" />
        <Text style={styles.loadingText}>[ SYS ] Pressurizing hull systems…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={GAME_ASSETS.splashTitleBg}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.scrim} />
        <View style={styles.scanlines} pointerEvents="none" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <Text style={styles.classification}>DBX PROGRAM — RESTRICTED</Text>
              <Image
                source={GAME_ASSETS.logoDeepBreach}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Deep Breach"
              />
              <Text style={styles.subtitle}>
                Act 1 · Experimental Trials · classified prototype command
              </Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                title="Start New Expedition"
                onPress={() => {
                  dispatch({ type: 'NEW_GAME' });
                  router.push('/assignment-briefing');
                }}
              />
              <PrimaryButton
                title="Continue"
                variant="ghost"
                disabled={!hasSaveFile}
                onPress={() => router.push('/base')}
              />
              <PrimaryButton title="Settings" variant="ghost" onPress={() => router.push('/settings')} />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  bg: { flex: 1, width: '100%', height: '100%' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 8, 18, 0.78)',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `rgba(34, 211, 238, ${theme.scanlineOpacity})`,
    opacity: 0.35,
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    justifyContent: 'flex-end',
  },
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 18,
  },
  classification: {
    color: theme.phosphorAmber,
    fontFamily: theme.fontMono,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
    marginBottom: 18,
  },
  logo: {
    width: '72%',
    maxWidth: 340,
    height: 120,
    marginBottom: 12,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 10,
    paddingBottom: 6,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: theme.textMuted, ...monoData, fontSize: 12 },
});
