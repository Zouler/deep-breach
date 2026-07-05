import { reduceGame } from '@/game/gameReducer';
import { createInitialGameState } from '@/game/initialGame';
import { SPECIALIZATION_UNLOCK_DIVES } from '@/game/crewSpecializations';
import type { GameState } from '@/types';

function stateWithReadyEngineer(): GameState {
  const state = createInitialGameState();
  return {
    ...state,
    crew: state.crew.map((c) =>
      c.role === 'engineer'
        ? { ...c, hired: true, assignedToDive: true, divesCompleted: SPECIALIZATION_UNLOCK_DIVES }
        : c,
    ),
  };
}

describe('CHOOSE_CREW_SPECIALIZATION reducer action', () => {
  it('sets the specialization when the choice is valid and unlocked', () => {
    const state = stateWithReadyEngineer();
    const engineerId = state.crew.find((c) => c.role === 'engineer')!.id;

    const next = reduceGame(state, {
      type: 'CHOOSE_CREW_SPECIALIZATION',
      crewId: engineerId,
      specializationId: 'engineer_rapid_repairs',
    });

    expect(next.crew.find((c) => c.id === engineerId)!.specializationId).toBe('engineer_rapid_repairs');
  });

  it('rejects a specialization that does not match the crew member role', () => {
    const state = stateWithReadyEngineer();
    const engineerId = state.crew.find((c) => c.role === 'engineer')!.id;

    const next = reduceGame(state, {
      type: 'CHOOSE_CREW_SPECIALIZATION',
      crewId: engineerId,
      specializationId: 'navigator_efficient_routes',
    });

    expect(next.crew.find((c) => c.id === engineerId)!.specializationId).toBeNull();
  });

  it('rejects the choice before the unlock threshold is reached', () => {
    const state = createInitialGameState();
    const engineerId = state.crew.find((c) => c.role === 'engineer')!.id;
    const notReady: GameState = {
      ...state,
      crew: state.crew.map((c) =>
        c.id === engineerId ? { ...c, hired: true, assignedToDive: true, divesCompleted: 0 } : c,
      ),
    };

    const next = reduceGame(notReady, {
      type: 'CHOOSE_CREW_SPECIALIZATION',
      crewId: engineerId,
      specializationId: 'engineer_rapid_repairs',
    });

    expect(next.crew.find((c) => c.id === engineerId)!.specializationId).toBeNull();
  });

  it('is a no-op once a specialization has already been chosen', () => {
    const state = stateWithReadyEngineer();
    const engineerId = state.crew.find((c) => c.role === 'engineer')!.id;
    const decided: GameState = {
      ...state,
      crew: state.crew.map((c) =>
        c.id === engineerId ? { ...c, specializationId: 'engineer_heat_discipline' } : c,
      ),
    };

    const next = reduceGame(decided, {
      type: 'CHOOSE_CREW_SPECIALIZATION',
      crewId: engineerId,
      specializationId: 'engineer_rapid_repairs',
    });

    expect(next.crew.find((c) => c.id === engineerId)!.specializationId).toBe('engineer_heat_discipline');
  });
});
