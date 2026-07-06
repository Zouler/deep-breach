import { isValidSpineEventForEra, type SpineEventId } from '@/game/canon';
import { grantStoryFlag, hasStoryFlag } from '@/game/deadBeaconDecision';
import { withSyncedLegacyEconomy } from '@/game/baseStorage';
import { applyRobertsUpdate, type CommandStance } from '@/game/roberts';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';

/** Strategic posture flags — exactly one may be present after P1.7 resolution. */
export const STORY_FLAG_COMMAND_ESCALATION = 'command_escalation';
export const STORY_FLAG_CONTROLLED_OBSERVATION = 'controlled_observation';
export const STORY_FLAG_EMERGENCY_WITHDRAWAL = 'emergency_withdrawal_protocols';

export const COMMAND_PRESSURE_SPINE_EVENT: SpineEventId = 'command_pressure';

export const STRATEGIC_RESPONSE_FLAGS = [
  STORY_FLAG_COMMAND_ESCALATION,
  STORY_FLAG_CONTROLLED_OBSERVATION,
  STORY_FLAG_EMERGENCY_WITHDRAWAL,
] as const;

export type CommandPressureChoice =
  | 'report_up_chain'
  | 'controlled_observation'
  | 'emergency_withdrawal';

export const COMMAND_PRESSURE_CHOICES: readonly CommandPressureChoice[] = [
  'report_up_chain',
  'controlled_observation',
  'emergency_withdrawal',
] as const;

export interface CommandPressureOption {
  id: CommandPressureChoice;
  label: string;
  summary: string;
}

export const COMMAND_PRESSURE_OPTIONS: readonly CommandPressureOption[] = [
  {
    id: 'report_up_chain',
    label: 'Report Up the Chain',
    summary:
      'Transmit the monitoring package to DBX Program Command and Navy liaison under formal escalation. Accept full bureaucratic review and restricted classification.',
  },
  {
    id: 'controlled_observation',
    label: 'Continue Controlled Observation',
    summary:
      'Maintain passive watch parameters and keep DBX-07 on station without panic tasking. Defer formal conclusions until Command receives repeatable readings.',
  },
  {
    id: 'emergency_withdrawal',
    label: 'Prepare Emergency Withdrawal Protocols',
    summary:
      'Treat the expanding footprint as a serious operational threat. Task Engineering to draft stand-down and emergency surface protocols before the next authorized descent.',
  },
] as const;

const CHOICE_TO_FLAG: Record<CommandPressureChoice, string> = {
  report_up_chain: STORY_FLAG_COMMAND_ESCALATION,
  controlled_observation: STORY_FLAG_CONTROLLED_OBSERVATION,
  emergency_withdrawal: STORY_FLAG_EMERGENCY_WITHDRAWAL,
};

const REWARDS: Record<CommandPressureChoice, { scrap: number; researchData: number }> = {
  report_up_chain: { scrap: 0, researchData: 10 },
  controlled_observation: { scrap: 10, researchData: 15 },
  emergency_withdrawal: { scrap: 20, researchData: 0 },
};

const CHOICE_RESOLUTION: Record<
  CommandPressureChoice,
  {
    headline: string;
    summary: string;
    scienceLine: string;
    engineeringLine: string;
    robertsLine: string;
    stance: CommandStance;
    robertsDelta: { commandReputation?: number; crewTrust?: number; stress?: number; obsession?: number };
  }
> = {
  report_up_chain: {
    headline: 'Formal escalation filed — Command review initiated',
    summary:
      'DBX Program Command has the full monitoring package under restricted escalation. Navy liaison acknowledges the footprint is no longer dive-site isolated. No operational explanation has been issued.',
    scienceLine:
      'Research Lead notes the dataset is complete enough for correlation but not for classification. Command will receive sanitized summaries on their schedule — not ours.',
    engineeringLine:
      'Engineering Lead logs repeated exposure stress on Mk I shielding beyond nominal failure models. Formal reporting does not reduce hull risk — it only documents it.',
    robertsLine:
      'I filed the package because procedure exists for a reason. Command will move slowly. The ocean will not.',
    stance: 'procedural',
    robertsDelta: { commandReputation: 2, stress: 2 },
  },
  controlled_observation: {
    headline: 'Controlled observation posture authorized',
    summary:
      'Passive watch remains the standing order. Command accepts continued monitoring without panic tasking. DBX-07 holds position under restricted classification.',
    scienceLine:
      'Research Lead requests additional baseline windows before any model update. The readings repeat — that is enough to treat this as operational, not enough to name it.',
    engineeringLine:
      'Engineering Lead accepts the posture but flags cumulative hull micro-stress. Observation is not free — it is deferred cost.',
    robertsLine:
      'We watch because we must understand before we act. I will not authorize panic or silence — only measured command.',
    stance: 'cautious',
    robertsDelta: { commandReputation: 1, crewTrust: 1, stress: 1 },
  },
  emergency_withdrawal: {
    headline: 'Emergency withdrawal protocols drafted',
    summary:
      'Engineering has been tasked to prepare stand-down and emergency surface procedures. Command treats the footprint as a serious operational threat pending review.',
    scienceLine:
      'Research Lead protests the loss of baseline continuity but accepts the safety posture. Data gaps will widen if we withdraw — Command has been notified.',
    engineeringLine:
      'Engineering Lead confirms repeated exposure exceeds normal failure models. Withdrawal protocols are procedural, not defeat — but the hull remembers every descent.',
    robertsLine:
      'I will not pretend this is routine. We prepare to leave before the ocean decides we cannot.',
    stance: 'cautious',
    robertsDelta: { commandReputation: 1, crewTrust: 1, stress: 2 },
  },
};

