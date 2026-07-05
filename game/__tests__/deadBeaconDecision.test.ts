import { REVEAL_LEVEL } from '@/game/canon';
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
  hasCompletedSpineEvent,
  isMissionUnlocked,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { DEAD_BEACON_RECON_MIN_DEPTH_FRACTION } from '@/game/storyMissionObjectives';
import { OPERATION_DEAD_BEACON_MISSION_ID } from '@/data/missions';
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

function withOperationalIntegrationComplete(state: GameState): GameState {
  return reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
}

function withDeadBeaconReady(state: GameState): GameState {
  return withOperationalIntegrationComplete(completeAllTrials(state));
}

function completeDeadBeaconReconViaDive(state: GameState): GameState {
  let next = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
  next = reduceGame(next, { type: 'SCAN_AREA', now: next.dive!.startedAt + 1_000 });
  const mission = next.missions.find((m) => m.id === OPERATION_DEAD_BEACON_MISSION_ID)!;
  const successfulDive = {
    ...next.dive!,
    currentDepthM: next.dive!.targetDepthM * DEAD_BEACON_RECON_MIN_DEPTH_FRACTION,
    missionElapsedMs: next.dive!.missionDurationMs,
    scansPerformed: Math.max(next.dive!.scansPerformed, 1),
    status: 'success' as const,
    hullIntegrityPercent: 80,
  };
  const lastMissionOutcome = buildMissionOutcome(
    { ...successfulDive, outcomeRecorded: true },
    mission,
    next.submarine,
    next.pendingOfflineReport,
  );
  next = {
    ...next,
    dive: { ...successfulDive, outcomeRecorded: true },
    lastMissionOutcome,
  };
  return applyStoryDiveResolution(next, mission, successfulDive);
}

describe('deadBeaconDecision P1.2', () => {
  it('decision is not available before successful recon', () => {
    const fresh = createInitialGameState();
    expect(canResolveDeadBeaconDataDecision(fresh)).toBe(false);
    expect(isDeadBeaconDataDecisionPending(fresh)).toBe(false);

    const ready = withDeadBeaconReady(createInitialGameState());
    expect(canResolveDeadBeaconDataDecision(ready)).toBe(false);
  });

  it('successful recon unlocks pending decision without P1.2 flags', () => {
    const state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    expect(hasCompletedSpineEvent(state, 'operation_dead_beacon')).toBe(true);
    expect(isDeadBeaconDataDecisionPending(state)).toBe(true);
    expect(canResolveDeadBeaconDataDecision(state)).toBe(true);
    expect(state.storyFlags).not.toContain(STORY_FLAG_DEAD_BEACON_DATA);
    expect(state.storyFlags).not.toContain(STORY_FLAG_HULL_REINFORCEMENT_MK1);
    expect(state.lastMissionOutcome?.storyDebrief?.pendingDataDecision).toBe(true);
  });

  it('resolution grants deadBeaconData and hull_reinforcement_mk1', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    state = resolveDeadBeaconDataDecision(state, 'report_official');
    expect(state.storyFlags).toContain(STORY_FLAG_DEAD_BEACON_DATA);
    expect(state.storyFlags).toContain(STORY_FLAG_HULL_REINFORCEMENT_MK1);
    expect(hasCompletedSpineEvent(state, 'hull_reinforcement_mk1')).toBe(true);
    expect(isDeadBeaconDataDecisionPending(state)).toBe(false);
  });

  it('request_withdrawal marks correct_withdrawal spine event', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    state = resolveDeadBeaconDataDecision(state, 'request_withdrawal');
    expect(hasCompletedSpineEvent(state, 'correct_withdrawal')).toBe(true);
  });

  it('report_official does not mark correct_withdrawal', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    state = resolveDeadBeaconDataDecision(state, 'report_official');
    expect(hasCompletedSpineEvent(state, 'correct_withdrawal')).toBe(false);
  });

  it('does not grant first_anomaly_contact or late-game spine events', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    state = resolveDeadBeaconDataDecision(state, 'withhold_review');
    expect(state.completedSpineEvents).not.toContain('first_anomaly_contact');
    expect(state.completedSpineEvents).not.toContain('return_to_dbx03_site');
    expect(state.completedSpineEvents).not.toContain('growing_ocean_anomaly');
    expect(state.completedSpineEvents).not.toContain('military_escalation');
  });

  it('unlocks return placeholder after resolution but does not enable gameplay', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(false);
    state = resolveDeadBeaconDataDecision(state, 'report_official');
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(true);
    expect(state.revealLevel).toBeGreaterThanOrEqual(REVEAL_LEVEL.ANOMALY_CONFIRMED);
  });

  it('reducer action resolves decision', () => {
    let state = completeDeadBeaconReconViaDive(withDeadBeaconReady(createInitialGameState()));
    state = reduceGame(state, {
      type: 'RESOLVE_DEAD_BEACON_DATA_DECISION',
      choice: 'request_withdrawal',
    });
    expect(state.storyFlags).toContain(STORY_FLAG_DEAD_BEACON_DATA);
    expect(state.lastMissionOutcome?.storyDebrief?.dataDecisionResolved).toBe(true);
  });

  it('save v5 migrates to v6 with empty storyFlags', () => {
    const v5 = { ...createInitialGameState(), version: 5, storyFlags: undefined };
    const migrated = migrateGameState(v5);
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.storyFlags).toEqual([]);
  });
});
