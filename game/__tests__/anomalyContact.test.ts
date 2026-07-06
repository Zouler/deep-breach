import {
  ANOMALY_CONTACT_MIN_DEPTH_FRACTION,
  ANOMALY_INTERFERENCE_DEPTH_FRACTION,
  applyAnomalyContactTick,
  evaluateAnomalyContactObjectives,
  isAnomalyContactMission,
  recordAnomalyContactScan,
  shouldTriggerFirstContact,
} from '@/game/anomalyContact';
import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import { OPERATION_DEAD_BEACON_RETURN_MISSION_ID } from '@/data/missions';
import type { DiveSession } from '@/types';

function returnDive(partial: Partial<DiveSession> = {}): DiveSession {
  const state = createInitialGameState();
  const mission = state.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
  const base = createDiveSessionForMission(mission, state.submarine, 0, state);
  return { ...base, ...partial };
}

describe('anomalyContact', () => {
  it('only applies to Return to DBX-03 Site mission id', () => {
    expect(isAnomalyContactMission(OPERATION_DEAD_BEACON_RETURN_MISSION_ID)).toBe(true);
    expect(isAnomalyContactMission('operation_dead_beacon')).toBe(false);
  });

  it('contact criteria false before depth, interference scan, and success', () => {
    const dive = returnDive({
      currentDepthM: 500,
      anomalyInterferenceActive: false,
      anomalyContactScans: 0,
      status: 'active',
    });
    expect(evaluateAnomalyContactObjectives(dive)).toBe(false);
  });

  it('contact criteria true after interference, depth, scan, and success', () => {
    const dive = returnDive({
      currentDepthM: 1200 * ANOMALY_CONTACT_MIN_DEPTH_FRACTION,
      targetDepthM: 1200,
      anomalyInterferenceActive: true,
      anomalyContactScans: 1,
      status: 'success',
    });
    expect(evaluateAnomalyContactObjectives(dive)).toBe(true);
  });

  it('shouldTriggerFirstContact at interference depth threshold', () => {
    const before = returnDive({
      currentDepthM: 1200 * ANOMALY_INTERFERENCE_DEPTH_FRACTION - 1,
    });
    const after = returnDive({
      currentDepthM: 1200 * ANOMALY_INTERFERENCE_DEPTH_FRACTION,
    });
    expect(shouldTriggerFirstContact(before)).toBe(false);
    expect(shouldTriggerFirstContact(after)).toBe(true);
  });

  it('applyAnomalyContactTick activates interference and logs first contact', () => {
    const state = createInitialGameState();
    const mission = state.missions.find((m) => m.id === OPERATION_DEAD_BEACON_RETURN_MISSION_ID)!;
    const dive = returnDive({
      currentDepthM: 1200 * ANOMALY_INTERFERENCE_DEPTH_FRACTION,
    });
    const next = applyAnomalyContactTick({
      dive,
      mission,
      deltaMs: 15_000,
      now: dive.startedAt + 15_000,
    });
    expect(next.anomalyInterferenceActive).toBe(true);
    expect(next.anomalyFirstContactLogged).toBe(true);
    expect(next.eventLog.some((e) => /ANOMALY CONTACT/i.test(e.message))).toBe(true);
  });

  it('recordAnomalyContactScan increments only after interference begins', () => {
    const inactive = returnDive({ anomalyInterferenceActive: false });
    expect(recordAnomalyContactScan(inactive).anomalyContactScans).toBe(0);
    const active = returnDive({ anomalyInterferenceActive: true, anomalyContactScans: 0 });
    expect(recordAnomalyContactScan(active).anomalyContactScans).toBe(1);
  });
});
