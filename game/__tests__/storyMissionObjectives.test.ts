import { OPERATION_DEAD_BEACON_MISSION_ID } from '@/data/missions';
import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import {
  DEAD_BEACON_RECON_MIN_DEPTH_FRACTION,
  DEAD_BEACON_RECON_MIN_SCANS,
  isDeadBeaconReconCriteriaMet,
  isStoryDiveReconSuccessful,
} from '@/game/storyMissionObjectives';

function deadBeaconDive(overrides: Partial<ReturnType<typeof createDiveSessionForMission>> = {}) {
  const state = createInitialGameState();
  const mission = state.missions.find((m) => m.id === OPERATION_DEAD_BEACON_MISSION_ID)!;
  return createDiveSessionForMission(mission, state.submarine, 0, state);
}

describe('storyMissionObjectives', () => {
  it('recon criteria false before depth, scan, and success requirements', () => {
    const dive = deadBeaconDive();
    expect(isDeadBeaconReconCriteriaMet({ ...dive, status: 'active' })).toBe(false);
    expect(
      isDeadBeaconReconCriteriaMet({
        ...dive,
        status: 'success',
        currentDepthM: dive.targetDepthM * 0.5,
        scansPerformed: 0,
      }),
    ).toBe(false);
    expect(
      isDeadBeaconReconCriteriaMet({
        ...dive,
        status: 'success',
        currentDepthM: dive.targetDepthM * DEAD_BEACON_RECON_MIN_DEPTH_FRACTION,
        scansPerformed: 0,
      }),
    ).toBe(false);
  });

  it('recon criteria true after depth, scan, and successful surface', () => {
    const dive = deadBeaconDive();
    expect(
      isDeadBeaconReconCriteriaMet({
        ...dive,
        status: 'success',
        currentDepthM: dive.targetDepthM * DEAD_BEACON_RECON_MIN_DEPTH_FRACTION,
        scansPerformed: DEAD_BEACON_RECON_MIN_SCANS,
      }),
    ).toBe(true);
    expect(isStoryDiveReconSuccessful(dive)).toBe(false);
  });
});
