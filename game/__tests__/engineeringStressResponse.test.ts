import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  resolveAbyssalExpansionModels,
  STORY_FLAG_MODEL_CURRENT_DRIFT,
  STORY_FLAG_MODEL_RESONANCE_FIELD,
} from '@/game/abyssalExpansionModels';
import {
  advanceQaToEngineeringStressResponseReady,
  advanceQaToAbyssalExpansionModelsReady,
} from '@/game/qaProgression';
import {
  canResolveEngineeringStressResponse,
  ENGINEERING_STRESS_RESPONSE_FLAGS,
  isEngineeringStressResponsePending,
  modelPriorityFlavorForState,
  resolveEngineeringStressResponse,
  STORY_FLAG_ENGINEERING_HULL_TOLERANCE,
  STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES,
  STORY_FLAG_ENGINEERING_SENSOR_STACK,
} from '@/game/engineeringStressResponse';
import {
  hasCompletedSpineEvent,
  isMissionUnlocked,
  isStoryMissionCompleted,
} from '@/game/storyMissions';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';
import type { GameState } from '@/types';

function withExpansionModelsResolved(
  state: GameState,
  choice: 'prioritize_current_drift' | 'prioritize_resonance_field' = 'prioritize_current_drift',
): GameState {
  return resolveAbyssalExpansionModels(advanceQaToAbyssalExpansionModelsReady(state), choice);
}

describe('engineeringStressResponse P1.9', () => {
  it('is unavailable before abyssal_expansion_models', () => {
    const state = advanceQaToAbyssalExpansionModelsReady(createInitialGameState());
    expect(isEngineeringStressResponsePending(state)).toBe(false);
    expect(canResolveEngineeringStressResponse(state)).toBe(false);
    expect(isMissionUnlocked(state, 'engineering_stress_response')).toBe(false);
  });

  it('becomes pending after abyssal_expansion_models with model flag', () => {
    const state = withExpansionModelsResolved(createInitialGameState());
    expect(hasCompletedSpineEvent(state, 'abyssal_expansion_models')).toBe(true);
    expect(isEngineeringStressResponsePending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'engineering_stress_response')).toBe(true);
  });

  it.each([
    ['prioritize_current_drift', STORY_FLAG_MODEL_CURRENT_DRIFT] as const,
    ['prioritize_resonance_field', STORY_FLAG_MODEL_RESONANCE_FIELD] as const,
  ])('accepts P1.8 model %s as prerequisite', (modelChoice, flag) => {
    const state = withExpansionModelsResolved(createInitialGameState(), modelChoice);
    expect(state.storyFlags).toContain(flag);
    expect(isEngineeringStressResponsePending(state)).toBe(true);
  });

  it('selecting one engineering posture prevents selecting another', () => {
    let state = withExpansionModelsResolved(createInitialGameState());
    state = resolveEngineeringStressResponse(state, 'shield_sensor_stack');
    const afterFirst = state;
    state = resolveEngineeringStressResponse(state, 'reinforce_hull_tolerance');
    expect(state).toBe(afterFirst);
    expect(state.storyFlags).not.toContain(STORY_FLAG_ENGINEERING_HULL_TOLERANCE);
  });

  it.each([
    ['reinforce_hull_tolerance', STORY_FLAG_ENGINEERING_HULL_TOLERANCE, 15, 0] as const,
    ['shield_sensor_stack', STORY_FLAG_ENGINEERING_SENSOR_STACK, 0, 15] as const,
    ['preserve_repair_supplies', STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES, 10, 10] as const,
  ])('choice %s grants correct flag and rewards', (choice, flag, scrap, research) => {
    let state = withExpansionModelsResolved(createInitialGameState());
    const scrapBefore = state.resources.scrap;
    const researchBefore = state.resources.researchData;
    state = resolveEngineeringStressResponse(state, choice);
    expect(state.storyFlags).toContain(flag);
    expect(
      state.storyFlags.filter((f) => (ENGINEERING_STRESS_RESPONSE_FLAGS as readonly string[]).includes(f)),
    ).toHaveLength(1);
    expect(state.resources.scrap).toBe(scrapBefore + scrap);
    expect(state.resources.researchData).toBe(researchBefore + research);
    expect(hasCompletedSpineEvent(state, 'engineering_stress_response')).toBe(true);
    expect(isStoryMissionCompleted(state, 'engineering_stress_response')).toBe(true);
  });

  it('records engineering_stress_response spine once', () => {
    let state = withExpansionModelsResolved(createInitialGameState());
    state = resolveEngineeringStressResponse(state, 'preserve_repair_supplies');
    expect(state.completedSpineEvents.filter((e) => e === 'engineering_stress_response')).toHaveLength(1);
    expect(state.completedSpineEvents).not.toContain('military_escalation');
  });

  it('provides model priority flavor after P1.8 resolution', () => {
    const state = withExpansionModelsResolved(createInitialGameState());
    expect(modelPriorityFlavorForState(state)).not.toBeNull();
  });

  it('reducer action resolves engineering stress response', () => {
    let state = withExpansionModelsResolved(createInitialGameState());
    state = reduceGame(state, {
      type: 'RESOLVE_ENGINEERING_STRESS_RESPONSE',
      choice: 'reinforce_hull_tolerance',
    });
    expect(state.storyFlags).toContain(STORY_FLAG_ENGINEERING_HULL_TOLERANCE);
    expect(isEngineeringStressResponsePending(state)).toBe(false);
  });

  it('unlocks descent authorization hold after P1.9', () => {
    let state = withExpansionModelsResolved(createInitialGameState());
    expect(isMissionUnlocked(state, 'descent_authorization_hold')).toBe(false);
    state = resolveEngineeringStressResponse(state, 'reinforce_hull_tolerance');
    expect(isMissionUnlocked(state, 'descent_authorization_hold')).toBe(true);
  });

  it('save v6 migration preserves P1.9 flags', () => {
    let state = withExpansionModelsResolved(createInitialGameState());
    state = resolveEngineeringStressResponse(state, 'shield_sensor_stack');
    const migrated = migrateGameState({ ...state, version: 5 } as unknown as GameState);
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.completedSpineEvents).toContain('engineering_stress_response');
    expect(migrated!.storyFlags).toContain(STORY_FLAG_ENGINEERING_SENSOR_STACK);
  });
});

describe('qaProgression engineering stress', () => {
  it('advanceQaToEngineeringStressResponseReady leaves posture choice pending', () => {
    const state = advanceQaToEngineeringStressResponseReady(createInitialGameState());
    expect(isEngineeringStressResponsePending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'engineering_stress_response')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'abyssal_expansion_models')).toBe(true);
    expect(state.storyFlags).toContain(STORY_FLAG_MODEL_CURRENT_DRIFT);
  });

  it('QA reducer advances to engineering stress ready', () => {
    const state = reduceGame(createInitialGameState(), { type: 'QA_FAST_FORWARD_TO_ENGINEERING_STRESS' });
    expect(isEngineeringStressResponsePending(state)).toBe(true);
  });
});
