import { REVEAL_LEVEL } from '@/game/canon';
import {
  canResolveAbyssalExpansionModels,
  isAbyssalExpansionModelsPending,
  resolveAbyssalExpansionModels,
  STORY_FLAG_MODEL_CURRENT_DRIFT,
} from '@/game/abyssalExpansionModels';
import {
  canResolveCommandPressure,
  isCommandPressurePending,
  resolveCommandPressure,
} from '@/game/commandPressure';
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
  canResolveEngineeringStressResponse,
  isEngineeringStressResponsePending,
  resolveEngineeringStressResponse,
  STORY_FLAG_ENGINEERING_HULL_TOLERANCE,
  STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES,
} from '@/game/engineeringStressResponse';
import {
  advanceQaToAbyssalExpansionModelsReady,
  advanceQaToCommandPressureReady,
  advanceQaToEngineeringStressResponseReady,
} from '@/game/qaProgression';
import {
  applyStoryDiveResolution,
  canStartStoryDiveMission,
  getAvailableMissions,
  hasCompletedSpineEvent,
  isMissionUnlocked,
  isStoryMissionCompleted,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { MONITORING_DRIFT_DEPTH_FRACTION } from '@/game/growingOceanAnomaly';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { ANOMALY_CONTACT_MIN_DEPTH_FRACTION } from '@/game/anomalyContact';
import { DEAD_BEACON_RECON_MIN_DEPTH_FRACTION } from '@/game/storyMissionObjectives';
import {
  OPERATION_DEAD_BEACON_MISSION_ID,
  OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
  GROWING_OCEAN_ANOMALY_MISSION_ID,
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
    expect(canStartStoryDiveMission(state, GROWING_OCEAN_ANOMALY_MISSION_ID)).toBe(true);
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

const EXPECTED_SPINE_THROUGH_P1_9: readonly string[] = [
  'experimental_trials_complete',
  'operational_integration',
  'operation_dead_beacon',
  'hull_reinforcement_mk1',
  'first_anomaly_contact',
  'return_to_dbx03_site',
  'growing_ocean_anomaly',
  'command_pressure',
  'abyssal_expansion_models',
  'engineering_stress_response',
];

function completeGrowingOceanMonitoringViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 2_000 });
  const mission = next.missions.find((m) => m.id === GROWING_OCEAN_ANOMALY_MISSION_ID)!;
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
  next = applyStoryDiveResolution(
    { ...next, dive: { ...successfulDive, outcomeRecorded: true }, lastMissionOutcome },
    mission,
    successfulDive,
  );
  return reduceGame(next, { type: 'RETURN_TO_BASE' });
}

