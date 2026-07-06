import { GROWING_OCEAN_ANOMALY_MISSION_ID } from '@/data/missions';
import { REVEAL_LEVEL } from '@/game/canon';
import {
  STORY_FLAG_ANOMALY_MONITORING_PREP,
  STORY_FLAG_FIRST_CONTACT_ANALYSIS,
} from '@/game/firstContactAftermath';
import { hasStoryFlag } from '@/game/deadBeaconDecision';
import { createId } from '@/game/ids';
import { missionProgress } from '@/game/pacing';
import type { DiveSession, GameEvent, GameState, Mission } from '@/types';

/** Depth fraction where baseline monitoring scans count. */
export const MONITORING_ZONE_DEPTH_FRACTION = 0.72;

/** Depth fraction where signal drift / monitoring window begins. */
export const MONITORING_DRIFT_DEPTH_FRACTION = 0.78;

/** Baseline scans required in the monitoring zone before drift. */
export const MONITORING_MIN_BASELINE_SCANS = 1;

/** Scans required after signal drift begins. */
export const MONITORING_MIN_DRIFT_SCANS = 1;

/** Mild hull stress pulse per second while drift is active. */
const MONITORING_HULL_PULSE_PER_SEC = 0.009;

/** Mild oxygen drain pulse per second while drift is active. */
const MONITORING_OXYGEN_PULSE_PER_SEC = 0.011;

export function isGrowingOceanMonitoringMission(missionId: string): boolean {
  return missionId === GROWING_OCEAN_ANOMALY_MISSION_ID;
}

export function monitoringDepthProgress(dive: DiveSession): number {
  if (dive.targetDepthM <= 0) return 0;
  return dive.currentDepthM / dive.targetDepthM;
}

export function shouldTriggerMonitoringDrift(dive: DiveSession): boolean {
  if (!isGrowingOceanMonitoringMission(dive.missionId)) return false;
  return monitoringDepthProgress(dive) >= MONITORING_DRIFT_DEPTH_FRACTION;
}

export function evaluateGrowingOceanMonitoringObjectives(dive: DiveSession): boolean {
  if (!isGrowingOceanMonitoringMission(dive.missionId)) return false;
  const depthOk = monitoringDepthProgress(dive) >= MONITORING_DRIFT_DEPTH_FRACTION;
  const baselineOk = (dive.monitoringBaselineScans ?? 0) >= MONITORING_MIN_BASELINE_SCANS;
  const driftOk = (dive.monitoringDriftScans ?? 0) >= MONITORING_MIN_DRIFT_SCANS;
  const driftSeen = Boolean(dive.monitoringDriftActive);
  return depthOk && baselineOk && driftOk && driftSeen && dive.status === 'success';
}

export function buildGrowingOceanMonitoringDebrief(dive: DiveSession): {
  monitoringComplete: boolean;
  headline: string;
  summaryLine: string;
} {
  const complete = evaluateGrowingOceanMonitoringObjectives(dive);
  if (complete) {
    return {
      monitoringComplete: true,
      headline: 'Passive monitoring complete — phenomenon no longer isolated',
      summaryLine:
        'DBX-07 returned with repeatable monitoring readings. Command confirms the signal pattern is appearing outside the DBX-03 loss zone. Research cannot classify the source — biological, mechanical, and environmental models all fail correlation. Sensor drift is consistent enough to be operationally significant. No explanation has been issued.',
    };
  }
  return {
    monitoringComplete: false,
    headline: 'Monitoring incomplete — insufficient drift-window data',
    summaryLine:
      'DBX-07 surfaced before baseline and post-drift scan requirements were met. Command notes the expanding footprint remains unverified in the field record.',
  };
}

function driftStartEvent(now: number): GameEvent {
  return {
    id: createId('evt'),
    type: 'special_signal',
    message:
      'MONITORING DRIFT — passive array reports DBX-03 interval signatures on bearings outside the loss zone. Readings repeat with stable checksum, unstable origin.',
    timestamp: now,
  };
}

function driftAmbientEvent(now: number): GameEvent | null {
  const variants = [
    'Signal drift — contact bearing shifts 12° without corresponding vessel motion.',
    'Scan contradiction — prior baseline frame checksum matches current packet with different latency.',
    'Ocean watch — gravimetry overlay flickers between open water and structured echo.',
  ];
  const idx = Math.floor((now / 53_000) % variants.length);
  return {
    id: createId('evt'),
    type: 'special_signal',
    message: variants[idx]!,
    timestamp: now,
  };
}

