import { isValidSpineEventForEra, type SpineEventId } from '@/game/canon';
import { grantStoryFlag, hasStoryFlag } from '@/game/deadBeaconDecision';
import { withSyncedLegacyEconomy } from '@/game/baseStorage';
import {
  STORY_FLAG_COMMAND_ESCALATION,
  STORY_FLAG_CONTROLLED_OBSERVATION,
  STORY_FLAG_EMERGENCY_WITHDRAWAL,
  strategicResponseFlagForState,
} from '@/game/commandPressure';
import { applyRobertsUpdate, type CommandStance } from '@/game/roberts';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';

export const ABYSSAL_EXPANSION_MODELS_SPINE_EVENT: SpineEventId = 'abyssal_expansion_models';

export const STORY_FLAG_MODEL_CURRENT_DRIFT = 'model_current_drift';
export const STORY_FLAG_MODEL_RESONANCE_FIELD = 'model_resonance_field';
export const STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION = 'model_biological_contamination';

export const MODEL_PRIORITY_FLAGS = [
  STORY_FLAG_MODEL_CURRENT_DRIFT,
  STORY_FLAG_MODEL_RESONANCE_FIELD,
  STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION,
] as const;

export type AbyssalExpansionModelChoice =
  | 'prioritize_current_drift'
  | 'prioritize_resonance_field'
  | 'prioritize_biological_contamination';

export const ABYSSAL_EXPANSION_MODEL_CHOICES: readonly AbyssalExpansionModelChoice[] = [
  'prioritize_current_drift',
  'prioritize_resonance_field',
  'prioritize_biological_contamination',
] as const;

export interface AbyssalExpansionModelOption {
  id: AbyssalExpansionModelChoice;
  label: string;
  summary: string;
}

export const ABYSSAL_EXPANSION_MODEL_OPTIONS: readonly AbyssalExpansionModelOption[] = [
  {
    id: 'prioritize_current_drift',
    label: 'Prioritize Current Drift Model',
    summary:
      'Treat the footprint as a moving current or pressure disturbance — geographic spread follows fluid dynamics, not fixed structure.',
  },
  {
    id: 'prioritize_resonance_field',
    label: 'Prioritize Resonance Field Model',
    summary:
      'Treat the phenomenon as a stationary field causing measurement drift and false-depth behavior — motion is instrumental, not physical.',
  },
  {
    id: 'prioritize_biological_contamination',
    label: 'Prioritize Biological Contamination Model',
    summary:
      'Task Research to test a restrained biological interpretation — particulate or microbial cascade in the water column. No organism is identified.',
  },
] as const;

/** Internal model summaries shown in the briefing memo. */
export const ABYSSAL_EXPANSION_MODEL_BRIEFS: readonly string[] = [
  'Current Drift Model — footprint migration correlates with density shear; bearings shift as if carried by a subsurface current. Does not explain checksum-stable authentication headers.',
  'Resonance Field Model — instruments report depth and bearing contradictions without corresponding hull motion; field hypothesis fits drift windows but fails mass-balance checks.',
  'Biological Contamination Model — micro-particulate anomalies in water samples show accelerated oxidation on shielding; biological cascade proposed without confirmed source organism.',
] as const;

/** Future in-world hint after P1.8 resolution. */
export const MODEL_DEPLOYMENT_THRESHOLD_COPY =
  'Model confidence remains below deployment threshold.';

const CHOICE_TO_FLAG: Record<AbyssalExpansionModelChoice, string> = {
  prioritize_current_drift: STORY_FLAG_MODEL_CURRENT_DRIFT,
  prioritize_resonance_field: STORY_FLAG_MODEL_RESONANCE_FIELD,
  prioritize_biological_contamination: STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION,
};

const REWARDS: Record<AbyssalExpansionModelChoice, { scrap: number; researchData: number }> = {
  prioritize_current_drift: { scrap: 0, researchData: 20 },
  prioritize_resonance_field: { scrap: 0, researchData: 25 },
  prioritize_biological_contamination: { scrap: 10, researchData: 10 },
};