describe('story progression chain (P1.10 regression through P1.9)', () => {
  it('simulates full path from new game through Engineering Stress Response', () => {
    let state = createInitialGameState();

    state = completeAllTrials(state);
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = completeDeadBeaconReconViaDive(state);
    expect(isDeadBeaconDataDecisionPending(state)).toBe(true);

    state = resolveDeadBeaconDataDecision(state, 'report_official');
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = completeReturnContactViaDive(state);
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = resolveFirstContactAnalysis(state, 'prepare_monitoring');
    state = completeGrowingOceanMonitoringViaDive(state);
    expect(isCommandPressurePending(state)).toBe(true);

    state = resolveCommandPressure(state, 'controlled_observation');
    expect(isAbyssalExpansionModelsPending(state)).toBe(true);

    state = resolveAbyssalExpansionModels(state, 'prioritize_current_drift');
    expect(isEngineeringStressResponsePending(state)).toBe(true);

    state = resolveEngineeringStressResponse(state, 'reinforce_hull_tolerance');

    for (const eventId of EXPECTED_SPINE_THROUGH_P1_9) {
      expect(state.completedSpineEvents).toContain(eventId);
    }
    expect(state.completedSpineEvents.filter((e) => e === 'engineering_stress_response')).toHaveLength(1);
    expect(state.storyFlags).toContain(STORY_FLAG_MODEL_CURRENT_DRIFT);
    expect(state.storyFlags).toContain(STORY_FLAG_ENGINEERING_HULL_TOLERANCE);
    expect(state.completedSpineEvents).not.toContain('military_escalation');
    expect(isMissionUnlocked(state, 'expansion_model_deployment_hold')).toBe(true);
    expect(isMissionUnlocked(state, 'descent_authorization_hold')).toBe(true);
  });

  it('decision phases are idempotent via reducer double-dispatch', () => {
    let state = createInitialGameState();
    state = completeAllTrials(state);
    state = reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
    state = completeDeadBeaconReconViaDive(state);

    const scrapBeforeDeadBeacon = state.resources.scrap;
    state = reduceGame(state, { type: 'RESOLVE_DEAD_BEACON_DATA_DECISION', choice: 'report_official' });
    const afterFirstDeadBeacon = state;
    state = reduceGame(state, { type: 'RESOLVE_DEAD_BEACON_DATA_DECISION', choice: 'withhold_review' });
    expect(state).toBe(afterFirstDeadBeacon);
    expect(state.storyFlags.filter((f) => f === STORY_FLAG_DEAD_BEACON_DATA)).toHaveLength(1);
    expect(state.resources.scrap).toBe(scrapBeforeDeadBeacon);

    state = reduceGame(state, { type: 'RETURN_TO_BASE' });
    state = completeReturnContactViaDive(state);
    state = reduceGame(state, { type: 'RETURN_TO_BASE' });

    state = reduceGame(state, { type: 'RESOLVE_FIRST_CONTACT_ANALYSIS', choice: 'prepare_monitoring' });
    const afterFirstAnalysis = state;
    state = reduceGame(state, { type: 'RESOLVE_FIRST_CONTACT_ANALYSIS', choice: 'forward_to_command' });
    expect(state).toBe(afterFirstAnalysis);

    state = completeGrowingOceanMonitoringViaDive(state);
    state = reduceGame(state, { type: 'RESOLVE_COMMAND_PRESSURE', choice: 'controlled_observation' });
    const afterFirstCommand = state;
    const scrapAfterFirstCommand = state.resources.scrap;
    const researchAfterFirstCommand = state.resources.researchData;
    state = reduceGame(state, { type: 'RESOLVE_COMMAND_PRESSURE', choice: 'report_up_chain' });
    expect(state).toBe(afterFirstCommand);
    expect(canResolveCommandPressure(state)).toBe(false);
    expect(state.resources.scrap).toBe(scrapAfterFirstCommand);
    expect(state.resources.researchData).toBe(researchAfterFirstCommand);

    state = reduceGame(state, { type: 'RESOLVE_ABYSSAL_EXPANSION_MODELS', choice: 'prioritize_current_drift' });
    const afterFirstModel = state;
    const scrapAfterModel = state.resources.scrap;
    const researchAfterModel = state.resources.researchData;
    state = reduceGame(state, { type: 'RESOLVE_ABYSSAL_EXPANSION_MODELS', choice: 'prioritize_resonance_field' });
    expect(state).toBe(afterFirstModel);
    expect(canResolveAbyssalExpansionModels(state)).toBe(false);
    expect(state.resources.scrap).toBe(scrapAfterModel);
    expect(state.resources.researchData).toBe(researchAfterModel);

    state = reduceGame(state, { type: 'RESOLVE_ENGINEERING_STRESS_RESPONSE', choice: 'reinforce_hull_tolerance' });
    const afterFirstEngineering = state;
    const scrapAfterEngineering = state.resources.scrap;
    state = reduceGame(state, { type: 'RESOLVE_ENGINEERING_STRESS_RESPONSE', choice: 'shield_sensor_stack' });
    expect(state).toBe(afterFirstEngineering);
    expect(canResolveEngineeringStressResponse(state)).toBe(false);
    expect(state.resources.scrap).toBe(scrapAfterEngineering);
    expect(state.completedSpineEvents.filter((e) => e === 'engineering_stress_response')).toHaveLength(1);
  });

  it('QA helpers produce valid states without duplicate spine entries', () => {
    const commandReady = advanceQaToCommandPressureReady();
    expect(isCommandPressurePending(commandReady)).toBe(true);
    expect(new Set(commandReady.completedSpineEvents).size).toBe(commandReady.completedSpineEvents.length);

    const expansionReady = advanceQaToAbyssalExpansionModelsReady();
    expect(isAbyssalExpansionModelsPending(expansionReady)).toBe(true);
    expect(new Set(expansionReady.completedSpineEvents).size).toBe(
      expansionReady.completedSpineEvents.length,
    );

    const engineeringReady = advanceQaToEngineeringStressResponseReady();
    expect(isEngineeringStressResponsePending(engineeringReady)).toBe(true);
    expect(engineeringReady.completedSpineEvents).toContain('abyssal_expansion_models');
    expect(new Set(engineeringReady.completedSpineEvents).size).toBe(
      engineeringReady.completedSpineEvents.length,
    );
  });

  it('save v6 migration remains stable after full P1.9 chain', () => {
    let state = advanceQaToEngineeringStressResponseReady();
    state = resolveEngineeringStressResponse(state, 'preserve_repair_supplies');

    const migrated = migrateGameState({ ...state, version: 5 } as unknown as GameState);
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.completedSpineEvents).toContain('engineering_stress_response');
    expect(migrated!.storyFlags).toEqual(
      expect.arrayContaining([
        STORY_FLAG_MODEL_CURRENT_DRIFT,
        STORY_FLAG_ENGINEERING_REPAIR_SUPPLIES,
      ]),
    );
  });
});
