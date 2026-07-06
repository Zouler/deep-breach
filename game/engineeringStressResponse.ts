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

export const STORY_FLAG_ENGINEERING_STRESS_AUDIT = 'engineering_stress_audit';
export const STORY_FLAG_ENGINEERING_OPERATIONAL_LIMITS = 'engineering_operational_limits';
export const STORY_FLAG_ENGINEERING_SHIELDING_REVIEW = 'engineering_shielding_review';

export const ENGINEERING_STRESS_RESPONSE_FLAGS = [
  STORY_FLAG_ENGINEERING_STRESS_AUDIT,
  STORY_FLAG_ENGINEERING_OPERATIONAL_LIMITS,
  STORY_FLAG_ENGINEERING_SHIELDING_REVIEW,
] as const;

export type EngineeringStressResponseChoice =
  | 'authorize_stress_audit'
  | 'impose_operational_limits'
  | 'accelerate_shielding_review';

export const ENGINEERING_STRESS_RESPONSE_CHOICES: readonly EngineeringStressResponseChoice[] = [
  'authorize_stress_audit',
  'impose_operational_limits',
  'accelerate_shielding_review',
] as const;

export interface EngineeringStressResponseOption {
  id: EngineeringStressResponseChoice;
  label: string;
  summary: string;
}

export const ENGINEERING_STRESS_RESPONSE_OPTIONS: readonly EngineeringStressResponseOption[] = [
  {
    id: 'authorize_stress_audit',
    label: 'Authorize Full Engineering Stress Audit',
    summary:
      'Task Engineering to log micro-stress accumulation across Mk I shielding, engine bay, and pressure skin. Restricted classification — no operational launch until audit cycle completes.',
  },
  {
    id: 'impose_operational_limits',
    label: 'Impose Operational Limits Pending Review',
    summary:
      'Declare interim descent and exposure limits until Engineering validates survivability margins against the prioritized expansion model.',
  },
  {
    id: 'accelerate_shielding_review',
    label: 'Accelerate Shielding Review Cycle',
    summary:
      'Prioritize shielding correlation work with Research under restricted watch. Accept schedule pressure on Engineering crews without authorizing a new descent.',
  },
] as const;

/** Future in-world hint after P1.9 resolution. */
export const DESCENT_AUTHORIZATION_THRESHOLD_COPY =
  'Deployment profile not yet authorized.';

const CHOICE_TO_FLAG: Record<EngineeringStressResponseChoice, string> = {
  authorize_stress_audit: STORY_FLAG_ENGINEERING_STRESS_AUDIT,
  impose_operational_limits: STORY_FLAG_ENGINEERING_OPERATIONAL_LIMITS,
  accelerate_shielding_review: STORY_FLAG_ENGINEERING_SHIELDING_REVIEW,
};

const REWARDS: Record<EngineeringStressResponseChoice, { scrap: number; researchData: number }> = {
  authorize_stress_audit: { scrap: 0, researchData: 15 },
  impose_operational_limits: { scrap: 15, researchData: 0 },
  accelerate_shielding_review: { scrap: 10, researchData: 10 },
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
  authorize_stress_audit: {
    headline: 'Full engineering stress audit authorized',
    summary:
      'Engineering will log micro-stress across Mk I shielding and engine systems under restricted classification. No operational launch until the audit cycle is filed.',
    stance: 'procedural',
  },
  impose_operational_limits: {
    headline: 'Interim operational limits imposed',
    summary:
      'Descent and exposure limits are in effect pending Engineering review against the prioritized expansion model. Command accepts survivability constraints as operational law aboard DBX-07.',
    stance: 'cautious',
  },
  accelerate_shielding_review: {
    headline: 'Shielding review cycle accelerated',
    summary:
      'Engineering and Research will run an accelerated shielding correlation pass under restricted watch. No dive authorized — schedule pressure accepted without field tasking.',
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