type StrategicPosture =
  | typeof STORY_FLAG_COMMAND_ESCALATION
  | typeof STORY_FLAG_CONTROLLED_OBSERVATION
  | typeof STORY_FLAG_EMERGENCY_WITHDRAWAL;

const POSTURE_FLAVOR: Record<
  StrategicPosture,
  { briefingLine: string; scienceNote: string; engineeringNote: string; robertsLine: string }
> = {
  [STORY_FLAG_COMMAND_ESCALATION]: {
    briefingLine:
      'Command liaison has requested formal model packets for external review. DBX-07 clearance may not retain primary custody of the working models.',
    scienceNote:
      'Research Lead notes Command wants model language that survives bureaucratic audit — not language that survives peer review.',
    engineeringNote:
      'Chief Engineer requests any model that includes hull stress projections be filed with Engineering before external release.',
    robertsLine:
      'External review pressure is real. I prioritized a model we can defend in writing — not one that explains the ocean.',
  },
  [STORY_FLAG_CONTROLLED_OBSERVATION]: {
    briefingLine:
      'Under the controlled observation posture, Research retains primary analysis authority. Command receives summaries on a fixed cycle.',
    scienceNote:
      'Research Lead argues all three models fail cross-validation — prioritizing one is a resource allocation decision, not a truth claim.',
    engineeringNote:
      'Chief Engineer accepts the procedural balance but warns that model delay does not delay hull exposure if tasking resumes.',
    robertsLine:
      'Science needs room to work. Command needs a decision on record. I chose a model direction — not a conclusion.',
  },
  [STORY_FLAG_EMERGENCY_WITHDRAWAL]: {
    briefingLine:
      'Withdrawal protocols remain active. Engineering treats every model through survivability filters before Research correlation.',
    scienceNote:
      'Research Lead cautions that defensive posture narrows acceptable model classes — drift and field hypotheses fit; biological remains least tested.',
    engineeringNote:
      'Chief Engineer prioritizes any model that predicts increasing hull stress beyond Mk I tolerance. Vessel survivability is non-negotiable.',
    robertsLine:
      'The hull does not care which model Command prefers. I chose the analysis path that keeps DBX-07 alive long enough to learn more.',
  },
};

const MODEL_RESOLUTION: Record<
  AbyssalExpansionModelChoice,
  { headline: string; summary: string; stance: CommandStance }
> = {
  prioritize_current_drift: {
    headline: 'Current Drift Model prioritized for next analysis cycle',
    summary:
      'Research will weight geographic migration and density-shear correlation in the next modeling pass. Command accepts fluid-dynamics framing under restricted classification — not as explanation.',
    stance: 'cautious',
  },
  prioritize_resonance_field: {
    headline: 'Resonance Field Model prioritized for next analysis cycle',
    summary:
      'Sensor and Research teams will treat instrument contradiction as primary evidence in the next cycle. Command notes the model fits drift windows but remains unverified in the field.',
    stance: 'procedural',
  },
  prioritize_biological_contamination: {
    headline: 'Biological Contamination Model prioritized — restrained test protocol',
    summary:
      'Research authorized a restrained biological interpretation — particulate cascade and oxidation acceleration only. No organism classification. Command treats this as hypothesis, not finding.',
    stance: 'cautious',
  },
};

export function isAbyssalExpansionModelChoice(value: string): value is AbyssalExpansionModelChoice {
  return (ABYSSAL_EXPANSION_MODEL_CHOICES as readonly string[]).includes(value);
}

export function hasModelPriorityFlag(state: GameState): boolean {
  return MODEL_PRIORITY_FLAGS.some((flag) => hasStoryFlag(state, flag));
}

function hasCompletedAbyssalExpansionModels(state: GameState): boolean {
  return state.completedSpineEvents.includes(ABYSSAL_EXPANSION_MODELS_SPINE_EVENT);
}

/** True after P1.7, before P1.8 model priority is resolved. */
export function isAbyssalExpansionModelsPending(state: GameState): boolean {
  if (hasCompletedAbyssalExpansionModels(state)) return false;
  if (hasModelPriorityFlag(state)) return false;
  if (!state.completedSpineEvents.includes('command_pressure')) return false;
  return strategicResponseFlagForState(state) !== undefined;
}

