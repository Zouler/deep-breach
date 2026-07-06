import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { monoData, theme } from '@/constants/theme';
import {
  EXPERIMENTAL_TRIAL_MISSION_IDS,
  EXPERIMENTAL_TRIAL_SET,
  unlockRequirementCopy,
} from '@/data/experimentalTrials';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { useGame } from '@/context/GameContext';
import { isHarderModifier, modifierForAttempt } from '@/game/missionModifiers';
import { FIRST_TRIAL_MISSION_ID } from '@/game/storyNavigation';
import { getFirstClearBundle } from '@/game/trialRewards';
import {
  experimentalTrialsCompletedCount,
  getEffectiveTrialStatus,
  getStoredTrialProgress,
} from '@/game/trialProgression';
import {
  getAvailableMissions,
  getLockedMissions,
  isMissionUnlocked,
  isStoryMissionCompleted,
} from '@/game/storyMissions';
import { returnMissionActionCopy, returnMissionLockCopy } from '@/game/deadBeaconDecision';
import {
  firstContactAnalysisActionCopy,
  firstContactAnalysisLockCopy,
} from '@/game/firstContactAftermath';
import {
  growingOceanMissionActionCopy,
  growingOceanMissionLockCopy,
} from '@/game/growingOceanAnomaly';
import {
  abyssalExpansionModelsActionCopy,
  abyssalExpansionModelsLockCopy,
  expansionModelDeploymentLockCopy,
} from '@/game/abyssalExpansionModels';
import {
  commandPressureActionCopy,
  commandPressureLockCopy,
} from '@/game/commandPressure';
import { STORY_MISSION_DEFINITIONS, type MissionDefinition } from '@/data/storyMissions';
import type { TrialStatus } from '@/types';

function statusBadgeLabel(status: TrialStatus): { text: string; style: object } {
  switch (status) {
    case 'locked':
      return { text: 'Locked', style: styles.badgeLocked };
    case 'available':
      return { text: 'Available', style: styles.badgeAvailable };
    case 'in_progress':
      return { text: 'In progress', style: styles.badgeProgress };
    case 'completed':
      return { text: 'Completed', style: styles.badgeDone };
    case 'failed_retry_available':
      return { text: 'Retry available', style: styles.badgeRetry };
    default:
      return { text: 'Available', style: styles.badgeAvailable };
  }
}

function actionLabel(status: TrialStatus, isExperimental: boolean): string {
  if (!isExperimental) return 'Start Trial';
  switch (status) {
    case 'locked':
      return 'Locked';
    case 'completed':
      return 'Replay Trial';
    case 'failed_retry_available':
      return 'Retry Trial';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Start Trial';
  }
}

function storyMissionBadge(def: MissionDefinition, completed: boolean, locked: boolean) {
  if (def.id === 'growing_ocean_anomaly_prep') {
    if (completed) return { text: 'Completed', style: styles.badgeDone };
    if (locked) return { text: 'Locked', style: styles.badgeLocked };
    return { text: 'Available', style: styles.badgeAvailable };
  }
  if (def.id === 'command_pressure') {
    if (completed) return { text: 'Completed', style: styles.badgeDone };
    if (locked) return { text: 'Locked', style: styles.badgeLocked };
    return { text: 'Decision required', style: styles.badgeAvailable };
  }
  if (def.id === 'abyssal_expansion_models') {
    if (completed) return { text: 'Completed', style: styles.badgeDone };
    if (locked) return { text: 'Locked', style: styles.badgeLocked };
    return { text: 'Analysis required', style: styles.badgeAvailable };
  }
  if (def.id === 'expansion_model_deployment_hold') {
    return { text: 'On hold', style: styles.badgeLocked };
  }
  if (def.isPlaceholder) return { text: 'Locked', style: styles.badgeLocked };
  if (completed) return { text: 'Completed', style: styles.badgeDone };
  if (locked) return { text: 'Locked', style: styles.badgeLocked };
  return { text: 'Available', style: styles.badgeAvailable };
}

