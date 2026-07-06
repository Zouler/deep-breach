import {
  EXPERIMENTAL_TRIAL_MISSION_IDS,
  EXPERIMENTAL_TRIAL_SET,
} from '@/data/experimentalTrials';
import { STORY_DIVE_MISSION_SET } from '@/data/missions';
import {
  SPINE_EVENT_ALIASES,
  STORY_MISSION_BY_ID,
  STORY_MISSION_DEFINITIONS,
  type MissionDefinition,
} from '@/data/storyMissions';
import {
  canReveal,
  isEraUnlocked,
  isSpineEventId,
  isValidSpineEventForEra,
  REVEAL_LEVEL,
  type RevealLevel,
  type SpineEventId,
} from '@/game/canon';
import { withSyncedLegacyEconomy } from '@/game/baseStorage';
import { hasStoryFlag as hasStoryFlagFromState } from '@/game/deadBeaconDecision';
import { buildAnomalyContactDebrief } from '@/game/anomalyContact';
import { isStoryDiveReconSuccessful } from '@/game/storyMissionObjectives';
import { withStoryBeat } from '@/game/storyBeats';
import { applyRobertsUpdate } from '@/game/roberts';
import { experimentalTrialsCompletedCount } from '@/game/trialProgression';
import type { DiveSession, GameState, Mission, MissionOutcome } from '@/types';
import type { StoryDebriefAttachment } from '@/types/trials';

export function resolveSpineEventId(eventRef: string): SpineEventId | null {
  if (isSpineEventId(eventRef)) return eventRef;
  return SPINE_EVENT_ALIASES[eventRef] ?? null;
}

export function hasCompletedSpineEvent(state: GameState, eventRef: string): boolean {
  const id = resolveSpineEventId(eventRef);
  if (!id) return false;
  return state.completedSpineEvents.includes(id);
}

export function areAllExperimentalTrialsComplete(state: GameState): boolean {
  return experimentalTrialsCompletedCount(state) >= EXPERIMENTAL_TRIAL_MISSION_IDS.length;
}

export function getMissionDefinition(missionId: string): MissionDefinition | undefined {
  return STORY_MISSION_BY_ID[missionId];
}

export function isStoryMissionCompleted(state: GameState, missionId: string): boolean {
  const def = getMissionDefinition(missionId);
  if (!def) return false;
  if (def.completionFlag) return hasStoryFlag(state, def.completionFlag);
  if (!def.spineEventId) return false;
  return hasCompletedSpineEvent(state, def.spineEventId);
}

function meetsUnlockConditions(state: GameState, def: MissionDefinition): boolean {
  if (!isEraUnlocked(state.canonEra, def.canonEraRequired)) return false;
  if (
    !canReveal(
      state.canonEra,
      state.revealLevel,
      def.revealLevelRequired as RevealLevel,
    )
  ) {
    return false;
  }

  const cond = def.unlockConditions;
  if (cond.requireAllTrialsComplete && !areAllExperimentalTrialsComplete(state)) {
    return false;
  }
  if (cond.requiredSpineEvents?.some((e) => !hasCompletedSpineEvent(state, e))) {
    return false;
  }
  if (cond.requiredFlags?.some((flag) => !stateHasStoryFlag(state, flag))) {
    return false;
  }
  return true;
}

/** Story flags from data/storyMissions rewards and unlock conditions. */
export function hasStoryFlag(state: GameState, flag: string): boolean {
  return hasStoryFlagFromState(state, flag);
}

function stateHasStoryFlag(state: GameState, flag: string): boolean {
  return hasStoryFlag(state, flag);
}

export function isMissionUnlocked(state: GameState, missionId: string): boolean {
  const def = getMissionDefinition(missionId);
  if (!def) return false;
  return meetsUnlockConditions(state, def);
}

export function getAvailableMissions(state: GameState): MissionDefinition[] {
  return STORY_MISSION_DEFINITIONS.filter(
    (def) => isMissionUnlocked(state, def.id) && !isStoryMissionCompleted(state, def.id),
  );
}

export function getLockedMissions(state: GameState): MissionDefinition[] {
  return STORY_MISSION_DEFINITIONS.filter(
    (def) => !isMissionUnlocked(state, def.id) && !isStoryMissionCompleted(state, def.id),
  );
}

