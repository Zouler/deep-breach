import {
  OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
} from '@/data/missions';
import { createId } from '@/game/ids';
import { missionProgress } from '@/game/pacing';
import type { DiveSession, GameEvent, Mission } from '@/types';

/** Depth fraction where interference begins during return dive. */
export const ANOMALY_INTERFERENCE_DEPTH_FRACTION = 0.55;

/** Minimum contact depth as fraction of mission target. */
export const ANOMALY_CONTACT_MIN_DEPTH_FRACTION = 0.85;

/** Scans required after interference begins. */
export const ANOMALY_CONTACT_MIN_SCANS = 1;

/** Small hull stress pulse per second while in interference zone. */
const ANOMALY_HULL_PULSE_PER_SEC = 0.014;

export function isAnomalyContactMission(missionId: string): boolean {
  return missionId === OPERATION_DEAD_BEACON_RETURN_MISSION_ID;
}

export function anomalyDepthProgress(dive: DiveSession): number {
  if (dive.targetDepthM <= 0) return 0;
  return dive.currentDepthM / dive.targetDepthM;
}

export function shouldTriggerFirstContact(dive: DiveSession): boolean {
  if (!isAnomalyContactMission(dive.missionId)) return false;
  return anomalyDepthProgress(dive) >= ANOMALY_INTERFERENCE_DEPTH_FRACTION;
}

export function evaluateAnomalyContactObjectives(dive: DiveSession): boolean {
  if (!isAnomalyContactMission(dive.missionId)) return false;
  const depthOk = dive.currentDepthM >= dive.targetDepthM * ANOMALY_CONTACT_MIN_DEPTH_FRACTION;
  const scanOk = (dive.anomalyContactScans ?? 0) >= ANOMALY_CONTACT_MIN_SCANS;
  const interferenceSeen = Boolean(dive.anomalyInterferenceActive);
  return depthOk && scanOk && interferenceSeen && dive.status === 'success';
}

export function buildAnomalyContactDebrief(dive: DiveSession): {
  firstContactComplete: boolean;
  headline: string;
  summaryLine: string;
} {
  const complete = evaluateAnomalyContactObjectives(dive);
  if (complete) {
    return {
      firstContactComplete: true,
      headline: 'First anomaly contact — phenomenon confirmed unexplained',
      summaryLine:
        'DBX-07 returned from the DBX-03 loss zone with controlled readings that Command classifies as first contact with an unexplained phenomenon. Sensor data is contradictory: hull strain does not match external pressure models, acoustic logs show duplicated timestamps, and several telemetry packets arrived with impossible latency. Research has flagged the dataset restricted. No recovery of DBX-03 was attempted or authorized.',
    };
  }
  return {
    firstContactComplete: false,
    headline: 'Return incomplete — insufficient contact-zone data',
    summaryLine:
      'DBX-07 surfaced before contact-depth and post-interference scan requirements were met. Command notes the DBX-03 site remains logged as unverified in the field record. The anomaly contact spine is not confirmed.',
  };
}

function firstContactEvent(now: number): GameEvent {
  return {
    id: createId('evt'),
    type: 'special_signal',
    message:
      'ANOMALY CONTACT — sonar return duplicated; external pressure readings disagree with hull strain. Contact zone interference confirmed.',
    timestamp: now,
  };
}

function interferenceAmbientEvent(now: number): GameEvent | null {
  const variants = [
    'Ghost signal — DBX-03 authentication header detected on passive array. Source bearing unstable.',
    'Scan instability — contact classification flickering between wreckage echo and open water.',
    'Sensor interference — radar overlay desynced; Navigation reports impossible closure rate.',
  ];
  const idx = Math.floor((now / 47_000) % variants.length);
  return {
    id: createId('evt'),
    type: 'special_signal',
    message: variants[idx]!,
    timestamp: now,
  };
}

/** Advance anomaly interference state during an active return dive tick. */
export function applyAnomalyContactTick(p: {
  dive: DiveSession;
  mission: Mission;
  deltaMs: number;
  now: number;
}): DiveSession {
  const { dive, mission, deltaMs, now } = p;
  if (dive.status !== 'active' || !isAnomalyContactMission(mission.id)) return dive;

  let next: DiveSession = { ...dive };
  let eventLog = [...dive.eventLog];

  if (shouldTriggerFirstContact(next) && !next.anomalyInterferenceActive) {
    next = {
      ...next,
      anomalyInterferenceActive: true,
      anomalyFirstContactLogged: true,
    };
    eventLog = [...eventLog, firstContactEvent(now)];
  }

  if (next.anomalyInterferenceActive) {
    const pulse = ANOMALY_HULL_PULSE_PER_SEC * (deltaMs / 1000);
    next = {
      ...next,
      hullIntegrityPercent: Math.max(0, next.hullIntegrityPercent - pulse),
    };
    const mProg = missionProgress(next);
    if (mProg > 0.6 && mProg < 0.95 && deltaMs >= 10_000) {
      const ambient = interferenceAmbientEvent(now);
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

/** Increment post-interference scan count when player scans in the contact zone. */
export function recordAnomalyContactScan(dive: DiveSession): DiveSession {
  if (!isAnomalyContactMission(dive.missionId) || !dive.anomalyInterferenceActive) return dive;
  return {
    ...dive,
    anomalyContactScans: (dive.anomalyContactScans ?? 0) + 1,
  };
}
