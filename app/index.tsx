import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarracudaGamesIntro } from '@/components/BarracudaGamesIntro';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
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
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={styles.loadingText}>Pressurizing systems…</Text>
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
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <View style={styles.wordmark}>
                <Text style={styles.wordmarkDeep}>DEEP</Text>
                <Text style={styles.wordmarkBreach}>
                  BRE
                  <Text style={styles.wordmarkAccent}>A</Text>
                  CH
                </Text>
              </View>
              <Text style={styles.subtitle}>Idle survival · submarine expeditions</Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                title="Start New Expedition"
                onPress={() => {
                  dispatch({ type: 'NEW_GAME' });
                  router.push('/base');
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
    backgroundColor: 'rgba(2, 8, 18, 0.74)',
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
    paddingTop: 36,
    paddingBottom: 18,
  },
  wordmark: {
    width: '60%',
    maxWidth: 320,
    alignItems: 'center',
  },
  wordmarkDeep: {
    color: theme.text,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 8,
    lineHeight: 56,
    textShadowColor: 'rgba(56, 189, 248, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  wordmarkBreach: {
    color: theme.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 10,
    lineHeight: 38,
    marginTop: 6,
    textShadowColor: 'rgba(56, 189, 248, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  wordmarkAccent: {
    color: '#ff3b30',
    textShadowColor: 'rgba(255, 59, 48, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 14,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 14,
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
  loadingText: { color: theme.textMuted },
});