export function getNextStoryMission(state: GameState): MissionDefinition | undefined {
  return getAvailableMissions(state)[0];
}

export function isStoryDiveMissionId(missionId: string): boolean {
  return STORY_DIVE_MISSION_SET.has(missionId);
}

export function storyAssignmentIdForDiveMission(diveMissionId: string): string | undefined {
  const def = STORY_MISSION_DEFINITIONS.find((d) => d.diveMissionId === diveMissionId);
  return def?.id;
}

export function canStartStoryDiveMission(state: GameState, diveMissionId: string): boolean {
  if (!isStoryDiveMissionId(diveMissionId)) return false;
  if (state.dive) return false;
  const assignmentId = storyAssignmentIdForDiveMission(diveMissionId) ?? diveMissionId;
  return isMissionUnlocked(state, assignmentId) && !isStoryMissionCompleted(state, assignmentId);
}

/** Mark recon launch spine events when a story dive begins. */
export function onStartStoryDiveMission(state: GameState, diveMissionId: string): GameState {
  const assignmentId = storyAssignmentIdForDiveMission(diveMissionId) ?? diveMissionId;
  const def = getMissionDefinition(assignmentId);
  if (!def?.isDiveMission) return state;
  let next = state;
  if (def.launchSpineEventId) {
    next = completeSpineEventIfValid(next, def.launchSpineEventId);
  }
  return next;
}

function patchOutcomeStoryDebrief(
  state: GameState,
  debrief: StoryDebriefAttachment | null,
): GameState {
  if (!debrief || !state.lastMissionOutcome) return state;
  const o: MissionOutcome = { ...state.lastMissionOutcome, storyDebrief: debrief };
  return { ...state, lastMissionOutcome: o };
}

function deadBeaconStoryDebrief(dive: DiveSession): StoryDebriefAttachment {
  const reconComplete = isStoryDiveReconSuccessful(dive);
  if (reconComplete) {
    return {
      reconComplete: true,
      pendingDataDecision: true,
      headline: 'Recon data returned — signal confirmed active',
      summaryLine:
        'DBX-07 returned with partial acoustic and environmental readings from the DBX-03 loss zone. The authenticated distress signal appears active. Command has flagged the data as incomplete and restricted pending review — enough to worry, not enough to explain. DBX Program Command awaits your disposition of the data package.',
    };
  }
  return {
    reconComplete: false,
    headline: 'Recon incomplete — insufficient standoff data',
    summaryLine:
      'DBX-07 surfaced before standoff scan and depth requirements were met. Command notes the DBX-03 signal remains unconfirmed in the field record. Re-tasking may follow.',
  };
}

/** Modest completion payout — P1.2 flag grants deferred. */
const DEAD_BEACON_COMPLETION_SCRAP = 45;
const DEAD_BEACON_COMPLETION_RESEARCH = 25;
const RETURN_CONTACT_COMPLETION_SCRAP = 55;
const RETURN_CONTACT_COMPLETION_RESEARCH = 40;

/**
 * Apply story dive resolution after terminal outcome is recorded.
 * P1.2 reward flags (deadBeaconData, hull_reinforcement_mk1) granted via post-recon decision.
 */
