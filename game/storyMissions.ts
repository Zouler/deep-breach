import {
  EXPERIMENTAL_TRIAL_MISSION_IDS,
  EXPERIMENTAL_TRIAL_SET,
} from '@/data/experimentalTrials';
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
import { withStoryBeat } from '@/game/storyBeats';
import { experimentalTrialsCompletedCount } from '@/game/trialProgression';
import type { GameState } from '@/types';

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
  if (!def?.spineEventId) return false;
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

/** Story flags are stubbed in rewards data — not granted until P1.2. */
function stateHasStoryFlag(_state: GameState, _flag: string): boolean {
  return false;
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
    case 'operation_dead_beacon': {
      next = completeSpineEventIfValid(next, 'dead_beacon_recon_started');
      next = withStoryBeat(next, {
        type: 'mission_start',
        importance: 'high',
        title: 'Operation Dead Beacon — recon authorized',
        summaryText:
          'An impossible DBX-03 distress signal triggered priority recon tasking. DBX-07 is cleared for standoff survey only.',
        speakerId: 'xo',
        missionId: def.id,
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
