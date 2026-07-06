import { isValidSpineEventForEra, REVEAL_LEVEL, type SpineEventId } from '@/game/canon';
import { applyRobertsUpdate } from '@/game/roberts';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';
import type { CommandStance } from '@/game/roberts';

/** Story reward flags defined in data/storyMissions.ts — granted on P1.2 resolution. */
export const STORY_FLAG_DEAD_BEACON_DATA = 'deadBeaconData';
export const STORY_FLAG_HULL_REINFORCEMENT_MK1 = 'hull_reinforcement_mk1';

export type DeadBeaconDataDecisionChoice =
  | 'report_official'
  | 'withhold_review'
  | 'request_withdrawal';

export const DEAD_BEACON_DATA_DECISION_CHOICES: readonly DeadBeaconDataDecisionChoice[] = [
  'report_official',
  'withhold_review',
  'request_withdrawal',
] as const;

export interface DeadBeaconDecisionOption {
  id: DeadBeaconDataDecisionChoice;
  label: string;
  summary: string;
}

export const DEAD_BEACON_DECISION_OPTIONS: readonly DeadBeaconDecisionOption[] = [
  {
    id: 'report_official',
    label: 'Report through official channels',
    summary:
      'Transmit the recon package to DBX Program Command and Navy liaison per standard operational reporting. Accept full bureaucratic review and classification.',
  },
  {
    id: 'withhold_review',
    label: 'Delay transmission — internal review first',
    summary:
      'Hold the full data package aboard DBX-07 pending Research and XO cross-check. Release a sanitized summary to Command while the corrupted telemetry is verified.',
  },
  {
    id: 'request_withdrawal',
    label: 'Recommend controlled withdrawal',
    summary:
      'Report findings and formally request stand-down from further approach operations until Engineering can authorize reinforced hull treatment for a controlled revisit.',
  },
] as const;

const CHOICE_RESOLUTION_COPY: Record<
  DeadBeaconDataDecisionChoice,
  { headline: string; summary: string; stance: CommandStance; robertsDelta: { commandReputation?: number; crewTrust?: number; stress?: number } }
> = {
  report_official: {
    headline: 'Data logged — official report filed',
    summary:
      'DBX Program Command has received the recon package under restricted classification. Command notes the signal confirmation without explanation. Hull Reinforcement Mk I development is authorized from the returned readings.',
    stance: 'procedural',
    robertsDelta: { commandReputation: 2, stress: 1 },
  },
  withhold_review: {
    headline: 'Partial release — internal review ongoing',
    summary:
      'Command received a sanitized summary while Research retains the full corrupted telemetry aboard DBX-07. Engineering has been cleared to begin Hull Reinforcement Mk I work from the verified subset.',
    stance: 'cautious',
    robertsDelta: { commandReputation: -1, crewTrust: 2, stress: 1 },
  },
  request_withdrawal: {
    headline: 'Withdrawal recommended — reinforcement authorized',
    summary:
      'Roberts filed a stand-down recommendation with confirmed signal data attached. Command accepted controlled withdrawal as prudent command judgment. Hull Reinforcement Mk I authorization follows for a future revisit.',
    stance: 'cautious',
    robertsDelta: { commandReputation: 3, crewTrust: 1 },
  },
};

export function isDeadBeaconDataDecisionChoice(value: string): value is DeadBeaconDataDecisionChoice {
  return (DEAD_BEACON_DATA_DECISION_CHOICES as readonly string[]).includes(value);
}

export function hasStoryFlag(state: GameState, flag: string): boolean {
  return (state.storyFlags ?? []).includes(flag);
}

export function grantStoryFlag(state: GameState, flag: string): GameState {
  if (hasStoryFlag(state, flag)) return state;
  return { ...state, storyFlags: [...(state.storyFlags ?? []), flag] };
}