/** Advance monitoring drift state during an active growing-ocean dive tick. */
export function applyGrowingOceanMonitoringTick(p: {
  dive: DiveSession;
  mission: Mission;
  deltaMs: number;
  now: number;
}): DiveSession {
  const { dive, mission, deltaMs, now } = p;
  if (dive.status !== 'active' || !isGrowingOceanMonitoringMission(mission.id)) return dive;

  let next: DiveSession = { ...dive };
  let eventLog = [...dive.eventLog];

  if (shouldTriggerMonitoringDrift(next) && !next.monitoringDriftActive) {
    next = {
      ...next,
      monitoringDriftActive: true,
      monitoringDriftLogged: true,
    };
    eventLog = [...eventLog, driftStartEvent(now)];
  }

  if (next.monitoringDriftActive) {
    const dtSec = deltaMs / 1000;
    next = {
      ...next,
      hullIntegrityPercent: Math.max(
        0,
        next.hullIntegrityPercent - MONITORING_HULL_PULSE_PER_SEC * dtSec,
      ),
      oxygenPercent: Math.max(0, next.oxygenPercent - MONITORING_OXYGEN_PULSE_PER_SEC * dtSec),
    };
    const mProg = missionProgress(next);
    if (mProg > 0.45 && mProg < 0.92 && deltaMs >= 12_000) {
      const ambient = driftAmbientEvent(now);
      if (ambient && eventLog.every((e) => e.message !== ambient.message)) {
        eventLog = [...eventLog, ambient];
      }
    }
  }

  if (eventLog !== dive.eventLog) {
    next = { ...next, eventLog };
  }
  return next;
}

/** Record baseline or post-drift monitoring scans. */
export function recordGrowingOceanMonitoringScan(dive: DiveSession): DiveSession {
  if (!isGrowingOceanMonitoringMission(dive.missionId)) return dive;

  if (dive.monitoringDriftActive) {
    return {
      ...dive,
      monitoringDriftScans: (dive.monitoringDriftScans ?? 0) + 1,
    };
  }

  if (monitoringDepthProgress(dive) >= MONITORING_ZONE_DEPTH_FRACTION) {
    return {
      ...dive,
      monitoringBaselineScans: (dive.monitoringBaselineScans ?? 0) + 1,
    };
  }

  return dive;
}

/** Lock / status copy for Growing Ocean Anomaly mission card. */
export function growingOceanMissionLockCopy(state: GameState): string {
  if (state.completedSpineEvents.includes('growing_ocean_anomaly')) {
    return 'Passive monitoring complete — readings logged under restricted classification.';
  }
  if (!state.completedSpineEvents.includes('first_anomaly_contact')) {
    return 'First anomaly contact not confirmed — complete Return to DBX-03 Site.';
  }
  if (!hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) {
    return 'First Contact Analysis incomplete — command review pending.';
  }
  if (!hasStoryFlag(state, STORY_FLAG_ANOMALY_MONITORING_PREP)) {
    return 'Monitoring protocol not authorized — complete analysis authorization first.';
  }
  return 'Complete prior story requirements to unlock.';
}

function isGrowingOceanMissionUnlocked(state: GameState): boolean {
  if (state.canonEra !== 'anomaly_growth') return false;
  if (state.revealLevel < REVEAL_LEVEL.ANOMALY_GROWTH) return false;
  if (!state.completedSpineEvents.includes('first_anomaly_contact')) return false;
  if (!state.completedSpineEvents.includes('return_to_dbx03_site')) return false;
  if (!hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) return false;
  if (!hasStoryFlag(state, STORY_FLAG_ANOMALY_MONITORING_PREP)) return false;
  return true;
}

export function growingOceanMissionActionCopy(state: GameState): string {
  if (state.completedSpineEvents.includes('growing_ocean_anomaly')) {
    return 'Review briefing';
  }
  if (isGrowingOceanMissionUnlocked(state)) {
    return 'Launch monitoring dive';
  }
  if (!hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) {
    return 'Analysis pending';
  }
  if (!hasStoryFlag(state, STORY_FLAG_ANOMALY_MONITORING_PREP)) {
    return 'Monitoring unauthorized';
  }
  return 'Locked';
}

export { isGrowingOceanMissionUnlocked };
