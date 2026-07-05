import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import { tickActiveDive } from '@/game/diveTick';
import type { DiveSession, GameState, Mission, Submarine } from '@/types';

function setup(): { state: GameState; mission: Mission; submarine: Submarine; dive: DiveSession } {
  const state = createInitialGameState();
  const mission = state.missions[0]!;
  const dive = createDiveSessionForMission(mission, state.submarine);
  return { state, mission, submarine: state.submarine, dive };
}

describe('tickActiveDive', () => {
  it('drains oxygen and advances depth over one tick, staying active', () => {
    const { state, mission, submarine, dive } = setup();

    const next = tickActiveDive({
      dive,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    expect(next.oxygenPercent).toBeLessThan(dive.oxygenPercent);
    expect(next.currentDepthM).toBeGreaterThan(dive.currentDepthM);
    expect(next.missionElapsedMs).toBe(dive.missionElapsedMs + 5_000);
    expect(next.status).toBe('active');
  });

  it('is a no-op when the dive is not active', () => {
    const { state, mission, submarine, dive } = setup();
    const terminalDive: DiveSession = { ...dive, status: 'failed' };

    const next = tickActiveDive({
      dive: terminalDive,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    expect(next).toBe(terminalDive);
  });

  it('succeeds once the mission timer reaches its duration with hull intact', () => {
    const { state, mission, submarine, dive } = setup();
    const almostDone: DiveSession = {
      ...dive,
      missionElapsedMs: dive.missionDurationMs - 10,
      hullIntegrityPercent: 100,
    };

    const next = tickActiveDive({
      dive: almostDone,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 520,
      now: dive.startedAt + dive.missionDurationMs,
    });

    expect(next.missionElapsedMs).toBe(dive.missionDurationMs);
    expect(next.status).toBe('success');
  });

  it('fails once hull integrity is driven to zero', () => {
    const { state, mission, submarine, dive } = setup();
    const criticalDive: DiveSession = {
      ...dive,
      hullIntegrityPercent: 0.5,
      waterLevelPercent: 50,
    };

    const next = tickActiveDive({
      dive: criticalDive,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 520,
      now: dive.startedAt + 520,
    });

    expect(next.hullIntegrityPercent).toBe(0);
    expect(next.status).toBe('failed');
  });
});
