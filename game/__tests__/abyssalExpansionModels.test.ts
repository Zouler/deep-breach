import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  advanceQaToAbyssalExpansionModelsReady,
  advanceQaToCommandPressureReady,
} from '@/game/qaProgression';
import {
  canResolveAbyssalExpansionModels,
  isAbyssalExpansionModelsPending,
  MODEL_PRIORITY_FLAGS,
  resolveAbyssalExpansionModels,
  STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION,
  STORY_FLAG_MODEL_CURRENT_DRIFT,
  STORY_FLAG_MODEL_RESONANCE_FIELD,
  strategicPostureFlavorForState,
} from '@/game/abyssalExpansionModels';
import {
  resolveCommandPressure,
  STORY_FLAG_COMMAND_ESCALATION,
  STORY_FLAG_CONTROLLED_OBSERVATION,
  STORY_FLAG_EMERGENCY_WITHDRAWAL,
} from '@/game/commandPressure';
import {
  hasCompletedSpineEvent,
  isMissionUnlocked,
  isStoryMissionCompleted,
} from '@/game/storyMissions';
import type { GameState } from '@/types';

function withCommandPressureResolved(
  state: GameState,
  choice: 'report_up_chain' | 'controlled_observation' | 'emergency_withdrawal',
): GameState {
  return resolveCommandPressure(advanceQaToCommandPressureReady(state), choice);
}

describe('abyssalExpansionModels P1.8', () => {
  it('is unavailable before command_pressure', () => {
    const state = advanceQaToCommandPressureReady(createInitialGameState());
    expect(isAbyssalExpansionModelsPending(state)).toBe(false);
    expect(canResolveAbyssalExpansionModels(state)).toBe(false);
    expect(isMissionUnlocked(state, 'abyssal_expansion_models')).toBe(false);
  });

  it('becomes pending after command_pressure with strategic flag', () => {
    const state = withCommandPressureResolved(createInitialGameState(), 'controlled_observation');
    expect(hasCompletedSpineEvent(state, 'command_pressure')).toBe(true);
    expect(isAbyssalExpansionModelsPending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'abyssal_expansion_models')).toBe(true);
  });

  it.each([
    ['report_up_chain', STORY_FLAG_COMMAND_ESCALATION] as const,
    ['controlled_observation', STORY_FLAG_CONTROLLED_OBSERVATION] as const,
    ['emergency_withdrawal', STORY_FLAG_EMERGENCY_WITHDRAWAL] as const,
  ])('accepts P1.7 posture %s as prerequisite', (pressureChoice, flag) => {
    const state = withCommandPressureResolved(createInitialGameState(), pressureChoice);
    expect(state.storyFlags).toContain(flag);
    expect(isAbyssalExpansionModelsPending(state)).toBe(true);
  });

  it('selecting one model prevents selecting another', () => {
    let state = withCommandPressureResolved(createInitialGameState(), 'controlled_observation');
    state = resolveAbyssalExpansionModels(state, 'prioritize_resonance_field');
    const afterFirst = state;
    state = resolveAbyssalExpansionModels(state, 'prioritize_current_drift');
    expect(state).toBe(afterFirst);
    expect(state.storyFlags).not.toContain(STORY_FLAG_MODEL_CURRENT_DRIFT);
  });

  it.each([
    ['prioritize_current_drift', STORY_FLAG_MODEL_CURRENT_DRIFT, 0, 20] as const,
    ['prioritize_resonance_field', STORY_FLAG_MODEL_RESONANCE_FIELD, 0, 25] as const,
    ['prioritize_biological_contamination', STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION, 10, 10] as const,
  ])('choice %s grants correct flag and rewards', (choice, flag, scrap, research) => {
    let state = withCommandPressureResolved(createInitialGameState(), 'report_up_chain');
    const scrapBefore = state.resources.scrap;
    const researchBefore = state.resources.researchData;
    state = resolveAbyssalExpansionModels(state, choice);
    expect(state.storyFlags).toContain(flag);
    expect(
      state.storyFlags.filter((f) => (MODEL_PRIORITY_FLAGS as readonly string[]).includes(f)),
    ).toHaveLength(1);
    expect(state.resources.scrap).toBe(scrapBefore + scrap);
    expect(state.resources.researchData).toBe(researchBefore + research);
    expect(hasCompletedSpineEvent(state, 'abyssal_expansion_models')).toBe(true);
    expect(isStoryMissionCompleted(state, 'abyssal_expansion_models')).toBe(true);
  });

  it('records abyssal_expansion_models spine once without unrelated model flags', () => {
    let state = withCommandPressureResolved(createInitialGameState(), 'emergency_withdrawal');
    state = resolveAbyssalExpansionModels(state, 'prioritize_current_drift');
    expect(state.completedSpineEvents.filter((e) => e === 'abyssal_expansion_models')).toHaveLength(1);
    expect(state.storyFlags).toContain(STORY_FLAG_MODEL_CURRENT_DRIFT);
    expect(state.storyFlags).not.toContain(STORY_FLAG_MODEL_RESONANCE_FIELD);
    expect(state.storyFlags).not.toContain(STORY_FLAG_MODEL_BIOLOGICAL_CONTAMINATION);
    expect(state.completedSpineEvents).not.toContain('military_escalation');
  });

  it('provides strategic posture flavor for each P1.7 flag', () => {
    for (const choice of ['report_up_chain', 'controlled_observation', 'emergency_withdrawal'] as const) {
      const state = withCommandPressureResolved(createInitialGameState(), choice);
      expect(strategicPostureFlavorForState(state)).not.toBeNull();
    }
  });

  it('reducer action resolves expansion models', () => {
    let state = withCommandPressureResolved(createInitialGameState(), 'controlled_observation');
    state = reduceGame(state, {
      type: 'RESOLVE_ABYSSAL_EXPANSION_MODELS',
      choice: 'prioritize_resonance_field',
    });
    expect(state.storyFlags).toContain(STORY_FLAG_MODEL_RESONANCE_FIELD);
    expect(isAbyssalExpansionModelsPending(state)).toBe(false);
  });

  it('unlocks deployment hold placeholder after P1.8', () => {
    let state = withCommandPressureResolved(createInitialGameState(), 'controlled_observation');
    expect(isMissionUnlocked(state, 'expansion_model_deployment_hold')).toBe(false);
    state = resolveAbyssalExpansionModels(state, 'prioritize_current_drift');
    expect(isMissionUnlocked(state, 'expansion_model_deployment_hold')).toBe(true);
  });
});

describe('qaProgression expansion models', () => {
  it('advanceQaToAbyssalExpansionModelsReady leaves model choice pending', () => {
    const state = advanceQaToAbyssalExpansionModelsReady(createInitialGameState());
    expect(isAbyssalExpansionModelsPending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'abyssal_expansion_models')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'command_pressure')).toBe(true);
  });

  it('QA reducer advances to expansion models ready', () => {
    const state = reduceGame(createInitialGameState(), { type: 'QA_FAST_FORWARD_TO_EXPANSION_MODELS' });
    expect(isAbyssalExpansionModelsPending(state)).toBe(true);
  });
});