/** True when recon is complete but P1.2 data disposition has not been resolved. */
export function isDeadBeaconDataDecisionPending(state: GameState): boolean {
  if (hasStoryFlag(state, STORY_FLAG_DEAD_BEACON_DATA)) return false;
  return state.completedSpineEvents.includes('operation_dead_beacon');
}

export function canResolveDeadBeaconDataDecision(state: GameState): boolean {
  return isDeadBeaconDataDecisionPending(state);
}

function completeSpineEventIfValid(state: GameState, eventId: SpineEventId): GameState {
  if (!isValidSpineEventForEra(eventId, state.canonEra)) return state;
  if (state.completedSpineEvents.includes(eventId)) return state;
  return { ...state, completedSpineEvents: [...state.completedSpineEvents, eventId] };
}

/**
 * Resolve the post-recon Dead Beacon data decision.
 * Grants P1.2 flags and spine events; does NOT mark first_anomaly_contact (reserved for dive exposure).
 */
export function resolveDeadBeaconDataDecision(
  state: GameState,
  choice: DeadBeaconDataDecisionChoice,
): GameState {
  if (!canResolveDeadBeaconDataDecision(state)) return state;

  const copy = CHOICE_RESOLUTION_COPY[choice];
  let next = state;

  next = grantStoryFlag(next, STORY_FLAG_DEAD_BEACON_DATA);
  next = grantStoryFlag(next, STORY_FLAG_HULL_REINFORCEMENT_MK1);
  next = completeSpineEventIfValid(next, 'hull_reinforcement_mk1');
  if (choice === 'request_withdrawal') {
    next = completeSpineEventIfValid(next, 'correct_withdrawal');
  }

  if (next.revealLevel < REVEAL_LEVEL.ANOMALY_CONFIRMED) {
    next = { ...next, revealLevel: REVEAL_LEVEL.ANOMALY_CONFIRMED };
  }

  next = {
    ...next,
    roberts: applyRobertsUpdate(next.roberts, {
      delta: copy.robertsDelta,
      stance: copy.stance,
    }),
  };

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'high',
    title: copy.headline,
    summaryText: copy.summary,
    speakerId: 'xo',
  });

  if (next.lastMissionOutcome?.storyDebrief) {
    next = {
      ...next,
      lastMissionOutcome: {
        ...next.lastMissionOutcome,
        storyDebrief: {
          ...next.lastMissionOutcome.storyDebrief,
          pendingDataDecision: false,
          dataDecisionResolved: true,
          dataDecisionHeadline: copy.headline,
          dataDecisionSummary: copy.summary,
        },
      },
    };
  }

  return next;
}

/** Lock / status copy for Return to DBX-03 Site mission card. */
export function returnMissionLockCopy(state: GameState): string {
  if (
    hasStoryFlag(state, STORY_FLAG_DEAD_BEACON_DATA) &&
    hasStoryFlag(state, STORY_FLAG_HULL_REINFORCEMENT_MK1)
  ) {
    return 'Return dive authorized — Hull Reinforcement Mk I installed.';
  }
  if (isDeadBeaconDataDecisionPending(state)) {
    return 'Dead Beacon data unresolved — disposition decision required.';
  }
  if (!hasStoryFlag(state, STORY_FLAG_HULL_REINFORCEMENT_MK1)) {
    return 'Hull reinforcement authorization required.';
  }
  return 'Complete prior story requirements to unlock.';
}

export function returnMissionActionCopy(state: GameState): string {
  if (
    hasStoryFlag(state, STORY_FLAG_DEAD_BEACON_DATA) &&
    hasStoryFlag(state, STORY_FLAG_HULL_REINFORCEMENT_MK1)
  ) {
    return 'Launch return dive';
  }
  if (isDeadBeaconDataDecisionPending(state)) {
    return 'Dead Beacon data unresolved';
  }
  if (!hasStoryFlag(state, STORY_FLAG_HULL_REINFORCEMENT_MK1)) {
    return 'Hull reinforcement required';
  }
  return 'Locked';
}
