import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClassificationStamp } from '@/components/ClassificationStamp';
import { PanelCard } from '@/components/PanelCard';
import { PortraitFrame } from '@/components/PortraitFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { theme } from '@/constants/theme';
import { GAME_ASSETS } from '@/constants/assets';
import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import { useGame } from '@/context/GameContext';
import { returnMissionLockCopy, hasStoryFlag } from '@/game/deadBeaconDecision';
import {
  FIRST_CONTACT_ANALYSIS_FINDINGS,
  FIRST_CONTACT_ANALYSIS_OPTIONS,
  isFirstContactAnalysisPending,
  STORY_FLAG_FIRST_CONTACT_ANALYSIS,
  type FirstContactAnalysisChoice,
} from '@/game/firstContactAftermath';
import { growingOceanMissionLockCopy } from '@/game/growingOceanAnomaly';
import { getMissionDefinition, isMissionUnlocked, isStoryMissionCompleted } from '@/game/storyMissions';
import { portraitForSpeakerId } from '@/game/portraitAssets';

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
      <ScreenShell scroll backgroundImage={GAME_ASSETS.briefingRoomBackground} backgroundScrimOpacity={0.64} scanlineOverlay>
        <Text style={styles.error}>Assignment not found.</Text>
        <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  const b = def.briefing;
  const isAnalysisMission = def.id === 'first_contact_analysis';
  const analysisPending = isFirstContactAnalysisPending(state);
  const analysisResolved = hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS);

  const onAnalysisDecision = (choice: FirstContactAnalysisChoice) => {
    if (!analysisPending) return;
    dispatch({ type: 'RESOLVE_FIRST_CONTACT_ANALYSIS', choice });
    router.replace('/mission-select');
  };
  const isDiveAssignment = def.isDiveMission === true;
  const diveMissionId = def.diveMissionId ?? def.id;
  const activeBlocking = state.dive?.status === 'active';
  const debriefBlocking = Boolean(state.dive && state.dive.status !== 'active');

  const onAcknowledge = () => {
    if (!unlocked || completed || def.isPlaceholder || isDiveAssignment) return;
    dispatch({ type: 'COMPLETE_STORY_MISSION', missionId: def.id });
    router.replace('/mission-select');
  };

  const onLaunchRecon = () => {
    if (!unlocked || completed || def.isPlaceholder || activeBlocking || debriefBlocking) return;
    dispatch({ type: 'START_MISSION', missionId: diveMissionId });
    router.replace('/dive');
  };

  return (
    <ScreenShell
      scroll={false}
      backgroundImage={GAME_ASSETS.briefingRoomBackground}
      backgroundScrimOpacity={0.64}
      scanlineOverlay
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ClassificationStamp variant="classified" width={110} />
          <Text style={styles.kicker}>{b.kicker}</Text>
          <Text style={styles.title}>{b.title}</Text>
          <Text style={styles.subtitle}>{b.subtitle}</Text>

          <PanelCard variant="document" style={styles.memoCard}>
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
            <PanelCard variant="document" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Objectives</Text>
              {def.objectives.map((o) => (
                <Text key={o} style={styles.listItem}>
                  • {o}
                </Text>
              ))}
            </PanelCard>
          ) : null}

          {def.restrictions.length > 0 ? (
            <PanelCard variant="document" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Restrictions</Text>
              {def.restrictions.map((r) => (
                <Text key={r} style={styles.listItemMuted}>
                  • {r}
                </Text>
              ))}
            </PanelCard>
          ) : null}

          {isAnalysisMission ? (
            <PanelCard variant="document" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Research findings — contradictory telemetry</Text>
              {FIRST_CONTACT_ANALYSIS_FINDINGS.map((finding) => (
                <Text key={finding} style={styles.listItemMuted}>
                  • {finding}
                </Text>
              ))}
            </PanelCard>
          ) : null}

          {b.leadLines.map((line) => {
            const portrait = portraitForSpeakerId(line.speakerId);
            return (
            <PanelCard key={line.speakerId} variant="document" style={styles.leadCard}>
              <View style={styles.leadRow}>
                {portrait ? <PortraitFrame source={portrait} size={56} /> : null}
                <View style={styles.leadCopy}>
              <Text style={styles.leadKicker}>{speakerLabel(line.speakerId).toUpperCase()}</Text>
              <Text style={styles.leadText}>{line.text}</Text>
                </View>
              </View>
            </PanelCard>
            );
          })}

          {def.isPlaceholder ? (
            <Text style={styles.placeholderNote}>
              {def.id === 'operation_dead_beacon_return'
                ? returnMissionLockCopy(state)
                : 'This operation remains locked. Hull Reinforcement Mk I is required before launch.'}
            </Text>
          ) : null}
          {def.id === 'growing_ocean_anomaly_prep' && !unlocked && !completed ? (
            <Text style={styles.placeholderNote}>{growingOceanMissionLockCopy(state)}</Text>
          ) : null}
          {isAnalysisMission && analysisResolved ? (
            <Text style={styles.resolvedNote}>
              Analysis complete — monitoring preparation logged. Growing Ocean Anomaly tasking pending.
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
          {isAnalysisMission && analysisPending && unlocked ? (
            <>
              <Text style={styles.lockedHint}>
                Select an authorization path. All options advance monitoring preparation — no full
                explanation is available.
              </Text>
              {FIRST_CONTACT_ANALYSIS_OPTIONS.map((option) => (
                <PrimaryButton
                  key={option.id}
                  title={option.label}
                  variant="ghost"
                  onPress={() => onAnalysisDecision(option.id)}
                />
              ))}
              <PrimaryButton title="Back to schedule" variant="ghost" onPress={() => router.back()} />
            </>
          ) : def.isPlaceholder ? (
            <PrimaryButton title="Return to schedule" variant="ghost" onPress={() => router.back()} />
          ) : completed ? (
            <PrimaryButton title="Back to schedule" variant="ghost" onPress={() => router.back()} />
          ) : unlocked && isDiveAssignment ? (
            <>
              {activeBlocking ? (
                <Text style={styles.lockedHint}>Active dive in progress — complete the run first.</Text>
              ) : debriefBlocking ? (
                <Text style={styles.lockedHint}>Debrief pending — review the last run before launching.</Text>
              ) : null}
              <PrimaryButton
                title={
                  def.id === 'operation_dead_beacon_return'
                    ? 'Launch return dive'
                    : def.id === 'growing_ocean_anomaly_prep'
                      ? 'Launch monitoring dive'
                      : 'Launch recon'
                }
                onPress={onLaunchRecon}
                disabled={activeBlocking || debriefBlocking}
              />
              <PrimaryButton title="Back to schedule" variant="ghost" onPress={() => router.back()} />
            </>
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
  },
  leadRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  leadCopy: { flex: 1, minWidth: 0 },
  leadKicker: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  leadText: { color: theme.text, fontSize: 14, lineHeight: 21 },
  placeholderNote: { color: theme.warning, fontSize: 13, lineHeight: 18, marginTop: 4 },
  resolvedNote: { color: theme.ok, fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: '600' },
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