function storyMissionAction(
  def: MissionDefinition,
  completed: boolean,
  locked: boolean,
  state: ReturnType<typeof useGame>['state'],
): string {
  if (def.id === 'operation_dead_beacon_return') {
    if (completed) return 'Review briefing';
    if (locked) return returnMissionActionCopy(state);
    return 'Launch return dive';
  }
  if (def.id === 'first_contact_analysis') {
    if (completed) return firstContactAnalysisActionCopy(state);
    if (locked) return firstContactAnalysisActionCopy(state);
    return firstContactAnalysisActionCopy(state);
  }
  if (def.id === 'growing_ocean_anomaly_prep') {
    if (completed) return 'Review briefing';
    if (locked) return growingOceanMissionActionCopy(state);
    return 'Launch monitoring dive';
  }
  if (def.id === 'command_pressure') {
    return commandPressureActionCopy(state);
  }
  if (def.id === 'abyssal_expansion_models') {
    return abyssalExpansionModelsActionCopy(state);
  }
  if (def.id === 'expansion_model_deployment_hold') {
    return 'Deployment threshold not met';
  }
  if (def.isPlaceholder) return 'Authorization requirements not met';
  if (completed) return 'Review briefing';
  if (locked) return 'Locked';
  if (def.isDiveMission) return 'Launch recon';
  return 'Open briefing';
}

