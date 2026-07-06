import { GROWING_OCEAN_ANOMALY_MISSION_ID } from '@/data/missions';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  applyGrowingOceanMonitoringTick,
  evaluateGrowingOceanMonitoringObjectives,
  MONITORING_DRIFT_DEPTH_FRACTION,
  MONITORING_ZONE_DEPTH_FRACTION,
  recordGrowingOceanMonitoringScan,
  isGrowingOceanMissionUnlocked,
} from '@/game/growingOceanAnomaly';
import { advanceQaToMonitoringReady } from '@/game/qaProgression';
import {
  applyStoryDiveResolution,
  canStartStoryDiveMission,
  hasCompletedSpineEvent,
  isMissionUnlocked,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import type { DiveSession, GameState } from '@/types';

function monitoringDive(overrides: Partial<DiveSession> = {}): DiveSession {
  let state = advanceQaToMonitoringReady(createInitialGameState());
  state = reduceGame(state, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
  return { ...state.dive!, ...overrides };
}

function withMonitoringReady(state: GameState): GameState {
  return advanceQaToMonitoringReady(state);
}

function completeMonitoringViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
  const mission = next.missions.find((m) => m.id === GROWING_OCEAN_ANOMALY_MISSION_ID)!;
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 2_000 });
  const successfulDive = {
    ...next.dive!,
    currentDepthM: next.dive!.targetDepthM * MONITORING_DRIFT_DEPTH_FRACTION,
    missionElapsedMs: next.dive!.missionDurationMs,
    monitoringDriftActive: true,
    monitoringBaselineScans: 1,
    monitoringDriftScans: 1,
    status: 'success' as const,
    hullIntegrityPercent: 75,
  };
  const lastMissionOutcome = buildMissionOutcome(
    { ...successfulDive, outcomeRecorded: true },
    mission,
    next.submarine,
    null,
  );
  return applyStoryDiveResolution(
    { ...next, dive: { ...successfulDive, outcomeRecorded: true }, lastMissionOutcome },
    mission,
    successfulDive,
  );
}

describe('growingOceanAnomaly', () => {
  it('is unavailable from new game', () => {
    const state = createInitialGameState();
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(false);
    expect(isGrowingOceanMissionUnlocked(state)).toBe(false);
  });

  it('is unavailable before first-contact aftermath', () => {
    const afterReturn = advanceQaToMonitoringReady(createInitialGameState());
    const beforeAnalysis: GameState = {
      ...afterReturn,
      storyFlags: (afterReturn.storyFlags ?? []).filter(
        (f) => f !== 'first_contact_analysis' && f !== 'anomaly_monitoring_prep',
      ),
      canonEra: 'dead_beacon',
      revealLevel: 2,
    };
    expect(isMissionUnlocked(beforeAnalysis, 'growing_ocean_anomaly_prep')).toBe(false);
  });

  it('becomes launchable after P1.4 aftermath', () => {
    const state = withMonitoringReady(createInitialGameState());
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(canStartStoryDiveMission(state, GROWING_OCEAN_ANOMALY_MISSION_ID)).toBe(true);
  });

  it('launching does not mark growing_ocean_anomaly spine', () => {
    const state = withMonitoringReady(createInitialGameState());
    const launched = reduceGame(state, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
    expect(launched.dive?.missionId).toBe(GROWING_OCEAN_ANOMALY_MISSION_ID);
    expect(hasCompletedSpineEvent(launched, 'growing_ocean_anomaly')).toBe(false);
  });

  it('success criteria false before required scans and drift', () => {
    const incomplete = monitoringDive({
      monitoringDriftActive: true,
      monitoringBaselineScans: 0,
      monitoringDriftScans: 0,
      status: 'success',
    });
    expect(evaluateGrowingOceanMonitoringObjectives(incomplete)).toBe(false);
  });

  it('success criteria true after baseline, drift, and post-drift scan', () => {
    const complete = monitoringDive({
      currentDepthM: monitoringDive().targetDepthM * MONITORING_DRIFT_DEPTH_FRACTION,
      monitoringDriftActive: true,
      monitoringBaselineScans: 1,
      monitoringDriftScans: 1,
      status: 'success',
    });
    expect(evaluateGrowingOceanMonitoringObjectives(complete)).toBe(true);
  });

  it('successful completion marks growing_ocean_anomaly spine', () => {
    let state = withMonitoringReady(createInitialGameState());
    state = completeMonitoringViaDive(state);
    expect(hasCompletedSpineEvent(state, 'growing_ocean_anomaly')).toBe(true);
    expect(state.completedSpineEvents).not.toContain('military_escalation');
    expect(state.completedSpineEvents).not.toContain('civilization_collapse');
  });

  it('failed dive does not mark growing_ocean_anomaly', () => {
    let state = withMonitoringReady(createInitialGameState());
    state = reduceGame(state, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
    const mission = state.missions.find((m) => m.id === GROWING_OCEAN_ANOMALY_MISSION_ID)!;
    const failedDive = {
      ...state.dive!,
      status: 'failed' as const,
      monitoringDriftActive: true,
      monitoringBaselineScans: 1,
      monitoringDriftScans: 1,
    };
    const lastMissionOutcome = buildMissionOutcome(
      { ...failedDive, outcomeRecorded: true },
      mission,
      state.submarine,
      null,
    );
    state = applyStoryDiveResolution(
      { ...state, dive: { ...failedDive, outcomeRecorded: true }, lastMissionOutcome },
      mission,
      failedDive,
    );
    expect(hasCompletedSpineEvent(state, 'growing_ocean_anomaly')).toBe(false);
  });

  it('applyGrowingOceanMonitoringTick activates drift and records scan buckets', () => {
    const mission = createInitialGameState().missions.find(
      (m) => m.id === GROWING_OCEAN_ANOMALY_MISSION_ID,
    )!;
    const dive = monitoringDive({
      currentDepthM: mission.targetDepthM * MONITORING_DRIFT_DEPTH_FRACTION,
    });
    const next = applyGrowingOceanMonitoringTick({
      dive,
      mission,
      deltaMs: 15_000,
      now: dive.startedAt + 15_000,
    });
    expect(next.monitoringDriftActive).toBe(true);

    const baselineScan = recordGrowingOceanMonitoringScan(
      monitoringDive({ currentDepthM: mission.targetDepthM * MONITORING_ZONE_DEPTH_FRACTION }),
    );
    expect(baselineScan.monitoringBaselineScans).toBe(1);

    const driftScan = recordGrowingOceanMonitoringScan(
      monitoringDive({ monitoringDriftActive: true }),
    );
    expect(driftScan.monitoringDriftScans).toBe(1);
  });
});

describe('qaProgression', () => {
  it('advanceQaToMonitoringReady unlocks Growing Ocean without auto-starting dive', () => {
    const state = advanceQaToMonitoringReady(createInitialGameState());
    expect(state.dive).toBeNull();
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(state.storyFlags).toContain('first_contact_analysis');
    expect(state.storyFlags).toContain('anomaly_monitoring_prep');
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'growing_ocean_anomaly')).toBe(false);
  });

  it('QA reducer action applies fast-forward state', () => {
    const state = reduceGame(createInitialGameState(), { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(state.dive).toBeNull();
  });
});
