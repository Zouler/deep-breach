import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  advanceQaToDeadBeaconReady,
  advanceQaToEngineeringStressResponseReady,
  advanceQaToMonitoringReady,
  advanceQaToReturnDiveReady,
} from '@/game/qaProgression';
import { hasCompletedSpineEvent, isMissionUnlocked } from '@/game/storyMissions';
import { isEngineeringStressResponsePending } from '@/game/engineeringStressResponse';

describe('QA fast-forward helpers from partial saves (N-03)', () => {
  it('advanceQaToMonitoringReady works from fresh state', () => {
    const state = advanceQaToMonitoringReady(createInitialGameState());
    expect(hasCompletedSpineEvent(state, 'return_to_dbx03_site')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(state.dive).toBeNull();
  });

  it('advanceQaToMonitoringReady works when already at Return Dive ready', () => {
    const ret = advanceQaToReturnDiveReady(createInitialGameState());
    const state = advanceQaToMonitoringReady(ret);
    expect(hasCompletedSpineEvent(state, 'return_to_dbx03_site')).toBe(true);
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(state.dive).toBeNull();
  });

  it('reducer QA_FAST_FORWARD_TO_MONITORING from Return Dive ready advances spine', () => {
    const ret = advanceQaToReturnDiveReady(createInitialGameState());
    const next = reduceGame(ret, { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    expect(next).not.toBe(ret);
    expect(hasCompletedSpineEvent(next, 'return_to_dbx03_site')).toBe(true);
    expect(hasCompletedSpineEvent(next, 'first_anomaly_contact')).toBe(true);
    expect(next.completedSpineEvents.length).toBeGreaterThan(ret.completedSpineEvents.length);
  });

  it('reducer QA_FAST_FORWARD_TO_MONITORING from Dead Beacon ready advances', () => {
    const dead = advanceQaToDeadBeaconReady(createInitialGameState());
    const next = reduceGame(dead, { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    expect(hasCompletedSpineEvent(next, 'return_to_dbx03_site')).toBe(true);
    expect(isMissionUnlocked(next, 'growing_ocean_anomaly_prep')).toBe(true);
  });

  it('chained reducers Return → Monitoring → Engineering Stress', () => {
    let state = createInitialGameState();
    state = reduceGame(state, { type: 'QA_FAST_FORWARD_TO_RETURN_DIVE' });
    expect(hasCompletedSpineEvent(state, 'hull_reinforcement_mk1')).toBe(true);

    state = reduceGame(state, { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    expect(hasCompletedSpineEvent(state, 'first_anomaly_contact')).toBe(true);
    expect(isMissionUnlocked(state, 'growing_ocean_anomaly_prep')).toBe(true);

    state = reduceGame(state, { type: 'QA_FAST_FORWARD_TO_ENGINEERING_STRESS' });
    expect(hasCompletedSpineEvent(state, 'abyssal_expansion_models')).toBe(true);
    expect(isEngineeringStressResponsePending(state)).toBe(true);
  });

  it('direct advanceQaToEngineeringStressResponseReady from return-ready state', () => {
    const ret = advanceQaToReturnDiveReady(createInitialGameState());
    const state = advanceQaToEngineeringStressResponseReady(ret);
    expect(hasCompletedSpineEvent(state, 'abyssal_expansion_models')).toBe(true);
    expect(isEngineeringStressResponsePending(state)).toBe(true);
  });

  it('re-tapping mid-spine helpers is idempotent at the target gate', () => {
    let state = reduceGame(createInitialGameState(), { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    const again = reduceGame(state, { type: 'QA_FAST_FORWARD_TO_MONITORING' });
    expect(isMissionUnlocked(again, 'growing_ocean_anomaly_prep')).toBe(true);
    expect(again.completedSpineEvents).toEqual(state.completedSpineEvents);
  });
});
