import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  advanceQaToCommandPressureReady,
  advanceQaToMonitoringReady,
} from '@/game/qaProgression';
import {
  canResolveCommandPressure,
  COMMAND_PRESSURE_CHOICES,
  isCommandPressurePending,
  resolveCommandPressure,
  STORY_FLAG_COMMAND_ESCALATION,
  STORY_FLAG_CONTROLLED_OBSERVATION,
  STORY_FLAG_EMERGENCY_WITHDRAWAL,
} from '@/game/commandPressure';
import { GROWING_OCEAN_ANOMALY_MISSION_ID } from '@/data/missions';
import { MONITORING_DRIFT_DEPTH_FRACTION } from '@/game/growingOceanAnomaly';
import {
  applyStoryDiveResolution,
  hasCompletedSpineEvent,
  isMissionUnlocked,
  isStoryMissionCompleted,
} from '@/game/storyMissions';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';
import type { GameState } from '@/types';

function completeGrowingOcean(state: GameState): GameState {
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

function withGrowingOceanComplete(state: GameState): GameState {
  return completeGrowingOcean(advanceQaToMonitoringReady(state));
}

describe('commandPressure P1.7', () => {
  it('is unavailable before Growing Ocean completion', () => {
    const monitoringReady = advanceQaToMonitoringReady(createInitialGameState());
    expect(hasCompletedSpineEvent(monitoringReady, 'growing_ocean_anomaly')).toBe(false);
    expect(isCommandPressurePending(monitoringReady)).toBe(false);
    expect(canResolveCommandPressure(monitoringReady)).toBe(false);
    expect(isMissionUnlocked(monitoringReady, 'command_pressure')).toBe(false);
  });

  it('becomes pending after successful Growing Ocean completion', () => {
    const state = withGrowingOceanComplete(createInitialGameState());
    expect(hasCompletedSpineEvent(state, 'growing_ocean_anomaly')).toBe(true);
    expect(isCommandPressurePending(state)).toBe(true);
    expect(canResolveCommandPressure(state)).toBe(true);
    expect(isMissionUnlocked(state, 'command_pressure')).toBe(true);
    expect(isStoryMissionCompleted(state, 'command_pressure')).toBe(false);
  });

  it('cannot resolve from new game', () => {
    const fresh = createInitialGameState();
    expect(resolveCommandPressure(fresh, 'controlled_observation')).toBe(fresh);
  });

  it('selecting one strategic response prevents selecting another', () => {
    let state = withGrowingOceanComplete(createInitialGameState());
    const scrapBefore = state.resources.scrap;
    state = resolveCommandPressure(state, 'controlled_observation');
    expect(isCommandPressurePending(state)).toBe(false);
    expect(canResolveCommandPressure(state)).toBe(false);
    const afterFirst = state;
    state = resolveCommandPressure(state, 'report_up_chain');
    expect(state).toBe(afterFirst);
    expect(state.storyFlags).not.toContain(STORY_FLAG_COMMAND_ESCALATION);
    expect(state.resources.scrap).toBe(scrapBefore + 10);
  });

  it.each([
    ['report_up_chain', STORY_FLAG_COMMAND_ESCALATION, 0, 10] as const,
    ['controlled_observation', STORY_FLAG_CONTROLLED_OBSERVATION, 10, 15] as const,
    ['emergency_withdrawal', STORY_FLAG_EMERGENCY_WITHDRAWAL, 20, 0] as const,
  ])(
    'choice %s grants correct flag and rewards',
    (choice, flag, scrap, research) => {
      let state = withGrowingOceanComplete(createInitialGameState());
      const scrapBefore = state.resources.scrap;
      const researchBefore = state.resources.researchData;
      state = resolveCommandPressure(state, choice);
      expect(state.storyFlags).toContain(flag);
      expect(state.storyFlags.filter((f) =>
        [
          STORY_FLAG_COMMAND_ESCALATION,
          STORY_FLAG_CONTROLLED_OBSERVATION,
          STORY_FLAG_EMERGENCY_WITHDRAWAL,
        ].includes(f),
      )).toHaveLength(1);
      expect(state.resources.scrap).toBe(scrapBefore + scrap);
      expect(state.resources.researchData).toBe(researchBefore + research);
      expect(hasCompletedSpineEvent(state, 'command_pressure')).toBe(true);
      expect(isStoryMissionCompleted(state, 'command_pressure')).toBe(true);
    },
  );

  it('records command_pressure spine once and does not add unrelated flags', () => {
    let state = withGrowingOceanComplete(createInitialGameState());
    const flagsBefore = [...state.storyFlags];
    state = resolveCommandPressure(state, 'report_up_chain');
    expect(state.completedSpineEvents.filter((e) => e === 'command_pressure')).toHaveLength(1);
    expect(state.storyFlags).toEqual(expect.arrayContaining([...flagsBefore, STORY_FLAG_COMMAND_ESCALATION]));
    expect(state.storyFlags).not.toContain(STORY_FLAG_CONTROLLED_OBSERVATION);
    expect(state.storyFlags).not.toContain(STORY_FLAG_EMERGENCY_WITHDRAWAL);
    expect(state.completedSpineEvents).not.toContain('military_escalation');
  });

  it('reducer action resolves command pressure', () => {
    let state = withGrowingOceanComplete(createInitialGameState());
    state = reduceGame(state, { type: 'RESOLVE_COMMAND_PRESSURE', choice: 'controlled_observation' });
    expect(state.storyFlags).toContain(STORY_FLAG_CONTROLLED_OBSERVATION);
    expect(isCommandPressurePending(state)).toBe(false);
  });

  it('unlocks abyssal expansion review placeholder after resolution', () => {
    let state = withGrowingOceanComplete(createInitialGameState());
    expect(isMissionUnlocked(state, 'abyssal_expansion_review')).toBe(false);
    state = resolveCommandPressure(state, 'controlled_observation');
    expect(isMissionUnlocked(state, 'abyssal_expansion_review')).toBe(true);
  });

  it('save v6 still loads without migration bump', () => {
    const v6 = { ...createInitialGameState(), version: 6, storyFlags: [] };
    const migrated = migrateGameState(v6);
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.storyFlags).toEqual([]);
  });
});

describe('qaProgression command pressure', () => {
  it('advanceQaToCommandPressureReady leaves decision pending', () => {
    const state = advanceQaToCommandPressureReady(createInitialGameState());
    expect(state.dive).toBeNull();
    expect(hasCompletedSpineEvent(state, 'growing_ocean_anomaly')).toBe(true);
    expect(isCommandPressurePending(state)).toBe(true);
    expect(isMissionUnlocked(state, 'command_pressure')).toBe(true);
  });

  it('QA reducer action advances to command pressure ready', () => {
    const state = reduceGame(createInitialGameState(), { type: 'QA_FAST_FORWARD_TO_COMMAND_PRESSURE' });
    expect(isCommandPressurePending(state)).toBe(true);
  });

  it('all command pressure choices are valid', () => {
    expect(COMMAND_PRESSURE_CHOICES).toHaveLength(3);
  });
});
