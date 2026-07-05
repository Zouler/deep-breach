import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  applyRobertsDelta,
  clampRobertsDelta,
  clampRobertsValue,
  createDefaultRobertsState,
  DEFAULT_ROBERTS_STATE,
  getDominantCommandStance,
  incrementStanceHistory,
  normalizeRobertsState,
} from '@/game/roberts';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';

describe('roberts helpers', () => {
  it('clamps values to 0–100', () => {
    expect(clampRobertsValue(-10)).toBe(0);
    expect(clampRobertsValue(150)).toBe(100);
    expect(clampRobertsValue(50)).toBe(50);
    expect(clampRobertsValue(Number.NaN)).toBe(0);
  });

  it('clamps individual deltas to +/-5', () => {
    expect(clampRobertsDelta(-20)).toBe(-5);
    expect(clampRobertsDelta(500)).toBe(5);
    expect(clampRobertsDelta(3)).toBe(3);
    expect(clampRobertsDelta(Number.NaN)).toBe(0);
  });

  it('applyRobertsDelta clamps final values', () => {
    const base = createDefaultRobertsState();
    const next = applyRobertsDelta(base, { stress: 200, crewTrust: -100 });
    expect(next.stress).toBe(5);
    expect(next.crewTrust).toBe(45);
  });

  it('incrementStanceHistory increments selected stance only', () => {
    const base = createDefaultRobertsState();
    const next = incrementStanceHistory(base, 'cautious');
    expect(next.stanceHistory.cautious).toBe(1);
    expect(next.stanceHistory.procedural).toBe(0);
  });

  it('getDominantCommandStance uses tie priority and procedural default', () => {
    expect(getDominantCommandStance(createDefaultRobertsState())).toBe('procedural');

    let state = incrementStanceHistory(createDefaultRobertsState(), 'aggressive');
    state = incrementStanceHistory(state, 'cautious');
    expect(getDominantCommandStance(state)).toBe('cautious');

    state = incrementStanceHistory(state, 'aggressive');
    expect(getDominantCommandStance(state)).toBe('aggressive');

    state = incrementStanceHistory(state, 'procedural');
    state = incrementStanceHistory(state, 'procedural');
    expect(getDominantCommandStance(state)).toBe('procedural');
  });

  it('normalizeRobertsState fills partial and invalid input', () => {
    expect(normalizeRobertsState(undefined)).toEqual(createDefaultRobertsState());
    expect(
      normalizeRobertsState({
        commandReputation: 80,
        crewTrust: 30,
        stanceHistory: { cautious: 2 },
      }),
    ).toEqual({
      commandReputation: 80,
      crewTrust: 30,
      familyStrain: 0,
      stress: 0,
      obsession: 0,
      stanceHistory: {
        cautious: 2,
        aggressive: 0,
        compassionate: 0,
        procedural: 0,
        obsessive: 0,
      },
    });
  });
});

describe('roberts game integration', () => {
  it('initializes new game with default RobertsState', () => {
    const state = createInitialGameState();
    expect(state.roberts).toEqual(createDefaultRobertsState());
    expect(state.roberts.commandReputation).toBe(DEFAULT_ROBERTS_STATE.commandReputation);
    expect(state.roberts.crewTrust).toBe(DEFAULT_ROBERTS_STATE.crewTrust);
  });

  it('APPLY_ROBERTS_DELTA clamps values and deltas', () => {
    let state = createInitialGameState();
    state = reduceGame(state, {
      type: 'APPLY_ROBERTS_DELTA',
      delta: { stress: 500, commandReputation: -500 },
      reason: 'test',
    });
    expect(state.roberts.stress).toBe(5);
    expect(state.roberts.commandReputation).toBe(45);
  });

  it('APPLY_ROBERTS_DELTA increments stance history', () => {
    const state = reduceGame(createInitialGameState(), {
      type: 'APPLY_ROBERTS_DELTA',
      stance: 'compassionate',
    });
    expect(state.roberts.stanceHistory.compassionate).toBe(1);
  });

  it('APPLY_ROBERTS_DELTA ignores invalid stance', () => {
    const prev = createInitialGameState();
    const next = reduceGame(prev, {
      type: 'APPLY_ROBERTS_DELTA',
      // @ts-expect-error intentional invalid stance for runtime guard
      stance: 'reckless',
    });
    expect(next.roberts).toEqual(prev.roberts);
  });
});

describe('roberts save migration', () => {
  function legacyV2WithoutRoberts(): Record<string, unknown> {
    const state = createInitialGameState() as unknown as Record<string, unknown>;
    const { roberts, version, ...rest } = state;
    return { ...rest, version: 2 };
  }

  it('migrates v2 saves to v3 with RobertsState defaults', () => {
    const migrated = migrateGameState(legacyV2WithoutRoberts());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.roberts).toEqual(createDefaultRobertsState());
  });

  it('migrates partial RobertsState safely', () => {
    const migrated = migrateGameState({
      ...legacyV2WithoutRoberts(),
      roberts: { commandReputation: 72, stanceHistory: { obsessive: 3 } },
    });
    expect(migrated!.roberts.commandReputation).toBe(72);
    expect(migrated!.roberts.crewTrust).toBe(50);
    expect(migrated!.roberts.stanceHistory.obsessive).toBe(3);
    expect(migrated!.roberts.stanceHistory.procedural).toBe(0);
  });
});