/** In-world hint for the next locked operation after P1.7. */
export const ABYSSAL_EXPANSION_REVIEW_LOCK_COPY =
  'Command is reviewing abyssal expansion models.';

export function isCommandPressureChoice(value: string): value is CommandPressureChoice {
  return (COMMAND_PRESSURE_CHOICES as readonly string[]).includes(value);
}

export function hasStrategicResponseFlag(state: GameState): boolean {
  return STRATEGIC_RESPONSE_FLAGS.some((flag) => hasStoryFlag(state, flag));
}

export function strategicResponseFlagForState(state: GameState): string | undefined {
  return STRATEGIC_RESPONSE_FLAGS.find((flag) => hasStoryFlag(state, flag));
}

function hasCompletedCommandPressure(state: GameState): boolean {
  return state.completedSpineEvents.includes(COMMAND_PRESSURE_SPINE_EVENT);
}

/** True after Growing Ocean success, before P1.7 strategic response is resolved. */
export function isCommandPressurePending(state: GameState): boolean {
  if (hasCompletedCommandPressure(state)) return false;
  if (hasStrategicResponseFlag(state)) return false;
  return state.completedSpineEvents.includes('growing_ocean_anomaly');
}

export function canResolveCommandPressure(state: GameState): boolean {
  return isCommandPressurePending(state);
}

function completeSpineEventIfValid(state: GameState, eventId: SpineEventId): GameState {
  if (!isValidSpineEventForEra(eventId, state.canonEra)) return state;
  if (state.completedSpineEvents.includes(eventId)) return state;
  return { ...state, completedSpineEvents: [...state.completedSpineEvents, eventId] };
}

function applyRewards(state: GameState, choice: CommandPressureChoice): GameState {
  const reward = REWARDS[choice];
  if (reward.scrap === 0 && reward.researchData === 0) return state;
  return withSyncedLegacyEconomy({
    ...state,
    baseStorage: {
      ...state.baseStorage,
      scrap: state.baseStorage.scrap + reward.scrap,
      researchData: state.baseStorage.researchData + reward.researchData,
    },
    resources: {
      ...state.resources,
      scrap: state.resources.scrap + reward.scrap,
      researchData: state.resources.researchData + reward.researchData,
    },
  });
}

/**
 * Resolve P1.7 Command Pressure — base-side strategic posture after Growing Ocean monitoring.
 * Grants one strategic flag, modest rewards, and marks command_pressure spine once.
 */
export function resolveCommandPressure(state: GameState, choice: CommandPressureChoice): GameState {
  if (!canResolveCommandPressure(state)) return state;

  const copy = CHOICE_RESOLUTION[choice];
  const flag = CHOICE_TO_FLAG[choice];
  let next = state;

  next = grantStoryFlag(next, flag);
  next = completeSpineEventIfValid(next, COMMAND_PRESSURE_SPINE_EVENT);
  next = applyRewards(next, choice);

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

  next = withStoryBeat(next, {
    type: 'internal_crew_event',
    importance: 'medium',
    title: 'Research Lead — posture note',
    summaryText: copy.scienceLine,
    speakerId: 'research_lead',
  });

  next = withStoryBeat(next, {
    type: 'internal_crew_event',
    importance: 'medium',
    title: 'Engineering Lead — posture note',
    summaryText: copy.engineeringLine,
    speakerId: 'chief_engineer',
  });

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'medium',
    title: 'Roberts — decision logged',
    summaryText: copy.robertsLine,
    speakerId: 'commander',
  });

  return next;
}

export function commandPressureActionCopy(state: GameState): string {
  if (hasCompletedCommandPressure(state)) return 'Review decision record';
  if (isCommandPressurePending(state)) return 'Open strategic response';
  return 'Locked';
}

export function commandPressureLockCopy(state: GameState): string {
  if (hasCompletedCommandPressure(state)) {
    return 'Strategic posture logged — Command Pressure decision on file.';
  }
  if (!state.completedSpineEvents.includes('growing_ocean_anomaly')) {
    return 'Growing Ocean Anomaly monitoring incomplete — complete passive watch first.';
  }
  return 'Complete prior story requirements to unlock.';
}

export function abyssalExpansionReviewLockCopy(state: GameState): string {
  if (!hasCompletedCommandPressure(state)) {
    return 'Strategic response pending — resolve Command Pressure first.';
  }
  return ABYSSAL_EXPANSION_REVIEW_LOCK_COPY;
}
