import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssignmentMemoFrame } from '@/components/AssignmentMemoFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { navigateToFirstTrialFlow } from '@/game/storyNavigation';

export default function AssignmentBriefingScreen() {
  const router = useRouter();
  const { state, dispatch, hydrated } = useGame();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!hydrated) return;
    const s = state.story;
    if (!s.assignmentBriefingSeen) return;
    if (s.assignmentBriefingAccepted && !s.introSequenceCompleted && !s.introSequenceSkipped) {
      router.replace('/intro-sequence');
    }
  }, [
    hydrated,
    router,
    state.story.assignmentBriefingSeen,
    state.story.assignmentBriefingAccepted,
    state.story.introSequenceCompleted,
    state.story.introSequenceSkipped,
  ]);

  const onAccept = () => {
    dispatch({ type: 'STORY_ACCEPT_ASSIGNMENT' });
    router.push('/intro-sequence');
  };

  const onSkip = () => {
    dispatch({ type: 'STORY_SKIP_ASSIGNMENT_BRIEFING' });
    navigateToFirstTrialFlow((href) => router.replace(href), dispatch, state.dive);
  };

  return (
    <ScreenShell
      scroll={false}
      backgroundImage={GAME_ASSETS.briefingRoomBackground}
      backgroundScrimOpacity={0.64}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenHint}>Official memorandum · read carefully</Text>
          <AssignmentMemoFrame />
        </ScrollView>
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(14, insets.bottom + 8) },
          ]}
        >
          <PrimaryButton title="Accept Mission" onPress={onAccept} />
          <PrimaryButton title="Skip Briefing" variant="ghost" onPress={onSkip} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  screenHint: {
    color: theme.textMuted,
    fontSize: 11,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: theme.panelBorder,
    backgroundColor: theme.panelBgSolid,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
  },
});