export function applyStoryDiveResolution(
  state: GameState,
  mission: Mission,
  dive: DiveSession,
): GameState {
  if (!isStoryDiveMissionId(mission.id)) return state;

  const assignmentId = storyAssignmentIdForDiveMission(mission.id) ?? mission.id;
  const def = getMissionDefinition(assignmentId);
  if (!def) return state;

  let next = state;
  let debrief: StoryDebriefAttachment | null = null;

  if (assignmentId === 'operation_dead_beacon') {
    debrief = deadBeaconStoryDebrief(dive);
    if (debrief.reconComplete && def.spineEventId) {
      next = completeSpineEventIfValid(next, def.spineEventId);
      next = {
        ...withSyncedLegacyEconomy({
          ...next,
          baseStorage: {
            ...next.baseStorage,
            scrap: next.baseStorage.scrap + DEAD_BEACON_COMPLETION_SCRAP,
            researchData: next.baseStorage.researchData + DEAD_BEACON_COMPLETION_RESEARCH,
          },
        }),
      };
      next = withStoryBeat(next, {
        type: 'mission_complete',
        importance: 'high',
        title: 'Operation Dead Beacon — recon returned',
        summaryText:
          'Standoff reconnaissance of the DBX-03 sector is logged. The distress signal reads as active; Research and Command have restricted the data package pending review.',
        speakerId: 'xo',
        missionId: assignmentId,
        diveStartedAt: dive.startedAt,
      });
    }
  }

  if (assignmentId === 'operation_dead_beacon_return') {
    const contact = buildAnomalyContactDebrief(dive);
    debrief = {
      reconComplete: false,
      headline: contact.headline,
      summaryLine: contact.summaryLine,
      firstContactComplete: contact.firstContactComplete,
    };
    if (contact.firstContactComplete) {
      next = completeSpineEventIfValid(next, 'first_anomaly_contact');
      if (def.spineEventId) {
        next = completeSpineEventIfValid(next, def.spineEventId);
      }
      next = {
        ...withSyncedLegacyEconomy({
          ...next,
          baseStorage: {
            ...next.baseStorage,
            scrap: next.baseStorage.scrap + RETURN_CONTACT_COMPLETION_SCRAP,
            researchData: next.baseStorage.researchData + RETURN_CONTACT_COMPLETION_RESEARCH,
          },
        }),
      };
      next = {
        ...next,
        roberts: applyRobertsUpdate(next.roberts, {
          delta: { stress: 2, obsession: 1 },
          stance: 'cautious',
        }),
      };
      next = withStoryBeat(next, {
        type: 'mission_complete',
        importance: 'high',
        title: 'Return to DBX-03 Site — first contact logged',
        summaryText:
          'Controlled return dive complete. Command confirms contact with an unexplained phenomenon; sensor data remains contradictory and restricted.',
        speakerId: 'research_lead',
        missionId: assignmentId,
        diveStartedAt: dive.startedAt,
      });
    }
  }

  return patchOutcomeStoryDebrief(next, debrief);
}

function completeSpineEventIfValid(state: GameState, eventId: SpineEventId): GameState {
  if (!isValidSpineEventForEra(eventId, state.canonEra)) return state;
  if (state.completedSpineEvents.includes(eventId)) return state;
  return {
    ...state,
    completedSpineEvents: [...state.completedSpineEvents, eventId],
  };
}

/** Mark experimental trials spine complete when all trials are certified. */
export function markExperimentalTrialsCompleteIfNeeded(state: GameState): GameState {
  if (!areAllExperimentalTrialsComplete(state)) return state;
  return completeSpineEventIfValid(state, 'experimental_trials_complete');
}

/** Apply non-dive story assignment completion (briefing acknowledge). Rewards are stubbed. */
export function applyStoryMissionCompletion(state: GameState, missionId: string): GameState {
  const def = getMissionDefinition(missionId);
  if (!def || def.isPlaceholder) return state;
  if (!isMissionUnlocked(state, missionId)) return state;
  if (isStoryMissionCompleted(state, missionId)) return state;
  if (def.isDiveMission) return state;

  let next = state;

  switch (missionId) {
    case 'operational_integration': {
      next = completeSpineEventIfValid(next, 'operational_integration');
      if (next.canonEra === 'experimental_trials') {
        next = {
          ...next,
          canonEra: 'dead_beacon',
          revealLevel: REVEAL_LEVEL.IMPOSSIBLE_SIGNAL,
        };
      }
      next = completeSpineEventIfValid(next, 'dbx03_signal_received');
      next = withStoryBeat(next, {
        type: 'xo_command',
        importance: 'high',
        title: 'Operational integration complete',
        summaryText:
          'Commander Roberts and DBX-07 are integrated into Navy operational command. DBX Program Command has closed the experimental certification file.',
        speakerId: 'xo',
      });
      break;
    }
    default:
      if (def.spineEventId) {
        next = completeSpineEventIfValid(next, def.spineEventId);
      }
      break;
  }

  return next;
}

/** True when mission id is an experimental trial (not a story assignment). */
export function isExperimentalTrialMissionId(missionId: string): boolean {
  return EXPERIMENTAL_TRIAL_SET.has(missionId);
}
