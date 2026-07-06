/**
 * Canon progression layer — fixed campaign eras, reveal gates, and spine events.
 * @see docs/source-of-truth/deep-breach-story-canon-sot-v0.2.md
 */

export type CanonEra =
  | 'experimental_trials'
  | 'dead_beacon'
  | 'anomaly_growth'
  | 'war'
  | 'collapse'
  | 'aftermath';

/** Ordered campaign eras; index defines forward progression. */
export const CANON_ERA_ORDER: readonly CanonEra[] = [
  'experimental_trials',
  'dead_beacon',
  'anomaly_growth',
  'war',
  'collapse',
  'aftermath',
] as const;

export type RevealLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const REVEAL_LEVEL = {
  NONE: 0,
  IMPOSSIBLE_SIGNAL: 1,
  ANOMALY_CONFIRMED: 2,
  ANOMALY_GROWTH: 3,
  MILITARY_ESCALATION: 4,
  NON_HUMAN_SUSPECTED: 5,
  EXTRATERRESTRIAL_TRUTH: 6,
  COLLAPSE_AFTERMATH: 7,
} as const satisfies Record<string, RevealLevel>;

/** Maximum reveal level allowed while the campaign is in each era. */
export const ERA_REVEAL_CAPS: Record<CanonEra, RevealLevel> = {
  experimental_trials: REVEAL_LEVEL.NONE,
  dead_beacon: REVEAL_LEVEL.ANOMALY_CONFIRMED,
  anomaly_growth: REVEAL_LEVEL.ANOMALY_GROWTH,
  war: REVEAL_LEVEL.NON_HUMAN_SUSPECTED,
  collapse: REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH,
  aftermath: REVEAL_LEVEL.COLLAPSE_AFTERMATH,
};

export type SpineEventId =
  | 'experimental_trials_complete'
  | 'operational_integration'
  | 'dbx03_signal_received'
  | 'operation_dead_beacon'
  | 'dead_beacon_recon_started'
  | 'first_anomaly_contact'
  | 'correct_withdrawal'
  | 'hull_reinforcement_mk1'
  | 'return_to_dbx03_site'
  | 'growing_ocean_anomaly'
  | 'command_pressure'
  | 'abyssal_expansion_models'
  | 'engineering_stress_response'
  | 'military_escalation'
  | 'intergalactic_war'
  | 'civilization_collapse'
  | 'aftermath';

/** Minimum era required before a spine event may be marked complete. */
export const SPINE_EVENT_ERA: Record<SpineEventId, CanonEra> = {
  experimental_trials_complete: 'experimental_trials',
  operational_integration: 'experimental_trials',
  dbx03_signal_received: 'dead_beacon',
  operation_dead_beacon: 'dead_beacon',
  dead_beacon_recon_started: 'dead_beacon',
  first_anomaly_contact: 'dead_beacon',
  correct_withdrawal: 'dead_beacon',
  hull_reinforcement_mk1: 'dead_beacon',
  return_to_dbx03_site: 'dead_beacon',
  growing_ocean_anomaly: 'anomaly_growth',
  command_pressure: 'anomaly_growth',
  abyssal_expansion_models: 'anomaly_growth',
  engineering_stress_response: 'anomaly_growth',
  military_escalation: 'war',
  intergalactic_war: 'war',
  civilization_collapse: 'collapse',
  aftermath: 'aftermath',
};

export const DEFAULT_CANON_ERA: CanonEra = 'experimental_trials';
export const DEFAULT_REVEAL_LEVEL: RevealLevel = REVEAL_LEVEL.NONE;
export const DEFAULT_COMPLETED_SPINE_EVENTS: string[] = [];

export function eraIndex(era: CanonEra): number {
  return CANON_ERA_ORDER.indexOf(era);
}

export function isEraUnlocked(currentEra: CanonEra, requiredEra: CanonEra): boolean {
  return eraIndex(currentEra) >= eraIndex(requiredEra);
}

export function getEraRevealCap(era: CanonEra): RevealLevel {
  return ERA_REVEAL_CAPS[era];
}

export function clampRevealLevelForEra(era: CanonEra, revealLevel: number): RevealLevel {
  const cap = getEraRevealCap(era);
  const clamped = Math.max(REVEAL_LEVEL.NONE, Math.min(revealLevel, cap));
  return clamped as RevealLevel;
}

export function canReveal(
  currentEra: CanonEra,
  currentRevealLevel: number,
  requiredRevealLevel: RevealLevel,
): boolean {
  if (requiredRevealLevel > getEraRevealCap(currentEra)) return false;
  return currentRevealLevel >= requiredRevealLevel;
}

/** Era may only advance one step forward along CANON_ERA_ORDER. */
export function canAdvanceToEra(currentEra: CanonEra, nextEra: CanonEra): boolean {
  return eraIndex(nextEra) === eraIndex(currentEra) + 1;
}

export function isValidSpineEventForEra(eventId: SpineEventId, currentEra: CanonEra): boolean {
  return isEraUnlocked(currentEra, SPINE_EVENT_ERA[eventId]);
}

export function isSpineEventId(value: string): value is SpineEventId {
  return Object.prototype.hasOwnProperty.call(SPINE_EVENT_ERA, value);
}

export function normalizeCanonEra(value: unknown): CanonEra {
  if (typeof value === 'string' && (CANON_ERA_ORDER as readonly string[]).includes(value)) {
    return value as CanonEra;
  }
  return DEFAULT_CANON_ERA;
}

export function normalizeCompletedSpineEvents(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item) continue;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
