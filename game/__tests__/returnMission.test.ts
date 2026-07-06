import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import { upsertTrialProgress } from '@/game/trialProgression';
import {
  applyStoryDiveResolution,
  canStartStoryDiveMission,
  hasCompletedSpineEvent,
  isMissionUnlocked,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { ANOMALY_CONTACT_MIN_DEPTH_FRACTION } from '@/game/anomalyContact';
import { DEAD_BEACON_RECON_MIN_DEPTH_FRACTION } from '@/game/storyMissionObjectives';
import {
  resolveDeadBeaconDataDecision,
  STORY_FLAG_DEAD_BEACON_DATA,
  STORY_FLAG_HULL_REINFORCEMENT_MK1,
} from '@/game/deadBeaconDecision';
import {
  OPERATION_DEAD_BEACON_MISSION_ID,
  OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
} from '@/data/missions';
import { EXPERIMENTAL_TRIAL_MISSION_IDS } from '@/data/experimentalTrials';
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

function withP12Complete(state: GameState): GameState {
  let next = completeAllTrials(state);
  next = reduceGame(next, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
  next = reduceGame(next, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
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
  next = applyStoryDiveResolution(
    { ...next, dive: { ...successfulDive, outcomeRecorded: true }, lastMissionOutcome },
    mission,
    successfulDive,
  );
  return reduceGame(resolveDeadBeaconDataDecision(next, 'report_official'), { type: 'RETURN_TO_BASE' });
}

function completeReturnContactViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
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
  next = {
    ...next,
    dive: { ...successfulDive, outcomeRecorded: true },
    lastMissionOutcome,
  };
  return applyStoryDiveResolution(next, mission, successfulDive);
}

describe('Return to DBX-03 Site P1.3', () => {
  it('is locked before P1.2 decision', () => {
    let state = withP12Complete(createInitialGameState());
    state = {
      ...state,
      storyFlags: state.storyFlags.filter(
        (f) => f !== STORY_FLAG_DEAD_BEACON_DATA && f !== STORY_FLAG_HULL_REINFORCEMENT_MK1,
      ),
    };
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(false);
  });

  it('unlocks only after deadBeaconData and hull_reinforcement_mk1', () => {
    const state = withP12Complete(createInitialGameState());
    expect(state.storyFlags).toContain(STORY_FLAG_DEAD_BEACON_DATA);
    expect(state.storyFlags).toContain(STORY_FLAG_HULL_REINFORCEMENT_MK1);
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(true);
  });

  it('cannot launch from a new game', () => {
    expect(canStartStoryDiveMission(createInitialGameState(), OPERATION_DEAD_BEACON_RETURN_MISSION_ID)).toBe(
      false,
    );
  });

  it('launching return dive does not mark first_anomaly_contact immediately', () => {
    const state = withP12Complete(createInitialGameState());
    const launched = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
    expect(launched.dive?.missionId).toBe(OPERATION_DEAD_BEACON_RETURN_MISSION_ID);
    expect(hasCompletedSpineEvent(launched, 'first_anomaly_contact')).toBe(false);
  });

  it('successful return contact marks first_anomaly_contact and return_to_dbx03_site', () => {
    let state = withP12Complete(createInitialGameState());
    state = completeReturnContactViaDive(state);
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'return_to_dbx03_site')).toBe(true);
    expect(state.lastMissionOutcome?.storyDebrief?.firstContactComplete).toBe(true);
    expect(state.completedSpineEvents).not.toContain('growing_ocean_anomaly');
  });

  it('failed return dive does not mark first_anomaly_contact', () => {
    let state = withP12Complete(createInitialGameState());
    let next = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID });
    const mission = next.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
    const failedDive = {
      ...next.dive!,
      currentDepthM: 200,
      status: 'failed' as const,
      anomalyInterferenceActive: false,
      anomalyContactScans: 0,
    };
    const lastMissionOutcome = buildMissionOutcome(
      { ...failedDive, outcomeRecorded: true },
      mission,
      next.submarine,
      null,
    );
    next = applyStoryDiveResolution(
      { ...next, dive: { ...failedDive, outcomeRecorded: true }, lastMissionOutcome },
      mission,
      failedDive,
    );
    expect(hasCompletedSpineEvent(next, 'first_anomaly_contact')).toBe(false);
  });
});
