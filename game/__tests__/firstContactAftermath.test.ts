import { REVEAL_LEVEL } from '@/game/canon';
import {
  canResolveFirstContactAnalysis,
  FIRST_CONTACT_ANALYSIS_FINDINGS,
  isFirstContactAnalysisPending,
  resolveFirstContactAnalysis,
  STORY_FLAG_ANOMALY_MONITORING_PREP,
  STORY_FLAG_FIRST_CONTACT_ANALYSIS,
} from '@/game/firstContactAftermath';
import {
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
  return reduceGame(applyStoryDiveResolution(next, mission, successfulDive), { type: 'RETURN_TO_BASE' });
}

function withP13Complete(state: GameState): GameState {
  return completeReturnContactViaDive(withP12Complete(state));
}

describe('firstContactAftermath P1.4', () => {
  it('analysis is unavailable before first_anomaly_contact', () => {
    const fresh = createInitialGameState();
    expect(canResolveFirstContactAnalysis(fresh)).toBe(false);
    expect(isFirstContactAnalysisPending(fresh)).toBe(false);
    expect(isMissionUnlocked(fresh, 'first_contact_analysis')).toBe(false);
  });

  it('analysis is unavailable after P1.2 but before return dive', () => {
    const state = withP12Complete(createInitialGameState());
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(false);
    expect(canResolveFirstContactAnalysis(state)).toBe(false);
    expect(isMissionUnlocked(state, 'first_contact_analysis')).toBe(false);
  });

  it('successful return unlocks pending analysis without P1.4 flags', () => {
    const state = withP13Complete(createInitialGameState());
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'return_to_dbx03_site')).toBe(true);
    expect(isFirstContactAnalysisPending(state)).toBe(true);
    expect(canResolveFirstContactAnalysis(state)).toBe(true);
    expect(isMissionUnlocked(state, 'first_contact_analysis')).toBe(true);
    expect(state.storyFlags).not.toContain(STORY_FLAG_FIRST_CONTACT_ANALYSIS);
    expect(state.storyFlags).not.toContain(STORY_FLAG_ANOMALY_MONITORING_PREP);
  });

  it('cannot resolve analysis from new game', () => {
    const fresh = createInitialGameState();
    expect(resolveFirstContactAnalysis(fresh, 'authorize_research')).toBe(fresh);
  });

  it('resolution grants intended flags and advances era without growing_ocean_anomaly spine', () => {
    let state = withP13Complete(createInitialGameState());
    state = resolveFirstContactAnalysis(state, 'prepare_monitoring');
    expect(state.storyFlags).toContain(STORY_FLAG_FIRST_CONTACT_ANALYSIS);
    expect(state.storyFlags).toContain(STORY_FLAG_ANOMALY_MONITORING_PREP);
    expect(isFirstContactAnalysisPending(state)).toBe(false);
    expect(isStoryMissionCompleted(state, 'first_contact_analysis')).toBe(true);
    expect(state.canonEra).toBe('anomaly_growth');
    expect(state.revealLevel).toBeGreaterThanOrEqual(REVEAL_LEVEL.ANOMALY_GROWTH);
    expect(state.completedSpineEvents).not.toContain('growing_ocean_anomaly');
    expect(state.completedSpineEvents).not.toContain('military_escalation');
    expect(state.completedSpineEvents).not.toContain('civilization_collapse');
  });

  it('all three choices grant preparation flags', () => {
    for (const choice of ['authorize_research', 'forward_to_command', 'prepare_monitoring'] as const) {
      let state = withP13Complete(createInitialGameState());
      state = resolveFirstContactAnalysis(state, choice);
      expect(state.storyFlags).toContain(STORY_FLAG_FIRST_CONTACT_ANALYSIS);
      expect(state.storyFlags).toContain(STORY_FLAG_ANOMALY_MONITORING_PREP);
    }
  });

  it('unlocks growing ocean monitoring after resolution', () => {
    let state = withP13Complete(createInitialGameState());
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(false);
    state = resolveFirstContactAnalysis(state, 'forward_to_command');
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
  });

  it('reducer action resolves analysis', () => {
    let state = withP13Complete(createInitialGameState());
    state = reduceGame(state, {
      type: 'RESOLVE_FIRST_CONTACT_ANALYSIS',
      choice: 'authorize_research',
    });
    expect(state.storyFlags).toContain(STORY_FLAG_FIRST_CONTACT_ANALYSIS);
  });

  it('does not break P1.2 or P1.3 spine events on resolution', () => {
    let state = withP13Complete(createInitialGameState());
    state = resolveFirstContactAnalysis(state, 'authorize_research');
    expect(hasCompletedSpineEvent(state, 'operation_dead_beacon')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'hull_reinforcement_mk1')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'return_to_dbx03_site')).toBe(true);
    expect(state.storyFlags).toContain(STORY_FLAG_DEAD_BEACON_DATA);
    expect(state.storyFlags).toContain(STORY_FLAG_HULL_REINFORCEMENT_MK1);
  });

  it('findings list has 3-5 hard-sci-fi entries', () => {
    expect(FIRST_CONTACT_ANALYSIS_FINDINGS.length).toBeGreaterThanOrEqual(3);
    expect(FIRST_CONTACT_ANALYSIS_FINDINGS.length).toBeLessThanOrEqual(5);
  });

  it('save v6 still loads without migration bump', () => {
    const v6 = { ...createInitialGameState(), version: 6, storyFlags: [] };
    const migrated = migrateGameState(v6);
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.storyFlags).toEqual([]);
  });
});
