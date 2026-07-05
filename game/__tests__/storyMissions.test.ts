import { REVEAL_LEVEL } from '@/game/canon';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import { upsertTrialProgress } from '@/game/trialProgression';
import {
  areAllExperimentalTrialsComplete,
  getAvailableMissions,
  getLockedMissions,
  getMissionDefinition,
  getNextStoryMission,
  hasCompletedSpineEvent,
  isMissionUnlocked,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { EXPERIMENTAL_TRIAL_MISSION_IDS } from '@/data/experimentalTrials';
import type { GameState } from '@/types';

function completeAllTrials(state: GameState): GameState {
  let next = state;
  for (const trialId of EXPERIMENTAL_TRIAL_MISSION_IDS) {
    next = upsertTrialProgress(next, {
      trialId,
      status: 'completed',
      attempts: 1,
      completedAt: Date.now(),
    });
  }
  return markExperimentalTrialsCompleteIfNeeded(next);
}

function withOperationalIntegrationComplete(state: GameState): GameState {
  return reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
}

describe('storyMissions vertical slice', () => {
  it('Dead Beacon is not available at new game', () => {
    const state = createInitialGameState();
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);
    expect(getAvailableMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(false);
    expect(getLockedMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(true);
  });

  it('trials complete unlocks Operational Integration', () => {
    const state = completeAllTrials(createInitialGameState());
    expect(areAllExperimentalTrialsComplete(state)).toBe(true);
    expect(hasCompletedSpineEvent(state, 'trials_completed')).toBe(true);
    expect(isMissionUnlocked(state, 'operational_integration')).toBe(true);
    expect(getNextStoryMission(state)?.id).toBe('operational_integration');
  });

  it('Operational Integration complete unlocks Dead Beacon', () => {
    let state = completeAllTrials(createInitialGameState());
    state = withOperationalIntegrationComplete(state);
    expect(hasCompletedSpineEvent(state, 'roberts_operationally_integrated')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'dbx03_signal_received')).toBe(true);
    expect(state.canonEra).toBe('dead_beacon');
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(true);
    expect(getAvailableMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(true);
  });

  it('Dead Beacon has DBX-03 signal, recon objective, and no recovery unlock gate', () => {
    const def = getMissionDefinition('operation_dead_beacon')!;
    const briefingText = [...def.briefing.body, ...def.briefing.leadLines.map((l) => l.text)].join(' ');
    expect(briefingText).toMatch(/DBX-03/i);
    expect(def.objectives.some((o) => /recon/i.test(o))).toBe(true);
    expect(def.restrictions.every((r) => !/recovery required/i.test(r))).toBe(true);
    expect(def.unlockConditions.requiredSpineEvents).not.toContain('hull_reinforcement_mk1');
    expect(def.unlockConditions.requiredFlags ?? []).not.toContain('hull_reinforcement_mk1');
  });

  it('unlock helpers respect era and reveal gates', () => {
    let state = completeAllTrials(createInitialGameState());
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);

    state = withOperationalIntegrationComplete(state);
    expect(state.revealLevel).toBeGreaterThanOrEqual(REVEAL_LEVEL.IMPOSSIBLE_SIGNAL);
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(true);

    state = {
      ...state,
      revealLevel: REVEAL_LEVEL.NONE,
    };
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);
  });

  it('return mission stays locked before hull reinforcement', () => {
    let state = completeAllTrials(createInitialGameState());
    state = withOperationalIntegrationComplete(state);
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operation_dead_beacon' });
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(false);
    const placeholder = getMissionDefinition('operation_dead_beacon_return')!;
    expect(placeholder.isPlaceholder).toBe(true);
  });

  it('canon era cannot skip to war or collapse from story helpers', () => {
    const state = createInitialGameState();
    const warSkip = reduceGame(state, { type: 'ADVANCE_CANON_ERA', nextEra: 'war' });
    expect(warSkip.canonEra).toBe('experimental_trials');
    const collapseSkip = reduceGame(state, { type: 'ADVANCE_CANON_ERA', nextEra: 'collapse' });
    expect(collapseSkip.canonEra).toBe('experimental_trials');
  });
});
