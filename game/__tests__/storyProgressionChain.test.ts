import { REVEAL_LEVEL } from '@/game/canon';
import {
  canResolveFirstContactAnalysis,
  isFirstContactAnalysisPending,
  resolveFirstContactAnalysis,
  STORY_FLAG_ANOMALY_MONITORING_PREP,
  STORY_FLAG_FIRST_CONTACT_ANALYSIS,
} from '@/game/firstContactAftermath';
import {
  canResolveDeadBeaconDataDecision,
  isDeadBeaconDataDecisionPending,
  resolveDeadBeaconDataDecision,
  STORY_FLAG_DEAD_BEACON_DATA,
  STORY_FLAG_HULL_REINFORCEMENT_MK1,
} from '@/game/deadBeaconDecision';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import { upsertTrialProgress } from '@/game/trialProgression';
import {
  applyStoryDiveResolution,
  getAvailableMissions,
  hasCompletedSpineEvent,
  isMissionUnlocked,
  isStoryMissionCompleted,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { ANOMALY_CONTACT_MIN_DEPTH_FRACTION } from '@/game/anomalyContact';
import { DEAD_BEACON_RECON_MIN_DEPTH_FRACTION } from '@/game/storyMissionObjectives';
import {
  OPERATION_DEAD_BEACON_MISSION_ID,
  OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
} from '@/data/missions';
import { EXPERIMENTAL_TRIAL_MISSION_IDS } from '@/data/experimentalTrials';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';
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

function completeDeadBeaconReconViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  const mission = next.missions.find((m) => m.id === OPERATION_DEAD_BEACON_MISSION_ID)!;
  const successfulDive = {
    ...next.dive!,
    currentDepthM: next.dive!.targetDepthM * DEAD_BEACON_RECON_MIN_DEPTH_FRACTION,
    missionElapsedMs: next.dive!.missionDurationMs,
    scansPerformed: 1,
    status: 'success' as const,
    hullIntegrityPercent: 80,
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

function completeReturnContactViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  const mission = next.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
  const successfulDive = {
    ...next.dive!,
    currentDepthM: next.dive!.targetDepthM * ANOMALY_CONTACT_MIN_DEPTH_FRACTION,
    missionElapsedMs: next.dive!.missionDurationMs,
    anomalyInterferenceActive: true,
    anomalyContactScans: 1,
    scansPerformed: 1,
    status: 'success' as const,
    hullIntegrityPercent: 70,
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

function advanceThroughAftermath(state: GameState): GameState {
  return resolveFirstContactAnalysis(state, 'prepare_monitoring');
}

describe('story progression chain (P1.5 regression)', () => {
  it('documents unlock sequence from new game through aftermath', () => {
    let state = createInitialGameState();

    expect(isMissionUnlocked(state, 'operational_integration')).toBe(false);
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);
    expect(isMissionUnlocked(state, 'first_contact_analysis')).toBe(false);

    state = completeAllTrials(state);
    expect(isMissionUnlocked(state, 'operational_integration')).toBe(true);

    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(true);

    state = completeDeadBeaconReconViaDive(state);
    expect(isDeadBeaconDataDecisionPending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(false);

    state = resolveDeadBeaconDataDecision(state, 'report_official');
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(true);
    expect(canResolveDeadBeaconDataDecision(state)).toBe(false);

    state = completeReturnContactViaDive(state);
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(isFirstContactAnalysisPending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'first_contact_analysis')).toBe(true);

    state = advanceThroughAftermath(state);
    expect(isStoryMissionCompleted(state, 'first_contact_analysis')).toBe(true);
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(state.canonEra).toBe('anomaly_growth');
    expect(state.revealLevel).toBeGreaterThanOrEqual(REVEAL_LEVEL.ANOMALY_GROWTH);
  });

  it('failed Dead Beacon recon does not advance operation_dead_beacon spine', () => {
    let state = completeAllTrials(createInitialGameState());
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
    const mission = state.missions.find((m) => m.id === OPERATION_DEAD_BEACON_MISSION_ID)!;
    const failedDive = {
      ...state.dive!,
      currentDepthM: state.dive!.targetDepthM * 0.4,
      missionElapsedMs: state.dive!.missionDurationMs,
      scansPerformed: 0,
      status: 'failed' as const,
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
    expect(hasCompletedSpineEvent(state, 'operation_dead_beacon')).toBe(false);
    expect(isDeadBeaconDataDecisionPending(state)).toBe(false);
  });

  it('failed Return dive does not grant first_anomaly_contact', () => {
    let state = completeAllTrials(createInitialGameState());
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = completeDeadBeaconReconViaDive(state);
    state = resolveDeadBeaconDataDecision(state, 'report_official');
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
    const mission = state.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
    const failedDive = {
      ...state.dive!,
      currentDepthM: state.dive!.targetDepthM * 0.5,
      missionElapsedMs: state.dive!.missionDurationMs,
      status: 'failed' as const,
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
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(false);
    expect(isFirstContactAnalysisPending(state)).toBe(false);
  });

  it('aftermath cannot be resolved from new game or mid-spine', () => {
    expect(canResolveFirstContactAnalysis(createInitialGameState())).toBe(false);
    let mid = completeAllTrials(createInitialGameState());
    mid = reduceGame(mid, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    expect(canResolveFirstContactAnalysis(mid)).toBe(false);
  });

  it('aftermath resolution does not grant war or collapse spine events', () => {
    let state = completeAllTrials(createInitialGameState());
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = completeDeadBeaconReconViaDive(state);
    state = resolveDeadBeaconDataDecision(state, 'report_official');
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = completeReturnContactViaDive(state);
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = advanceThroughAftermath(state);
    expect(state.completedSpineEvents).not.toContain('growing_ocean_anomaly');
    expect(state.completedSpineEvents).not.toContain('military_escalation');
    expect(state.completedSpineEvents).not.toContain('civilization_collapse');
  });

  it('save v6 migration shape remains stable after full chain', () => {
    let state = createInitialGameState();
    state = completeAllTrials(state);
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = completeDeadBeaconReconViaDive(state);
    state = resolveDeadBeaconDataDecision(state, 'withhold_review');
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = completeReturnContactViaDive(state);
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = advanceThroughAftermath(state);

    const migrated = migrateGameState({ ...state, version: 5 } as unknown as GameState);
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.storyFlags).toEqual(
      expect.arrayContaining([
        STORY_FLAG_DEAD_BEACON_DATA,
        STORY_FLAG_HULL_REINFORCEMENT_MK1,
        STORY_FLAG_FIRST_CONTACT_ANALYSIS,
        STORY_FLAG_ANOMALY_MONITORING_PREP,
      ]),
    );
  });

  it('available missions unlock in sequence at major gates', () => {
    const fresh = createInitialGameState();
    const afterTrials = completeAllTrials(fresh);
    const afterIntegration = reduceGame(afterTrials, {
      type: 'COMPLETE_STORY_MISSION',
      missionId: 'operational_integration',
    });

    expect(getAvailableMissions(fresh).some((m) => m.id === 'operational_integration')).toBe(false);
    expect(getAvailableMissions(afterTrials).some((m) => m.id === 'operational_integration')).toBe(true);
    expect(getAvailableMissions(afterTrials).some((m) => m.id === 'operation_dead_beacon')).toBe(false);
    expect(getAvailableMissions(afterIntegration).some((m) => m.id === 'operation_dead_beacon')).toBe(true);
  });
});
