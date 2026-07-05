import { OPERATION_DEAD_BEACON_MISSION_ID } from '@/data/missions';
import type { DiveSession } from '@/types';

/** Minimum standoff depth as a fraction of mission target depth. */
export const DEAD_BEACON_RECON_MIN_DEPTH_FRACTION = 0.85;

/** Minimum area scans required for recon completion. */
export const DEAD_BEACON_RECON_MIN_SCANS = 1;

export function isDeadBeaconReconCriteriaMet(dive: DiveSession): boolean {
  if (dive.missionId !== OPERATION_DEAD_BEACON_MISSION_ID) return false;
  const minDepth = dive.targetDepthM * DEAD_BEACON_RECON_MIN_DEPTH_FRACTION;
  const depthOk = dive.currentDepthM >= minDepth;
  const scanOk = (dive.scansPerformed ?? 0) >= DEAD_BEACON_RECON_MIN_SCANS;
  return depthOk && scanOk && dive.status === 'success';
}

export function isStoryDiveReconSuccessful(dive: DiveSession): boolean {
  if (dive.missionId === OPERATION_DEAD_BEACON_MISSION_ID) {
    return isDeadBeaconReconCriteriaMet(dive);
  }
  return false;
}
