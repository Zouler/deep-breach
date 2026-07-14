import { REVEAL_LEVEL } from '@/game/canon';
import {
  isAbyssalExpansionModelsPending,
  resolveAbyssalExpansionModels,
} from '@/game/abyssalExpansionModels';
import { isCommandPressurePending, resolveCommandPressure } from '@/game/commandPressure';
import { isEngineeringStressResponsePending } from '@/game/engineeringStressResponse';
import {
  canResolveDeadBeaconDataDecision,
  resolveDeadBeaconDataDecision,
} from '@/game/deadBeaconDecision';
import {
  canResolveFirstContactAnalysis,
  resolveFirstContactAnalysis,
} from '@/game/firstContactAftermath';
import { MONITORING_DRIFT_DEPTH_FRACTION } from '@/game/growingOceanAnomaly';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import { upsertTrialProgress } from '@/game/trialProgression';
import {
  applyStoryDiveResolution,
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
  GROWING_OCEAN_ANOMALY_MISSION_ID,
} from '@/data/missions';
import { EXPERIMENTAL_TRIAL_MISSION_IDS } from '@/data/experimentalTrials';
import type { GameState } from '@/types';

function clearActiveDiveState(state: GameState): GameState {
  return {
    ...state,
    dive: null,
    lastMissionOutcome: null,
    pendingOfflineReport: null,
  };
}