export function canResolveAbyssalExpansionModels(state: GameState): boolean {
  return isAbyssalExpansionModelsPending(state);
}

export function strategicPostureFlavorForState(state: GameState): typeof POSTURE_FLAVOR[StrategicPosture] | null {
  const posture = strategicResponseFlagForState(state);
  if (!posture || !(posture in POSTURE_FLAVOR)) return null;
  return POSTURE_FLAVOR[posture as StrategicPosture];
}

function completeSpineEventIfValid(state: GameState, eventId: SpineEventId): GameState {
  if (!isValidSpineEventForEra(eventId, state.canonEra)) return state;
  if (state.completedSpineEvents.includes(eventId)) return state;
  return { ...state, completedSpineEvents: [...state.completedSpineEvents, eventId] };
}

function applyRewards(state: GameState, choice: AbyssalExpansionModelChoice): GameState {
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
 * Resolve P1.8 Abyssal Expansion Models — prioritize one internal model for the next analysis cycle.
 */
export function resolveAbyssalExpansionModels(
  state: GameState,
  choice: AbyssalExpansionModelChoice,
): GameState {
  if (!canResolveAbyssalExpansionModels(state)) return state;

  const posture = strategicResponseFlagForState(state);
  const flavor = posture ? POSTURE_FLAVOR[posture as StrategicPosture] : null;
  const copy = MODEL_RESOLUTION[choice];
  const flag = CHOICE_TO_FLAG[choice];
  let next = state;

  next = grantStoryFlag(next, flag);
  next = completeSpineEventIfValid(next, ABYSSAL_EXPANSION_MODELS_SPINE_EVENT);
  next = applyRewards(next, choice);

  next = {
    ...next,
    roberts: applyRobertsUpdate(next.roberts, {
      delta: { obsession: 1, stress: 1 },
      stance: copy.stance,
    }),
  };

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'high',
    title: copy.headline,
    summaryText: copy.summary,
    speakerId: 'research_lead',
  });

  if (flavor) {
    next = withStoryBeat(next, {
      type: 'internal_crew_event',
      importance: 'medium',
      title: 'Research Lead — model cycle note',
      summaryText: flavor.scienceNote,
      speakerId: 'research_lead',
    });
    next = withStoryBeat(next, {
      type: 'internal_crew_event',
      importance: 'medium',
      title: 'Chief Engineer — model cycle note',
      summaryText: flavor.engineeringNote,
      speakerId: 'chief_engineer',
    });
    next = withStoryBeat(next, {
      type: 'xo_command',
      importance: 'medium',
      title: 'Roberts — model priority logged',
      summaryText: flavor.robertsLine,
      speakerId: 'commander',
    });
  }

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'medium',
    title: 'Command disposition — deployment hold',
    summaryText: MODEL_DEPLOYMENT_THRESHOLD_COPY,
    speakerId: 'xo',
  });

  return next;
}

export function abyssalExpansionModelsActionCopy(state: GameState): string {
  if (hasCompletedAbyssalExpansionModels(state)) return 'Review model record';
  if (isAbyssalExpansionModelsPending(state)) return 'Open expansion models';
  return 'Locked';
}

export function abyssalExpansionModelsLockCopy(state: GameState): string {
  if (hasCompletedAbyssalExpansionModels(state)) {
    return 'Expansion model priority logged — deployment threshold not met.';
  }
  if (!state.completedSpineEvents.includes('command_pressure')) {
    return 'Command Pressure unresolved — strategic posture required first.';
  }
  if (!strategicResponseFlagForState(state)) {
    return 'Strategic response flag missing — complete Command Pressure first.';
  }
  return 'Complete prior story requirements to unlock.';
}

export function expansionModelDeploymentLockCopy(state: GameState): string {
  if (!hasCompletedAbyssalExpansionModels(state)) {
    return 'Expansion model analysis pending — prioritize a model first.';
  }
  return MODEL_DEPLOYMENT_THRESHOLD_COPY;
}
