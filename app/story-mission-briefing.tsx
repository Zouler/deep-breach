import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { theme } from '@/constants/theme';
import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import { useGame } from '@/context/GameContext';
import { getMissionDefinition, isMissionUnlocked, isStoryMissionCompleted } from '@/game/storyMissions';

function speakerLabel(speakerId: string): string {
  return CREW_LEADS_BY_ID[speakerId as keyof typeof CREW_LEADS_BY_ID]?.displayName ?? speakerId;
}

export default function StoryMissionBriefingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const params = useLocalSearchParams<{ missionId?: string | string[] }>();
  const missionId = Array.isArray(params.missionId) ? params.missionId[0] : params.missionId;
  const def = missionId ? getMissionDefinition(missionId) : undefined;
  const unlocked = missionId ? isMissionUnlocked(state, missionId) : false;
  const completed = missionId ? isStoryMissionCompleted(state, missionId) : false;

  if (!def) {
    return (
      <ScreenShell scroll>
        <Text style={styles.error}>Assignment not found.</Text>
        <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  const b = def.briefing;

  const onAcknowledge = () => {
    if (!unlocked || completed || def.isPlaceholder) return;
    dispatch({ type: 'COMPLETE_STORY_MISSION', missionId: def.id });
    router.replace('/mission-select');
  };

  return (
    <ScreenShell scroll={false}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>{b.kicker}</Text>
          <Text style={styles.title}>{b.title}</Text>
          <Text style={styles.subtitle}>{b.subtitle}</Text>

          <PanelCard style={styles.memoCard}>
            {b.body.map((paragraph, i) =>
              paragraph ? (
                <Text key={i} style={styles.bodyPara}>
                  {paragraph}
                </Text>
              ) : (
                <View key={i} style={styles.spacer} />
              ),
            )}
            {b.classification ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.classification}>{b.classification}</Text>
              </>
            ) : null}
          </PanelCard>

          {def.objectives.length > 0 ? (
            <PanelCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Objectives</Text>
              {def.objectives.map((o) => (
                <Text key={o} style={styles.listItem}>
                  • {o}
                </Text>
              ))}
            </PanelCard>
          ) : null}

          {def.restrictions.length > 0 ? (
            <PanelCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Restrictions</Text>
              {def.restrictions.map((r) => (
                <Text key={r} style={styles.listItemMuted}>
                  • {r}
                </Text>
              ))}
            </PanelCard>
          ) : null}

          {b.leadLines.map((line) => (
            <PanelCard key={line.speakerId} style={styles.leadCard}>
              <Text style={styles.leadKicker}>{speakerLabel(line.speakerId).toUpperCase()}</Text>
              <Text style={styles.leadText}>{line.text}</Text>
            </PanelCard>
          ))}

          {def.isPlaceholder ? (
            <Text style={styles.placeholderNote}>
              This operation remains locked. Hull Reinforcement Mk I is required before launch.
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
          {def.isPlaceholder ? (
            <PrimaryButton title="Return to schedule" variant="ghost" onPress={() => router.back()} />
          ) : completed ? (
            <PrimaryButton title="Back to schedule" variant="ghost" onPress={() => router.back()} />
          ) : unlocked ? (
            <PrimaryButton title="Acknowledge assignment" onPress={onAcknowledge} />
          ) : (
            <>
              <Text style={styles.lockedHint}>Assignment locked — complete prior requirements first.</Text>
              <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
            </>
          )}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  kicker: {
    color: theme.accent,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: theme.text, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: theme.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  memoCard: { marginBottom: 10 },
  bodyPara: { color: theme.text, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  spacer: { height: 8 },
  divider: {
    height: 1,
    backgroundColor: theme.panelBorderFaint,
    marginVertical: 12,
  },
  classification: {
    color: theme.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCard: { marginBottom: 10 },
  sectionTitle: { color: theme.text, fontWeight: '800', marginBottom: 8 },
  listItem: { color: theme.text, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  listItemMuted: { color: theme.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  leadCard: {
    marginBottom: 10,
    borderColor: 'rgba(44, 217, 255, 0.25)',
    backgroundColor: theme.panelBgSoft,
  },
  leadKicker: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  leadText: { color: theme.text, fontSize: 14, lineHeight: 21 },
  placeholderNote: { color: theme.warning, fontSize: 13, lineHeight: 18, marginTop: 4 },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: theme.panelBorder,
    backgroundColor: theme.panelBgSolid,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
  },
  lockedHint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
  error: { color: theme.warning, marginBottom: 12 },
});
