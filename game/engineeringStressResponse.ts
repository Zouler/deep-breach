import { isValidSpineEventForEra, type SpineEventId } from '@/game/canon';
import {
  MODEL_PRIORITY_FLAGS,
  STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION,
  STORY_FLAG_MODEL_CURRENT_DRIFT,
  STORY_FLAG_MODEL_RESONANCE_FIELD,
} from '@/game/abyssalExpansionModels';
import { grantStoryFlag, hasStoryFlag } from '@/game/deadBeaconDecision';
import { withSyncedLegacyEconomy } from '@/game/baseStorage';
import { applyRobertsUpdate, type CommandStance } from '@/game/roberts';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';

export const ENGINEERING_STRESS_RESPONSE_SPINE_EVENT: SpineEventId = 'engineering_stress_response';

export const STORY_FLAG_ENGINEERING_HULL_TOLERANCE = 'engineering_hull_tolerance';
export const STORY_FLAG_ENGINEERING_SENSOR_STACK = 'engineering_sensor_stack';
export const STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES = 'engineering_repair_supplies';

export const ENGINEERING_STRESS_RESPONSE_FLAGS = [
  STORY_FLAG_ENGINEERING_HULL_TOLERANCE,
  STORY_FLAG_ENGINEERING_SENSOR_STACK,
  STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES,
] as const;

export type EngineeringStressResponseChoice =
  | 'reinforce_hull_tolerance'
  | 'shield_sensor_stack'
  | 'preserve_repair_supplies';

export const ENGINEERING_STRESS_RESPONSE_CHOICES: readonly EngineeringStressResponseChoice[] = [
  'reinforce_hull_tolerance',
  'shield_sensor_stack',
  'preserve_repair_supplies',
] as const;

export interface EngineeringStressResponseOption {
  id: EngineeringStressResponseChoice;
  label: string;
  summary: string;
}

export const ENGINEERING_STRESS_RESPONSE_OPTIONS: readonly EngineeringStressResponseOption[] = [
  {
    id: 'reinforce_hull_tolerance',
    label: 'Reinforce Hull Tolerance',
    summary:
      'Redirect fabrication capacity to Mk I shielding tolerance margins and pressure-skin monitoring. Accept schedule delay on other compartments until hull survivability is re-baselined.',
  },
  {
    id: 'shield_sensor_stack',
    label: 'Shield Sensor Stack',
    summary:
      'Prioritize sensor and shielding correlation arrays to catch micro-stress before it propagates to the engine bay. Research assists under restricted watch — no descent authorized.',
  },
  {
    id: 'preserve_repair_supplies',
    label: 'Preserve Repair Supplies',
    summary:
      'Hold repair stockpiles in reserve and tighten consumption protocols until Engineering validates exposure limits against the prioritized expansion model.',
  },
] as const;

/** Future in-world hint after P1.9 resolution. */
export const DESCENT_AUTHORIZATION_THRESHOLD_COPY =
  'Deployment profile not yet authorized.';

const CHOICE_TO_FLAG: Record<EngineeringStressResponseChoice, string> = {
  reinforce_hull_tolerance: STORY_FLAG_ENGINEERING_HULL_TOLERANCE,
  shield_sensor_stack: STORY_FLAG_ENGINEERING_SENSOR_STACK,
  preserve_repair_supplies: STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES,
};

const REWARDS: Record<EngineeringStressResponseChoice, { scrap: number; researchData: number }> = {
  reinforce_hull_tolerance: { scrap: 15, researchData: 0 },
  shield_sensor_stack: { scrap: 0, researchData: 15 },
  preserve_repair_supplies: { scrap: 10, researchData: 10 },
};

type ModelPriority =
  | typeof STORY_FLAG_MODEL_CURRENT_DRIFT
  | typeof STORY_FLAG_MODEL_RESONANCE_FIELD
  | typeof STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION;

const MODEL_FLAVOR: Record<
  ModelPriority,
  { briefingLine: string; researchNote: string; robertsLine: string }
> = {
  [STORY_FLAG_MODEL_CURRENT_DRIFT]: {
    briefingLine:
      'Current Drift framing stresses cumulative exposure along migration corridors. Engineering treats every projected bearing shift as additional hull-cycle cost.',
    researchNote:
      'Research Lead notes drift models predict spread — not intensity. Engineering argues spread still equals repeated contact.',
    robertsLine:
      'If the footprint moves, we still meet it. Engineering is asking me to price that meeting before Command prices it for us.',
  },
  [STORY_FLAG_MODEL_RESONANCE_FIELD]: {
    briefingLine:
      'Resonance Field framing implicates instrument contradiction and phantom depth readings. Engineering warns that false calm in the record still accumulates real hull stress.',
    researchNote:
      'Research Lead cautions that field hypotheses complicate stress attribution — Engineering rejects that as permission to ignore readings.',
    robertsLine:
      'The instruments disagree. The hull does not. Engineering wants a declared response before the next descent debate.',
  },
  [STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION]: {
    briefingLine:
      'Biological Contamination framing adds oxidation acceleration on shielding samples. Engineering treats particulate hypotheses as contamination risk to Mk I integrity.',
    researchNote:
      'Research Lead stresses no organism is identified — Engineering responds that oxidation on shielding is already a material failure mode.',
    robertsLine:
      'We prioritized a biological hypothesis under restraint. Engineering is asking what restraint means for the pressure skin.',
  },
};

const CHOICE_RESOLUTION: Record<
  EngineeringStressResponseChoice,
  { headline: string; summary: string; stance: CommandStance }