function completeExperimentalTrialsAndIntegration(state: GameState): GameState {
  let next = state;
  for (const trialId of EXPERIMENTAL_TRIAL_MISSION_IDS) {
    next = upsertTrialProgress(next, {
      trialId,
      status: 'completed',
      attempts: 1,
      completedAt: Date.now(),
    });
  }
  next = markExperimentalTrialsCompleteIfNeeded(next);
  next = reduceGame(next, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
  return next;
}

function requireActiveDive(state: GameState, missionId: string): GameState {
  if (!state.dive || state.dive.missionId !== missionId) {
    throw new Error(`QA fast-forward failed: could not start dive for ${missionId}`);
  }
  return state;
}

/**
 * Simulate a successful Dead Beacon recon. Skips if already completed so helpers
 * remain safe when tapped from a mid-spine save (N-03).
 */
function completeDeadBeaconRecon(state: GameState): GameState {
  if (isStoryMissionCompleted(state, 'operation_dead_beacon')) {
    return clearActiveDiveState(state);
  }
  let next = clearActiveDiveState(state);
  next = reduceGame(next, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
  next = requireActiveDive(next, OPERATION_DEAD_BEACON_MISSION_ID);
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

/**
 * Simulate successful Return to DBX-03 first-contact dive. Skips if already complete.
 */
function completeReturnContactDive(state: GameState): GameState {
  if (
    hasCompletedSpineEvent(state, 'return_to_dbx03_site') &&
    hasCompletedSpineEvent(state, 'first_anomaly_contact')
  ) {
    return clearActiveDiveState(state);
  }
  let next = clearActiveDiveState(state);
  next = reduceGame(next, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
  next = requireActiveDive(next, OPERATION_DEAD_BEACON_RETURN_MISSION_ID);
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  const mission = next.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
  const successfulDive = {
    ...next.dive!,
    currentDepthM: next.dive!.targetDepthM * ANOMALY_CONTACT_MIN_DEPTH_FRACTION,
    missionElapsedMs: next.dive!.missionDurationMs,
    scansPerformed: 1,
    anomalyInterferenceActive: true,
    anomalyContactScans: 1,
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

/**
 * Simulate Growing Ocean monitoring success. Skips if spine already granted.
 */
function completeGrowingOceanMonitoring(state: GameState): GameState {
  if (hasCompletedSpineEvent(state, 'growing_ocean_anomaly')) {
    return clearActiveDiveState(state);
  }
  let next = clearActiveDiveState(state);
  next = reduceGame(next, { type: 'START_MISSION', missionId: GROWING_OCEAN_ANOMALY_MISSION_ID });
  next = requireActiveDive(next, GROWING_OCEAN_ANOMALY_MISSION_ID);
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
  next = applyStoryDiveResolution(
    { ...next, dive: { ...successfulDive, outcomeRecorded: true }, lastMissionOutcome },
    mission,
    successfulDive,
  );
  return reduceGame(next, { type: 'RETURN_TO_BASE' });
}

function ensureAnomalyGrowthEra(state: GameState): GameState {
  let next = state;
  if (next.canonEra !== 'anomaly_growth') {
    next = { ...next, canonEra: 'anomaly_growth' };
  }
  if (next.revealLevel < REVEAL_LEVEL.ANOMALY_GROWTH) {
    next = { ...next, revealLevel: REVEAL_LEVEL.ANOMALY_GROWTH };
  }
  return next;
}

/**
 * Dev/QA helper — post–Operational Integration; Operation Dead Beacon recon is launchable.
 */
export function advanceQaToDeadBeaconReady(state: GameState = createInitialGameState()): GameState {
  if (
    isMissionUnlocked(state, 'operation_dead_beacon') &&
    !isStoryMissionCompleted(state, 'operation_dead_beacon')
  ) {
    return clearActiveDiveState(state);
  }
  const next = completeExperimentalTrialsAndIntegration(state);
  if (!isMissionUnlocked(next, 'operation_dead_beacon')) {
    throw new Error('QA fast-forward failed: Operation Dead Beacon is not unlocked');
  }
  return clearActiveDiveState(next);
}

/**
 * Dev/QA helper — post–P1.2 data disposition; Return to DBX-03 Site dive is launchable.
 */
export function advanceQaToReturnDiveReady(state: GameState = createInitialGameState()): GameState {
  if (
    isMissionUnlocked(state, 'operation_dead_beacon_return') &&
    !hasCompletedSpineEvent(state, 'return_to_dbx03_site')
  ) {
    return clearActiveDiveState(state);
  }
  let next = completeExperimentalTrialsAndIntegration(state);
  next = completeDeadBeaconRecon(next);
  if (canResolveDeadBeaconDataDecision(next)) {
    next = resolveDeadBeaconDataDecision(next, 'report_official');
  }
  next = reduceGame(next, { type: 'RETURN_TO_BASE' });

  if (!isMissionUnlocked(next, 'operation_dead_beacon_return')) {
    throw new Error('QA fast-forward failed: Return to DBX-03 Site is not unlocked');
  }
  return clearActiveDiveState(next);
}

/**
 * Dev/QA helper — advances a save to the post-P1.4 state where Growing Ocean
 * Anomaly monitoring is ready to launch. Does not auto-start a dive.
 */
export function advanceQaToMonitoringReady(state: GameState = createInitialGameState()): GameState {
  if (
    isMissionUnlocked(state, 'growing_ocean_anomaly_prep') &&
    !hasCompletedSpineEvent(state, 'growing_ocean_anomaly')
  ) {
    return clearActiveDiveState(ensureAnomalyGrowthEra(state));
  }

  let next = completeExperimentalTrialsAndIntegration(state);
  next = completeDeadBeaconRecon(next);
  if (canResolveDeadBeaconDataDecision(next)) {
    next = resolveDeadBeaconDataDecision(next, 'report_official');
  }
  next = reduceGame(next, { type: 'RETURN_TO_BASE' });
  next = completeReturnContactDive(next);
  next = reduceGame(next, { type: 'RETURN_TO_BASE' });
  if (canResolveFirstContactAnalysis(next)) {
    next = resolveFirstContactAnalysis(next, 'prepare_monitoring');
  }

  next = clearActiveDiveState(ensureAnomalyGrowthEra(next));

  if (!isMissionUnlocked(next, 'growing_ocean_anomaly_prep')) {
    throw new Error('QA fast-forward failed: Growing Ocean Anomaly is not unlocked');
  }

  return next;
}

/**
 * Dev/QA helper — advances a save to post–Growing Ocean success where Command Pressure
 * strategic response is pending. Does not auto-resolve the decision.
 */
export function advanceQaToCommandPressureReady(state: GameState = createInitialGameState()): GameState {
  if (isCommandPressurePending(state) && isMissionUnlocked(state, 'command_pressure')) {
    return clearActiveDiveState(state);
  }

  let next = advanceQaToMonitoringReady(state);
  next = completeGrowingOceanMonitoring(next);
  next = clearActiveDiveState(next);

  if (!next.completedSpineEvents.includes('growing_ocean_anomaly')) {
    throw new Error('QA fast-forward failed: Growing Ocean Anomaly not complete');
  }
  if (!isCommandPressurePending(next)) {
    throw new Error('QA fast-forward failed: Command Pressure is not pending');
  }
  if (!isMissionUnlocked(next, 'command_pressure')) {
    throw new Error('QA fast-forward failed: Command Pressure mission not unlocked');
  }

  return next;
}

/**
 * Dev/QA helper — advances a save to post–P1.7 where Abyssal Expansion Models analysis
 * is pending. Resolves Command Pressure with controlled observation; does not pick a model.
 */
export function advanceQaToAbyssalExpansionModelsReady(
  state: GameState = createInitialGameState(),
): GameState {
  if (isAbyssalExpansionModelsPending(state) && isMissionUnlocked(state, 'abyssal_expansion_models')) {
    return clearActiveDiveState(state);
  }

  let next = advanceQaToCommandPressureReady(state);
  next = resolveCommandPressure(next, 'controlled_observation');
  next = clearActiveDiveState(next);

  if (!next.completedSpineEvents.includes('command_pressure')) {
    throw new Error('QA fast-forward failed: Command Pressure not complete');
  }
  if (!isAbyssalExpansionModelsPending(next)) {
    throw new Error('QA fast-forward failed: Abyssal Expansion Models is not pending');
  }
  if (!isMissionUnlocked(next, 'abyssal_expansion_models')) {
    throw new Error('QA fast-forward failed: Abyssal Expansion Models mission not unlocked');
  }

  return next;
}

/**
 * Dev/QA helper — advances a save to post–P1.8 where Engineering Stress Response
 * is pending. Resolves Abyssal Expansion Models with current drift; does not pick an engineering posture.
 */
export function advanceQaToEngineeringStressResponseReady(
  state: GameState = createInitialGameState(),
): GameState {
  if (
    isEngineeringStressResponsePending(state) &&
    isMissionUnlocked(state, 'engineering_stress_response')
  ) {
    return clearActiveDiveState(state);
  }

  let next = advanceQaToAbyssalExpansionModelsReady(state);
  next = resolveAbyssalExpansionModels(next, 'prioritize_current_drift');
  next = clearActiveDiveState(next);

  if (!next.completedSpineEvents.includes('abyssal_expansion_models')) {
    throw new Error('QA fast-forward failed: Abyssal Expansion Models not complete');
  }
  if (!isEngineeringStressResponsePending(next)) {
    throw new Error('QA fast-forward failed: Engineering Stress Response is not pending');
  }
  if (!isMissionUnlocked(next, 'engineering_stress_response')) {
    throw new Error('QA fast-forward failed: Engineering Stress Response mission not unlocked');
  }

  return next;
}
