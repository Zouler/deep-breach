import { REVEAL_LEVEL } from '@/game/canon';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import { upsertTrialProgress } from '@/game/trialProgression';
import {
  applyStoryDiveResolution,
  areAllExperimentalTrialsComplete,
  canStartStoryDiveMission,
  getAvailableMissions,
  getLockedMissions,
  getMissionDefinition,
  getNextStoryMission,
  hasCompletedSpineEvent,
  hasStoryFlag,
  isMissionUnlocked,
  isStoryMissionCompleted,
  markExperimentalTrialsCompleteIfNeeded,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { DEAD_BEACON_RECON_MIN_DEPTH_FRACTION } from '@/game/storyMissionObjectives';
import { OPERATION_DEAD_BEACON_MISSION_ID } from '@/data/missions';
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

function withOperationalIntegrationComplete(state: GameState): GameState {
  return reduceGame(state, { type: 'COMPLETE_STORY_MISSION', missionId: 'operational_integration' });
}

function withDeadBeaconReady(state: GameState): GameState {
  return withOperationalIntegrationComplete(completeAllTrials(state));
}

/** Launch + scan via reducer; resolve terminal recon through story dive resolution. */
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

describe('storyMissions vertical slice', () => {
  it('Dead Beacon is not available at new game', () => {
    const state = createInitialGameState();
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);
    expect(getAvailableMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(false);
    expect(getLockedMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(true);
  });

  it('trials complete unlocks Operational Integration', () => {
    const state = completeAllTrials(createInitialGameState());
    expect(areAllExperimentalTrialsComplete(state)).toBe(true);
    expect(hasCompletedSpineEvent(state, 'trials_completed')).toBe(true);
    expect(isMissionUnlocked(state, 'operational_integration')).toBe(true);
    expect(getNextStoryMission(state)?.id).toBe('operational_integration');
  });

  it('Operational Integration complete unlocks Dead Beacon', () => {
    let state = completeAllTrials(createInitialGameState());
    state = withOperationalIntegrationComplete(state);
    expect(hasCompletedSpineEvent(state, 'roberts_operationally_integrated')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'dbx03_signal_received')).toBe(true);
    expect(state.canonEra).toBe('dead_beacon');
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(true);
    expect(getAvailableMissions(state).some((m) => m.id === 'operation_dead_beacon')).toBe(true);
  });

  it('Dead Beacon has DBX-03 signal, recon objective, and no recovery unlock gate', () => {
    const def = getMissionDefinition('operation_dead_beacon')!;
    const briefingText = [...def.briefing.body, ...def.briefing.leadLines.map((l) => l.text)].join(' ');
    expect(briefingText).toMatch(/DBX-03/i);
    expect(def.objectives.some((o) => /recon/i.test(o))).toBe(true);
    expect(def.restrictions.every((r) => !/recovery required/i.test(r))).toBe(true);
    expect(def.unlockConditions.requiredSpineEvents).not.toContain('hull_reinforcement_mk1');
    expect(def.unlockConditions.requiredFlags ?? []).not.toContain('hull_reinforcement_mk1');
  });

  it('unlock helpers respect era and reveal gates', () => {
    let state = completeAllTrials(createInitialGameState());
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);

    state = withOperationalIntegrationComplete(state);
    expect(state.revealLevel).toBeGreaterThanOrEqual(REVEAL_LEVEL.IMPOSSIBLE_SIGNAL);
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(true);

    state = {
      ...state,
      revealLevel: REVEAL_LEVEL.NONE,
    };
    expect(isMissionUnlocked(state, 'operation_dead_beacon')).toBe(false);
  });

  it('return mission stays locked before P1.2 data disposition', () => {
    let state = withDeadBeaconReady(createInitialGameState());
    state = completeDeadBeaconReconViaDive(state);
    expect(hasCompletedSpineEvent(state, 'operation_dead_beacon')).toBe(true);
    expect(isMissionUnlocked(state, 'operation_dead_beacon_return')).toBe(false);
    expect(hasStoryFlag(state, 'hull_reinforcement_mk1')).toBe(false);
  });

  it('briefing acknowledgement alone does not complete Operation Dead Beacon', () => {
    const state = withDeadBeaconReady(createInitialGameState());
    const afterAck = reduceGame(state, {
      type: 'COMPLETE_STORY_MISSION',
      missionId: 'operation_dead_beacon',
    });
    expect(isStoryMissionCompleted(afterAck, 'operation_dead_beacon')).toBe(false);
    expect(hasCompletedSpineEvent(afterAck, 'operation_dead_beacon')).toBe(false);
  });

  it('cannot launch Operation Dead Beacon from a new game', () => {
    const state = createInitialGameState();
    expect(canStartStoryDiveMission(state, OPERATION_DEAD_BEACON_MISSION_ID)).toBe(false);
    const launched = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
    expect(launched.dive).toBeNull();
  });

  it('launching Operation Dead Beacon starts a dive and marks recon started', () => {
    const state = withDeadBeaconReady(createInitialGameState());
    const launched = reduceGame(state, { type: 'START_MISSION', missionId: OPERATION_DEAD_BEACON_MISSION_ID });
    expect(launched.dive?.missionId).toBe(OPERATION_DEAD_BEACON_MISSION_ID);
    expect(launched.dive?.status).toBe('active');
    expect(hasCompletedSpineEvent(launched, 'dead_beacon_recon_started')).toBe(true);
    expect(isStoryMissionCompleted(launched, 'operation_dead_beacon')).toBe(false);
  });

  it('successful recon completes operation_dead_beacon and opens P1.2 decision', () => {
    let state = withDeadBeaconReady(createInitialGameState());
    const scrapBefore = state.baseStorage.scrap;
    state = completeDeadBeaconReconViaDive(state);
    expect(hasCompletedSpineEvent(state, 'operation_dead_beacon')).toBe(true);
    expect(isStoryMissionCompleted(state, 'operation_dead_beacon')).toBe(true);
    expect(state.baseStorage.scrap).toBeGreaterThan(scrapBefore);
    expect(state.lastMissionOutcome?.storyDebrief?.reconComplete).toBe(true);
    expect(state.lastMissionOutcome?.storyDebrief?.pendingDataDecision).toBe(true);
    expect(state.storyFlags).not.toContain('deadBeaconData');
    expect(state.completedSpineEvents).not.toContain('first_anomaly_contact');
    expect(state.completedSpineEvents).not.toContain('correct_withdrawal');
    expect(state.completedSpineEvents).not.toContain('hull_reinforcement_mk1');
  });

  it('experimental trial launch still works after story missions exist', () => {
    const state = createInitialGameState();
    const launched = reduceGame(state, { type: 'START_MISSION', missionId: 'shallow_descent' });
    expect(launched.dive?.missionId).toBe('shallow_descent');
    expect(launched.dive?.status).toBe('active');
  });

  it('canon era cannot skip to war or collapse from story helpers', () => {
    const state = createInitialGameState();
    const warSkip = reduceGame(state, { type: 'ADVANCE_CANON_ERA', nextEra: 'war' });
    expect(warSkip.canonEra).toBe('experimental_trials');
    const collapseSkip = reduceGame(state, { type: 'ADVANCE_CANON_ERA', nextEra: 'collapse' });
    expect(collapseSkip.canonEra).toBe('experimental_trials');
  });
});