> = {
  reinforce_hull_tolerance: {
    headline: 'Hull tolerance reinforcement prioritized',
    summary:
      'Engineering will re-baseline Mk I shielding tolerance margins and pressure-skin monitoring under restricted classification. No operational launch until survivability review is filed.',
    stance: 'cautious',
  },
  shield_sensor_stack: {
    headline: 'Shield sensor stack prioritized',
    summary:
      'Sensor and shielding correlation arrays take precedence in the next engineering cycle. Research assists under restricted watch — descent authorization remains on hold.',
    stance: 'procedural',
  },
  preserve_repair_supplies: {
    headline: 'Repair supply preservation logged',
    summary:
      'Repair stockpiles held in reserve with tightened consumption protocols until exposure limits are validated against the prioritized expansion model.',
    stance: 'cautious',
  },
};

export function modelPriorityFlagForState(state: GameState): string | undefined {
  return MODEL_PRIORITY_FLAGS.find((flag) => hasStoryFlag(state, flag));
}

export function isEngineeringStressResponseChoice(
  value: string,
): value is EngineeringStressResponseChoice {
  return (ENGINEERING_STRESS_RESPONSE_CHOICES as readonly string[]).includes(value);
}

export function hasEngineeringStressResponseFlag(state: GameState): boolean {
  return ENGINEERING_STRESS_RESPONSE_FLAGS.some((flag) => hasStoryFlag(state, flag));
}

function hasCompletedEngineeringStressResponse(state: GameState): boolean {
  return state.completedSpineEvents.includes(ENGINEERING_STRESS_RESPONSE_SPINE_EVENT);
}

/** True after P1.8, before P1.9 engineering response is resolved. */
export function isEngineeringStressResponsePending(state: GameState): boolean {
  if (hasCompletedEngineeringStressResponse(state)) return false;
  if (hasEngineeringStressResponseFlag(state)) return false;
  if (!state.completedSpineEvents.includes('abyssal_expansion_models')) return false;
  return modelPriorityFlagForState(state) !== undefined;
}

export function canResolveEngineeringStressResponse(state: GameState): boolean {
  return isEngineeringStressResponsePending(state);
}

export function modelPriorityFlavorForState(
  state: GameState,
): typeof MODEL_FLAVOR[ModelPriority] | null {
  const model = modelPriorityFlagForState(state);
  if (!model || !(model in MODEL_FLAVOR)) return null;
  return MODEL_FLAVOR[model as ModelPriority];
}

function completeSpineEventIfValid(state: GameState, eventId: SpineEventId): GameState {
  if (!isValidSpineEventForEra(eventId, state.canonEra)) return state;
  if (state.completedSpineEvents.includes(eventId)) return state;
  return { ...state, completedSpineEvents: [...state.completedSpineEvents, eventId] };
}

function applyRewards(state: GameState, choice: EngineeringStressResponseChoice): GameState {
  const reward = REWARDS[choice];
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
 * Resolve P1.9 Engineering Stress Response — declare how Engineering responds to
 * accumulated hull and engine stress after expansion model prioritization.
 */
export function resolveEngineeringStressResponse(
  state: GameState,
  choice: EngineeringStressResponseChoice,
): GameState {
  if (!canResolveEngineeringStressResponse(state)) return state;

  const model = modelPriorityFlagForState(state);
  const flavor = model ? MODEL_FLAVOR[model as ModelPriority] : null;
  const copy = CHOICE_RESOLUTION[choice];
  const flag = CHOICE_TO_FLAG[choice];
  let next = state;

  next = grantStoryFlag(next, flag);
  next = completeSpineEventIfValid(next, ENGINEERING_STRESS_RESPONSE_SPINE_EVENT);
  next = applyRewards(next, choice);

  next = {
    ...next,
    roberts: applyRobertsUpdate(next.roberts, {
      delta: { stress: 1, crewTrust: 1 },
      stance: copy.stance,
    }),
  };

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'high',
    title: copy.headline,
    summaryText: copy.summary,
    speakerId: 'chief_engineer',
  });

  if (flavor) {
    next = withStoryBeat(next, {
      type: 'internal_crew_event',
      importance: 'medium',
      title: 'Research Lead — stress response note',
      summaryText: flavor.researchNote,
      speakerId: 'research_lead',
    });
    next = withStoryBeat(next, {
      type: 'xo_command',
      importance: 'medium',
      title: 'Roberts — engineering posture logged',
      summaryText: flavor.robertsLine,
      speakerId: 'commander',
    });
  }

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'medium',
    title: 'Command disposition — descent authorization hold',
    summaryText: DESCENT_AUTHORIZATION_THRESHOLD_COPY,
    speakerId: 'xo',
  });

  return next;
}

export function engineeringStressResponseActionCopy(state: GameState): string {
  if (hasCompletedEngineeringStressResponse(state)) return 'Review engineering record';
  if (isEngineeringStressResponsePending(state)) return 'Open engineering stress response';
  return 'Locked';
}

export function engineeringStressResponseLockCopy(state: GameState): string {
  if (hasCompletedEngineeringStressResponse(state)) {
    return 'Engineering stress response logged — descent authorization pending.';
  }
  if (!state.completedSpineEvents.includes('abyssal_expansion_models')) {
    return 'Expansion model analysis pending — prioritize a model first.';
  }
  if (!modelPriorityFlagForState(state)) {
    return 'Model priority flag missing — complete Abyssal Expansion Models first.';
  }
  return 'Complete prior story requirements to unlock.';
}

export function descentAuthorizationLockCopy(state: GameState): string {
  if (!hasCompletedEngineeringStressResponse(state)) {
    return 'Engineering stress response pending — declare an engineering posture first.';
  }
  return DESCENT_AUTHORIZATION_THRESHOLD_COPY;
}
