import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { getIntroStoryImage } from '@/constants/storyAssets';
import { theme } from '@/constants/theme';
import { ACT1_COMMAND_INTRO_SCENES } from '@/data/introSequences';
import { useGame } from '@/context/GameContext';
import { navigateToFirstTrialFlow } from '@/game/storyNavigation';

const TYPEWRITER_MS = 30;
const PANEL_BG_ALPHA_DEFAULT = 0.68;
const PANEL_BORDER = 'rgba(44, 217, 255, 0.35)';

export default function IntroSequenceScreen() {
  const router = useRouter();
  const { state, dispatch, hydrated } = useGame();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [revealedLen, setRevealedLen] = useState(0);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageOpacity = useRef(new Animated.Value(1)).current;

  const scene = ACT1_COMMAND_INTRO_SCENES[index];
  const total = ACT1_COMMAND_INTRO_SCENES.length;
  const isLast = index >= total - 1;
  const narrative = scene?.narrative ?? '';
  const isTypingComplete = revealedLen >= narrative.length;

  useEffect(() => {
    if (!hydrated) return;
    if (!state.story.assignmentBriefingAccepted) {
      router.replace('/assignment-briefing');
    }
  }, [hydrated, router, state.story.assignmentBriefingAccepted]);

  const clearTypeTimer = useCallback(() => {
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    }
  }, []);

  const revealAllNarrative = useCallback(() => {
    clearTypeTimer();
    setRevealedLen(narrative.length);
  }, [clearTypeTimer, narrative.length]);

  useEffect(() => {
    if (!scene) return;
    clearTypeTimer();
    setRevealedLen(0);
    let len = 0;
    typeTimerRef.current = setInterval(() => {
      len += 1;
      if (len >= narrative.length) {
        clearTypeTimer();
        setRevealedLen(narrative.length);
        return;
      }
      setRevealedLen(len);
    }, TYPEWRITER_MS);
    return clearTypeTimer;
  }, [clearTypeTimer, index, narrative.length, scene?.id]);

  useEffect(() => {
    imageOpacity.setValue(0);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [imageOpacity, index]);

  useEffect(() => () => clearTypeTimer(), [clearTypeTimer]);

  const finish = (skipped: boolean) => {
    clearTypeTimer();
    if (skipped) {
      dispatch({ type: 'STORY_INTRO_SEQUENCE_SKIP' });
    } else {
      dispatch({ type: 'STORY_INTRO_SEQUENCE_COMPLETE' });
    }
    navigateToFirstTrialFlow((href) => router.replace(href), dispatch, state.dive);
  };

  const onPrimaryPress = () => {
    if (!isTypingComplete) {
      revealAllNarrative();
      return;
    }
    if (isLast) {
      finish(false);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (!scene) {
    return (
      <View style={styles.fill}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const panelAlpha = scene.panelBackdropOpacity ?? PANEL_BG_ALPHA_DEFAULT;
  const sh = Dimensions.get('window').height;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
        <Image
          source={getIntroStoryImage(scene.imageId)}
          style={styles.bgImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <View pointerEvents="none" style={[styles.bottomWash, { height: sh * 0.52 }]}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,5,14,0)' }} />
        <View style={{ flex: 1.15, backgroundColor: 'rgba(0,5,14,0.14)' }} />
        <View style={{ flex: 1.35, backgroundColor: 'rgba(0,5,14,0.36)' }} />
        <View style={{ flex: 1.4, backgroundColor: 'rgba(0,5,14,0.58)' }} />
      </View>

      <View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFill,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: 16,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.eyebrow} numberOfLines={2}>
            {scene.eyebrow}
          </Text>
          <Text style={styles.counter} accessibilityLabel={`Scene ${index + 1} of ${total}`}>
            {index + 1} / {total}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.lowerThird}>
          <View
            style={[
              styles.textPanel,
              {
                backgroundColor: `rgba(0, 5, 14, ${panelAlpha})`,
              },
            ]}
          >
            <Text style={styles.sceneTitle}>{scene.title}</Text>
            <Pressable
              onPress={revealAllNarrative}
              accessibilityRole="button"
              accessibilityLabel="Reveal full narrative"
              accessibilityHint="Double tap to show all text at once"
              hitSlop={12}
            >
              <Text style={styles.narrative}>{narrative.slice(0, revealedLen)}</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              title={
                !isTypingComplete
                  ? 'Complete text'
                  : isLast
                    ? 'Begin trials'
                    : 'Continue'
              }
              onPress={onPrimaryPress}
            />
            <PrimaryButton title="Skip Sequence" variant="ghost" onPress={() => finish(true)} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000510',
  },
  fill: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bottomWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    flex: 1,
    color: theme.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  counter: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lowerThird: {
    gap: 12,
    maxWidth: 520,
    alignSelf: 'stretch',
  },
  textPanel: {
    borderWidth: 1,
    borderColor: PANEL_BORDER,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  sceneTitle: {
    color: theme.text,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  narrative: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
  },
  actions: { gap: 10 },
  muted: { color: theme.textMuted },
});
