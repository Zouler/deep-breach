import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import {
  MAX_ACTIVE_CRACKS_BY_RISK,
  canSpawnCrack,
  criticalRandomAllowed,
  hasUnresolvedHighStress,
  rollGapMs,
} from '@/game/pacing';
import type { Crack, DiveSession, Mission } from '@/types';

function baseDive(): { mission: Mission; dive: DiveSession } {
  const state = createInitialGameState();
  const mission = state.missions[0]!;
  const dive = createDiveSessionForMission(mission, state.submarine);
  return { mission, dive };
}

function crackAt(roomId: string, severity: Crack['severity'] = 'hairline'): Crack {
  return { id: `crack-${roomId}-${severity}-${Math.random()}`, roomId, severity, leakRatePerSecond: 0.05 };
}

describe('hasUnresolvedHighStress', () => {
  it('is false for a freshly started, undamaged dive', () => {
    const { dive } = baseDive();
    expect(hasUnresolvedHighStress(dive)).toBe(false);
  });

  it('is true once hull integrity drops below the threshold', () => {
    const { dive } = baseDive();
    expect(hasUnresolvedHighStress({ ...dive, hullIntegrityPercent: 20 })).toBe(true);
  });

  it('is true once a critical crack exists anywhere', () => {
    const { dive } = baseDive();
    const rooms = dive.rooms.map((r, i) =>
      i === 0 ? { ...r, cracks: [crackAt(r.id, 'critical')] } : r,
    );
    expect(hasUnresolvedHighStress({ ...dive, rooms })).toBe(true);
  });
});

describe('canSpawnCrack', () => {
  it('refuses to spawn once the per-risk active crack cap is reached', () => {
    const { mission, dive } = baseDive();
    const cap = MAX_ACTIVE_CRACKS_BY_RISK[mission.risk];
    const rooms = dive.rooms.map((r, i) =>
      i === 0 ? { ...r, cracks: Array.from({ length: cap }, () => crackAt(r.id)) } : r,
    );
    const saturated: DiveSession = { ...dive, rooms, lastCrackSpawnAt: 0, nextCrackGapMs: 0 };

    expect(canSpawnCrack(saturated, mission, dive.startedAt + 10_000_000)).toBe(false);
  });

  it('respects the cooldown gap when under the cap', () => {
    const { mission, dive } = baseDive();
    const notReady: DiveSession = { ...dive, lastCrackSpawnAt: dive.startedAt, nextCrackGapMs: 60_000 };

    expect(canSpawnCrack(notReady, mission, dive.startedAt + 1_000)).toBe(false);
    expect(canSpawnCrack(notReady, mission, dive.startedAt + 61_000)).toBe(true);
  });
});

describe('criticalRandomAllowed', () => {
  it('is gated off early in a dive (low depth/mission progress)', () => {
    const { dive } = baseDive();
    expect(criticalRandomAllowed(dive)).toBe(false);
  });

  it('opens up once depth and mission progress both clear their thresholds', () => {
    const { mission, dive } = baseDive();
    const deepDive: DiveSession = {
      ...dive,
      currentDepthM: mission.targetDepthM * 0.5,
      missionElapsedMs: dive.missionDurationMs * 0.5,
    };
    expect(criticalRandomAllowed(deepDive)).toBe(true);
  });

  it('stays closed while a critical crack is already unresolved', () => {
    const { mission, dive } = baseDive();
    const rooms = dive.rooms.map((r, i) =>
      i === 0 ? { ...r, cracks: [crackAt(r.id, 'critical')] } : r,
    );
    const deepDive: DiveSession = {
      ...dive,
      rooms,
      currentDepthM: mission.targetDepthM * 0.5,
      missionElapsedMs: dive.missionDurationMs * 0.5,
    };
    expect(criticalRandomAllowed(deepDive)).toBe(false);
  });
});

describe('rollGapMs', () => {
  it('always stays within the widened min/max envelope regardless of progress or randomness', () => {
    const range = { min: 20_000, max: 40_000 };
    for (let i = 0; i < 200; i++) {
      const depthFrac = Math.random();
      const missionFrac = Math.random();
      const gap = rollGapMs(range, depthFrac, missionFrac);
      expect(gap).toBeGreaterThanOrEqual(range.min * 0.85 - 1e-6);
      expect(gap).toBeLessThanOrEqual(range.max * 1.05 + 1e-6);
    }
  });
});
