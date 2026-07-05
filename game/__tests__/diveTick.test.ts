import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import { tickActiveDive } from '@/game/diveTick';
import type { DiveSession, GameState, Mission, Submarine } from '@/types';

function setup(): { state: GameState; mission: Mission; submarine: Submarine; dive: DiveSession } {
  const state = createInitialGameState();
  const mission = state.missions[0]!;
  const dive = createDiveSessionForMission(mission, state.submarine, 0, state);
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

  it('warns once via crew message when a moderate crack nears its escalation deadline', () => {
    const { state, mission, submarine, dive } = setup();
    const spawnedAt = dive.startedAt;
    const escalatesAt = spawnedAt + 10_000;
    const room = dive.rooms[0]!;
    const crack = {
      id: 'crack-test-1',
      roomId: room.id,
      severity: 'moderate' as const,
      leakRatePerSecond: 0.1,
      spawnedAt,
      escalatesAt,
    };
    const withCrack: DiveSession = {
      ...dive,
      rooms: dive.rooms.map((r) => (r.id === room.id ? { ...r, cracks: [crack] } : r)),
    };

    // 70% through the 10s window — past the 60% warning threshold, not yet escalated.
    const next = tickActiveDive({
      dive: withCrack,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 1,
      now: spawnedAt + 7_000,
    });

    const nextCrack = next.rooms.find((r) => r.id === room.id)!.cracks[0]!;
    expect(nextCrack.severity).toBe('moderate');
    expect(nextCrack.escalationWarned).toBe(true);
    expect(next.crewMessages.some((m) => m.text.includes('worsening'))).toBe(true);
  });

  it('escalates an unaddressed moderate crack to critical once its deadline passes', () => {
    const { state, mission, submarine, dive } = setup();
    const spawnedAt = dive.startedAt;
    const escalatesAt = spawnedAt + 10_000;
    const room = dive.rooms[0]!;
    const crack = {
      id: 'crack-test-2',
      roomId: room.id,
      severity: 'moderate' as const,
      leakRatePerSecond: 0.1,
      spawnedAt,
      escalatesAt,
      escalationWarned: true,
    };
    const withCrack: DiveSession = {
      ...dive,
      rooms: dive.rooms.map((r) => (r.id === room.id ? { ...r, cracks: [crack] } : r)),
    };

    const next = tickActiveDive({
      dive: withCrack,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 1,
      now: escalatesAt + 1,
    });

    const nextCrack = next.rooms.find((r) => r.id === room.id)!.cracks[0]!;
    expect(nextCrack.severity).toBe('critical');
    expect(nextCrack.escalatesAt).toBeNull();
    expect(nextCrack.leakRatePerSecond).toBeGreaterThanOrEqual(0.22);
    // Room status should self-correct via syncRoomStatuses once a critical crack exists.
    expect(next.rooms.find((r) => r.id === room.id)!.status).toBe('flooding');
  });

  it('does not escalate hairline or already-critical cracks', () => {
    const { state, mission, submarine, dive } = setup();
    const spawnedAt = dive.startedAt;
    const room = dive.rooms[0]!;
    const hairline = {
      id: 'crack-hairline',
      roomId: room.id,
      severity: 'hairline' as const,
      leakRatePerSecond: 0.04,
      spawnedAt,
      escalatesAt: null,
    };
    const withCrack: DiveSession = {
      ...dive,
      rooms: dive.rooms.map((r) => (r.id === room.id ? { ...r, cracks: [hairline] } : r)),
    };

    const next = tickActiveDive({
      dive: withCrack,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 1,
      now: spawnedAt + 1_000_000,
    });

    expect(next.rooms.find((r) => r.id === room.id)!.cracks[0]!.severity).toBe('hairline');
  });

  it('raises engine heat over time', () => {
    const { state, mission, submarine, dive } = setup();

    const next = tickActiveDive({
      dive,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    expect(next.engineHeatPercent).toBeGreaterThan(dive.engineHeatPercent);
  });

  it('warns once via crew message when engine heat crosses the warning threshold', () => {
    const { state, mission, submarine, dive } = setup();
    const hot: DiveSession = { ...dive, engineHeatPercent: 59.9, engineHeatWarned: false };

    const next = tickActiveDive({
      dive: hot,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    expect(next.engineHeatPercent).toBeGreaterThanOrEqual(60);
    expect(next.engineHeatWarned).toBe(true);
    expect(next.crewMessages.some((m) => m.text.includes('Engine Bay temperature'))).toBe(true);
  });

  it('does not re-warn on every tick once already warned', () => {
    const { state, mission, submarine, dive } = setup();
    const hot: DiveSession = { ...dive, engineHeatPercent: 65, engineHeatWarned: true };

    const next = tickActiveDive({
      dive: hot,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 1_000,
      now: dive.startedAt + 1_000,
    });

    expect(next.crewMessages.some((m) => m.text.includes('Engine Bay temperature'))).toBe(false);
  });

  it('applies extra hull and oxygen stress once heat reaches critical', () => {
    const { state, mission, submarine, dive } = setup();
    const critical: DiveSession = { ...dive, engineHeatPercent: 90, waterLevelPercent: 0 };
    const notCritical: DiveSession = { ...dive, engineHeatPercent: 10, waterLevelPercent: 0 };

    const nextCritical = tickActiveDive({
      dive: critical,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });
    const nextNotCritical = tickActiveDive({
      dive: notCritical,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    const criticalHullDrop = critical.hullIntegrityPercent - nextCritical.hullIntegrityPercent;
    const normalHullDrop = notCritical.hullIntegrityPercent - nextNotCritical.hullIntegrityPercent;
    expect(criticalHullDrop).toBeGreaterThan(normalHullDrop);
  });

  it('drains oxygen faster under the Cold Trench modifier than under standard conditions', () => {
    const { state, mission, submarine, dive } = setup();
    const standard: DiveSession = { ...dive, activeModifierId: null };
    const coldTrench: DiveSession = { ...dive, activeModifierId: 'cold_trench' };

    const nextStandard = tickActiveDive({
      dive: standard,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });
    const nextColdTrench = tickActiveDive({
      dive: coldTrench,
      mission,
      submarine,
      crew: state.crew,
      deltaMs: 5_000,
      now: dive.startedAt + 5_000,
    });

    const standardDrain = standard.oxygenPercent - nextStandard.oxygenPercent;
    const coldTrenchDrain = coldTrench.oxygenPercent - nextColdTrench.oxygenPercent;
    expect(coldTrenchDrain).toBeGreaterThan(standardDrain);
  });
});
