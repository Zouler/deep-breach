import {
  canVentEngineHeat,
  computeEngineHeatRisePercent,
  ENGINE_HEAT_VENT_COOLDOWN_MS,
} from '@/game/engineHeat';
import { createInitialGameState } from '@/game/initialGame';
import type { Mission } from '@/types';

function baseMission(): Mission {
  return createInitialGameState().missions[0]!;
}

describe('computeEngineHeatRisePercent', () => {
  it('rises over time and never for a non-positive delta', () => {
    const mission = baseMission();
    expect(computeEngineHeatRisePercent(0, { mission, crew: [] })).toBe(0);
    expect(computeEngineHeatRisePercent(-100, { mission, crew: [] })).toBe(0);
    expect(computeEngineHeatRisePercent(5_000, { mission, crew: [] })).toBeGreaterThan(0);
  });

  it('rises faster on higher-risk missions', () => {
    const state = createInitialGameState();
    const low = state.missions.find((m) => m.risk === 'low')!;
    const harder = state.missions.find((m) => m.risk !== 'low')!;
    const lowRise = computeEngineHeatRisePercent(5_000, { mission: low, crew: [] });
    const harderRise = computeEngineHeatRisePercent(5_000, { mission: harder, crew: [] });
    expect(harderRise).toBeGreaterThan(lowRise);
  });

  it('is mitigated by an assigned engineer', () => {
    const mission = baseMission();
    const state = createInitialGameState();
    const engineer = state.crew.find((c) => c.role === 'engineer')!;
    const withEngineer = [{ ...engineer, hired: true, assignedToDive: true }];

    const withoutEngineerRise = computeEngineHeatRisePercent(5_000, { mission, crew: [] });
    const withEngineerRise = computeEngineHeatRisePercent(5_000, { mission, crew: withEngineer });
    expect(withEngineerRise).toBeLessThan(withoutEngineerRise);
  });
});

describe('canVentEngineHeat', () => {
  it('respects the cooldown window', () => {
    const lastVentAt = 1_000;
    expect(canVentEngineHeat(lastVentAt, lastVentAt + 1_000)).toBe(false);
    expect(canVentEngineHeat(lastVentAt, lastVentAt + ENGINE_HEAT_VENT_COOLDOWN_MS)).toBe(true);
    expect(canVentEngineHeat(lastVentAt, lastVentAt + ENGINE_HEAT_VENT_COOLDOWN_MS + 1)).toBe(true);
  });
});
