import type { DiveSession, Mission, RiskLevel } from '@/types';

/** First ~40s: tutorial-safe, low severity only. */
export const EARLY_MISSION_GRACE_MS = 42_000;

/** Do not roll random critical cracks until depth reaches this fraction of target. */
export const CRITICAL_CRACK_MIN_DEPTH_PROGRESS = 0.36;

/** Also gate critical cracks by mission clock progress. */
export const CRITICAL_CRACK_MIN_MISSION_PROGRESS = 0.22;

/** Cooldown ranges between crack spawns (ms), by contract risk. */
export const CRACK_COOLDOWN_BY_RISK: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 48_000, max: 78_000 },
  medium: { min: 34_000, max: 62_000 },
  'medium-high': { min: 28_000, max: 52_000 },
  high: { min: 22_000, max: 44_000 },
};

/** Ambient / narrative event spacing (ms). */
export const AMBIENT_COOLDOWN_BY_RISK: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 45_000, max: 75_000 },
  medium: { min: 30_000, max: 60_000 },
  'medium-high': { min: 26_000, max: 52_000 },
  high: { min: 20_000, max: 45_000 },
};

/** External discovery offers (ms) — separate from ambient so UI stays readable. */
export const DISCOVERY_OFFER_COOLDOWN_BY_RISK: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 58_000, max: 95_000 },
  medium: { min: 42_000, max: 72_000 },
  'medium-high': { min: 34_000, max: 60_000 },
  high: { min: 28_000, max: 52_000 },
};

export const MAX_ACTIVE_CRACKS_BY_RISK: Record<RiskLevel, number> = {
  low: 4,
  medium: 5,
  'medium-high': 6,
  high: 7,
};

/**
 * How long an unaddressed 'moderate' crack can persist before it worsens to
 * 'critical', by contract risk. Gives ignoring damage a real cost instead of
 * only ever getting worse through random rolls.
 */
export const CRACK_ESCALATION_MS_BY_RISK: Record<RiskLevel, number> = {
  low: 70_000,
  medium: 55_000,
  'medium-high': 45_000,
  high: 36_000,
};

/** Warn the player once a crack is this far into its escalation window, unrepaired. */
export const CRACK_ESCALATION_WARNING_FRACTION = 0.6;

export function missionElapsedMs(dive: DiveSession): number {
  return dive.missionElapsedMs;
}

export function depthProgress(dive: DiveSession): number {
  if (dive.targetDepthM <= 0) return 0;
  return Math.min(1, dive.currentDepthM / dive.targetDepthM);
}

export function missionProgress(dive: DiveSession): number {
  if (dive.missionDurationMs <= 0) return 0;
  return Math.min(1, dive.missionElapsedMs / dive.missionDurationMs);
}

export function inEarlyGracePeriod(dive: DiveSession, now: number): boolean {
  return now - dive.startedAt < EARLY_MISSION_GRACE_MS;
}

export function countCriticalCracks(dive: DiveSession): number {
  return dive.rooms.reduce(
    (n, r) => n + r.cracks.filter((c) => c.severity === 'critical').length,
    0,
  );
}

export function countTotalCracks(dive: DiveSession): number {
  return dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
}

export function hasUnresolvedHighStress(dive: DiveSession): boolean {
  if (countCriticalCracks(dive) > 0) return true;
  if (dive.hullIntegrityPercent < 38) return true;
  if (dive.oxygenPercent < 32) return true;
  if (dive.waterLevelPercent > 48) return true;
  const dangerRooms = dive.rooms.filter((r) => r.status === 'flooding' || r.cracks.length >= 2);
  return dangerRooms.length >= 2;
}

export function rollGapMs(
  range: { min: number; max: number },
  depthFrac: number,
  missionFrac: number,
): number {
  const ramp = 1.05 - 0.35 * (0.55 * depthFrac + 0.45 * missionFrac);
  const base = range.min + Math.random() * Math.max(1, range.max - range.min);
  return Math.max(range.min * 0.85, base * ramp);
}

export function canOfferDiscovery(dive: DiveSession, mission: Mission, now: number): boolean {
  if (dive.pendingDiscovery) return false;
  if (dive.status !== 'active') return false;
  return now - dive.lastDiscoveryOfferAt >= dive.nextDiscoveryGapMs;
}

export function canSpawnAmbient(dive: DiveSession, mission: Mission, now: number): boolean {
  if (dive.status !== 'active') return false;
  if (dive.pendingDiscovery) return false;
  return now - dive.lastAmbientAt >= dive.nextAmbientGapMs;
}

export function canSpawnCrack(dive: DiveSession, mission: Mission, now: number): boolean {
  if (dive.status !== 'active') return false;
  if (dive.pendingDiscovery) return false;
  const cap = MAX_ACTIVE_CRACKS_BY_RISK[mission.risk] ?? 5;
  if (countTotalCracks(dive) >= cap) return false;
  if (hasUnresolvedHighStress(dive) && countCriticalCracks(dive) > 0) {
    return now - dive.lastCrackSpawnAt >= dive.nextCrackGapMs * 1.65;
  }
  return now - dive.lastCrackSpawnAt >= dive.nextCrackGapMs;
}

export function criticalRandomAllowed(dive: DiveSession): boolean {
  if (countCriticalCracks(dive) > 0) return false;
  return (
    depthProgress(dive) >= CRITICAL_CRACK_MIN_DEPTH_PROGRESS &&
    missionProgress(dive) >= CRITICAL_CRACK_MIN_MISSION_PROGRESS
  );
}

export function initializePacingGaps(dive: DiveSession, mission: Mission): DiveSession {
  const d = depthProgress(dive);
  const m = missionProgress(dive);
  return {
    ...dive,
    lastCrackSpawnAt: dive.startedAt,
    lastAmbientAt: dive.startedAt,
    lastDiscoveryOfferAt: dive.startedAt + 12_000,
    nextCrackGapMs: rollGapMs(CRACK_COOLDOWN_BY_RISK[mission.risk], d, m),
    nextAmbientGapMs: rollGapMs(AMBIENT_COOLDOWN_BY_RISK[mission.risk], d, m),
    nextDiscoveryGapMs: rollGapMs(DISCOVERY_OFFER_COOLDOWN_BY_RISK[mission.risk], d, m),
  };
}

export function refreshGapAfterCrack(dive: DiveSession, mission: Mission): DiveSession {
  const d = depthProgress(dive);
  const m = missionProgress(dive);
  return {
    ...dive,
    nextCrackGapMs: rollGapMs(CRACK_COOLDOWN_BY_RISK[mission.risk], d, m),
  };
}

export function refreshGapAfterAmbient(dive: DiveSession, mission: Mission): DiveSession {
  const d = depthProgress(dive);
  const m = missionProgress(dive);
  return {
    ...dive,
    nextAmbientGapMs: rollGapMs(AMBIENT_COOLDOWN_BY_RISK[mission.risk], d, m),
  };
}

export function refreshGapAfterDiscoveryOffer(dive: DiveSession, mission: Mission): DiveSession {
  const d = depthProgress(dive);
  const m = missionProgress(dive);
  return {
    ...dive,
    nextDiscoveryGapMs: rollGapMs(DISCOVERY_OFFER_COOLDOWN_BY_RISK[mission.risk], d, m),
  };
}