export default function MissionSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ highlight?: string | string[] }>();
  const highlight = Array.isArray(params.highlight) ? params.highlight[0] : params.highlight;
  const { state, dispatch } = useGame();

  const ms = NARRATIVE_UI.missionSelect;
  const totalTrials = EXPERIMENTAL_TRIAL_MISSION_IDS.length;
  const done = experimentalTrialsCompletedCount(state);
  const nextTrialId = EXPERIMENTAL_TRIAL_MISSION_IDS.find((id) => {
    const st = getEffectiveTrialStatus(state, id);
    return st === 'available' || st === 'failed_retry_available';
  });
  const nextMission = nextTrialId ? state.missions.find((x) => x.id === nextTrialId) : undefined;

  return (
    <ScreenShell
      scroll
      backgroundImage={GAME_ASSETS.commandHubBackground}
      backgroundScrimOpacity={0.6}
      scanlineOverlay
    >
      <SectionHeader title={ms.title} subtitle={ms.subtitle} />
      <Text style={styles.progressLine}>
        Experimental Trials: {done} / {totalTrials} completed
        {nextMission ? ` · Next: ${nextMission.name}` : ''}
      </Text>
      {highlight === FIRST_TRIAL_MISSION_ID ? (
        <Text style={styles.highlightBanner}>Next step: Pressure Trial I — launch when ready.</Text>
      ) : null}
      {state.missions.map((m) => {
        const isExperimental = EXPERIMENTAL_TRIAL_SET.has(m.id);
        const status = isExperimental ? getEffectiveTrialStatus(state, m.id) : 'available';
        const badge = statusBadgeLabel(status);
        const locked = status === 'locked';
        const inProg = status === 'in_progress';
        const debriefBlocking = Boolean(state.dive && state.dive.status !== 'active');
        const activeBlocking = state.dive?.status === 'active';
        const firstClear = getFirstClearBundle(m.id);
        const req = isExperimental ? unlockRequirementCopy(m.id, state.missions) : null;
        const action = actionLabel(status, isExperimental);
        const canPress = !locked && !activeBlocking && !debriefBlocking && !inProg;
        const upcomingModifier = !locked
          ? modifierForAttempt(getStoredTrialProgress(state, m.id).attempts)
          : null;

        return (
          <Pressable
            key={m.id}
            onPress={() => {
              if (!canPress) return;
              dispatch({ type: 'START_MISSION', missionId: m.id });
              router.push('/dive');
            }}
          >
            <PanelCard
              variant="document"
              style={[styles.card, highlight === m.id ? styles.cardHighlight : null]}
            >
              <View style={styles.rowTop}>
                <Text style={styles.name}>{m.name}</Text>
                {isExperimental ? (
                  <Text style={[styles.badge, badge.style]}>{badge.text}</Text>
                ) : null}
              </View>
              {m.trialPurpose ? <Text style={styles.purpose}>{m.trialPurpose}</Text> : null}
              <Text style={styles.meta}>
                Target depth: <Text style={styles.metaData}>{m.targetDepthM}m</Text>
              </Text>
              <Text style={styles.meta}>
                Est. duration: <Text style={styles.metaData}>{m.durationMinutes} min</Text> (active)
              </Text>
              <Text style={styles.meta}>
                Risk: <Text style={styles.metaData}>{m.risk}</Text>
              </Text>
              <Text style={styles.reward}>Expected: {m.expectedRewardsText}</Text>
              {upcomingModifier ? (
                <View
                  style={[
                    styles.modifierTag,
                    isHarderModifier(upcomingModifier) ? styles.modifierTagHarder : styles.modifierTagEasier,
                  ]}
                >
                  <Text
                    style={[
                      styles.modifierName,
                      isHarderModifier(upcomingModifier) ? styles.modifierNameHarder : styles.modifierNameEasier,
                    ]}
                  >
                    {upcomingModifier.name.toUpperCase()}
                  </Text>
                  <Text style={styles.modifierBlurb}>{upcomingModifier.blurb}</Text>
                </View>
              ) : null}
              {isExperimental && firstClear && (status === 'available' || status === 'locked') ? (
                <Text style={styles.rewardPreview}>
                  First-clear rewards: +{firstClear.scrap} Scrap, +{firstClear.researchData}{' '}
                  Research Data, +{firstClear.hullPatchKits} Hull Patch Kit
                  {firstClear.hullPatchKits === 1 ? '' : 's'}, +{firstClear.pressureSealant}{' '}
                  Pressure Sealant
                </Text>
              ) : null}
              {isExperimental && locked && req ? (
                <Text style={styles.requirement}>{req}</Text>
              ) : null}
              <Text
                style={[
                  styles.actionHint,
                  locked || inProg || activeBlocking || debriefBlocking
                    ? styles.actionMuted
                    : styles.actionAccent,
                ]}
              >
                {activeBlocking
                  ? 'Active trial dive in progress — surface or complete the run first.'
                  : debriefBlocking
                    ? ms.debriefPending
                    : action}
              </Text>
            </PanelCard>
          </Pressable>
        );
      })}
      {STORY_MISSION_DEFINITIONS.length > 0 ? (
        <>
          <Text style={styles.storySectionLabel}>Operational assignments</Text>
          <Text style={styles.storySectionHint}>
            Unlocked: {getAvailableMissions(state).length} · Locked:{' '}
            {getLockedMissions(state).length}
          </Text>
          {STORY_MISSION_DEFINITIONS.map((def) => {
            const completed = isStoryMissionCompleted(state, def.id);
            const unlocked = isMissionUnlocked(state, def.id);
            const locked = !unlocked && !completed;
            const badge = storyMissionBadge(def, completed, locked);
            const action = storyMissionAction(def, completed, locked, state);
            const canPress = !locked || def.isPlaceholder || completed;

            return (
              <Pressable
                key={def.id}
                onPress={() => {
                  if (!canPress && locked) return;
                  router.push({
                    pathname: '/story-mission-briefing' as never,
                    params: { missionId: def.id },
                  });
                }}
              >
                <PanelCard variant="document" style={styles.card}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{def.title}</Text>
                    <Text style={[styles.badge, badge.style]}>{badge.text}</Text>
                  </View>
                  <Text style={styles.purpose}>{def.subtitle}</Text>
                  <Text style={styles.meta}>{def.description}</Text>
                  {locked && def.id === 'operation_dead_beacon_return' ? (
                    <Text style={styles.requirement}>{returnMissionLockCopy(state)}</Text>
                  ) : locked && def.id === 'first_contact_analysis' ? (
                    <Text style={styles.requirement}>{firstContactAnalysisLockCopy(state)}</Text>
                  ) : locked && def.id === 'growing_ocean_anomaly_prep' ? (
                    <Text style={styles.requirement}>{growingOceanMissionLockCopy(state)}</Text>
                  ) : locked && def.id === 'command_pressure' ? (
                    <Text style={styles.requirement}>{commandPressureLockCopy(state)}</Text>
                  ) : locked && def.id === 'abyssal_expansion_models' ? (
                    <Text style={styles.requirement}>{abyssalExpansionModelsLockCopy(state)}</Text>
                  ) : def.id === 'expansion_model_deployment_hold' && !locked ? (
                    <Text style={styles.requirement}>{expansionModelDeploymentLockCopy(state)}</Text>
                  ) : locked && def.id === 'operation_dead_beacon' ? (
                    <Text style={styles.requirement}>
                      Complete Operational Integration and await DBX-03 signal tasking.
                    </Text>
                  ) : locked && def.unlockConditions.requiredSpineEvents?.length ? (
                    <Text style={styles.requirement}>
                      Complete prior story requirements to unlock.
                    </Text>
                  ) : null}
                  {def.isPlaceholder && def.id !== 'expansion_model_deployment_hold' ? (
                    <Text style={styles.requirement}>
                      Hull Reinforcement Mk I authorization required.
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.actionHint,
                      locked && !completed ? styles.actionMuted : styles.actionAccent,
                    ]}
                  >
                    {action}
                  </Text>
                </PanelCard>
              </Pressable>
            );
          })}
        </>
      ) : null}
      {state.dive?.status === 'active' ? (
        <Text style={styles.warn}>
          Active trial dive in progress — surface or complete the run first.
        </Text>
      ) : null}
      {state.dive && state.dive.status !== 'active' ? (
        <Text style={styles.warn}>{ms.debriefPending}</Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  progressLine: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  highlightBanner: {
    color: theme.accent,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  card: { marginBottom: 4 },
  cardHighlight: {
    borderColor: theme.accent,
    borderWidth: 2,
    backgroundColor: theme.panelBgSolid,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  name: { color: theme.text, fontSize: 18, fontWeight: '700', flex: 1 },
  badge: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  badgeLocked: { color: theme.textMuted },
  badgeAvailable: { color: theme.accent },
  badgeProgress: { color: theme.warning },
  badgeDone: { color: theme.ok },
  badgeRetry: { color: theme.warning },
  purpose: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  meta: { color: theme.textMuted, marginBottom: 2 },
  metaData: { ...monoData, color: theme.instrumentCyan, fontWeight: '700' },
  reward: { color: theme.accent, marginTop: 6 },
  modifierTag: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  modifierTagHarder: {
    borderColor: theme.warningBorder,
    backgroundColor: theme.warningBg,
  },
  modifierTagEasier: {
    borderColor: theme.okBorder,
    backgroundColor: theme.okBg,
  },
  modifierName: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  modifierNameHarder: { color: theme.warning },
  modifierNameEasier: { color: theme.ok },
  modifierBlurb: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  rewardPreview: { color: theme.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 },
  requirement: { color: theme.warning, fontSize: 12, marginTop: 8, lineHeight: 17 },
  actionHint: { marginTop: 10, fontSize: 13, fontWeight: '800' },
  actionAccent: { color: theme.accent },
  actionMuted: { color: theme.textMuted },
  warn: { color: theme.warning },
  storySectionLabel: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 4,
  },
  storySectionHint: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
});
