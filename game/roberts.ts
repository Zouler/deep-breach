/**
 * Commander Phillip Roberts — persistent RPG protagonist state.
 * @see docs/source-of-truth/deep-breach-story-canon-sot-v0.2.md
 */

export type CommandStance =
  | 'cautious'
  | 'aggressive'
  | 'compassionate'
  | 'procedural'
  | 'obsessive';

export const COMMAND_STANCES: readonly CommandStance[] = [
  'cautious',
  'aggressive',
  'compassionate',
  'procedural',
  'obsessive',
] as const;

export interface RobertsState {
  commandReputation: number;
  crewTrust: number;
  familyStrain: number;
  stress: number;
  obsession: number;
  stanceHistory: Record<CommandStance, number>;
}

export type RobertsNumericField = keyof Omit<RobertsState, 'stanceHistory'>;

export const ROBERTS_VALUE_MIN = 0;
export const ROBERTS_VALUE_MAX = 100;
export const ROBERTS_DELTA_MIN = -5;
export const ROBERTS_DELTA_MAX = 5;

const ROBERTS_NUMERIC_FIELDS: readonly RobertsNumericField[] = [
  'commandReputation',
  'crewTrust',
  'familyStrain',
  'stress',
  'obsession',
];

export const DEFAULT_STANCE_HISTORY: Record<CommandStance, number> = {
  cautious: 0,
  aggressive: 0,
  compassionate: 0,
  procedural: 0,
  obsessive: 0,
};

export const DEFAULT_ROBERTS_STATE: RobertsState = {
  commandReputation: 50,
  crewTrust: 50,
  familyStrain: 0,
  stress: 0,
  obsession: 0,
  stanceHistory: { ...DEFAULT_STANCE_HISTORY },
};

/** Stable tie-break order when stance counts are equal. */
export const STANCE_TIE_PRIORITY: readonly CommandStance[] = [
  'procedural',
  'cautious',
  'compassionate',
  'aggressive',
  'obsessive',
];

export function createDefaultRobertsState(): RobertsState {
  return {
    ...DEFAULT_ROBERTS_STATE,
    stanceHistory: { ...DEFAULT_STANCE_HISTORY },
  };
}

export function clampRobertsValue(value: number): number {
  if (!Number.isFinite(value)) return ROBERTS_VALUE_MIN;
  return Math.max(ROBERTS_VALUE_MIN, Math.min(ROBERTS_VALUE_MAX, value));
}

export function clampRobertsDelta(delta: number): number {
  if (!Number.isFinite(delta)) return 0;
  return Math.max(ROBERTS_DELTA_MIN, Math.min(ROBERTS_DELTA_MAX, delta));
}

export function applyRobertsDelta(
  state: RobertsState,
  delta: Partial<Record<RobertsNumericField, number>>,
): RobertsState {
  const next: RobertsState = {
    ...state,
    stanceHistory: { ...state.stanceHistory },
  };
  for (const field of ROBERTS_NUMERIC_FIELDS) {
    const raw = delta[field];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    next[field] = clampRobertsValue(state[field] + clampRobertsDelta(raw));
  }
  return next;
}

export function incrementStanceHistory(
  state: RobertsState,
  stance: CommandStance,
): RobertsState {
  return {
    ...state,
    stanceHistory: {
      ...state.stanceHistory,
      [stance]: state.stanceHistory[stance] + 1,
    },
  };
}

export function getDominantCommandStance(state: RobertsState): CommandStance {
  const maxCount = Math.max(...COMMAND_STANCES.map((s) => state.stanceHistory[s]));
  if (maxCount === 0) return 'procedural';
  for (const stance of STANCE_TIE_PRIORITY) {
    if (state.stanceHistory[stance] === maxCount) return stance;
  }
  return 'procedural';
}

export function isCommandStance(value: string): value is CommandStance {
  return (COMMAND_STANCES as readonly string[]).includes(value);
}

export function normalizeRobertsState(value: unknown): RobertsState {
  if (!value || typeof value !== 'object') {
    return createDefaultRobertsState();
  }
  const raw = value as Partial<RobertsState>;
  const defaults = createDefaultRobertsState();
  const stanceHistory = { ...defaults.stanceHistory };
  if (raw.stanceHistory && typeof raw.stanceHistory === 'object') {
    for (const stance of COMMAND_STANCES) {
      const count = (raw.stanceHistory as Record<string, unknown>)[stance];
      if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
        stanceHistory[stance] = Math.floor(count);
      }
    }
  }
  return {
    commandReputation: clampRobertsValue(
      typeof raw.commandReputation === 'number'
        ? raw.commandReputation
        : defaults.commandReputation,
    ),
    crewTrust: clampRobertsValue(
      typeof raw.crewTrust === 'number' ? raw.crewTrust : defaults.crewTrust,
    ),
    familyStrain: clampRobertsValue(
      typeof raw.familyStrain === 'number' ? raw.familyStrain : defaults.familyStrain,
    ),
    stress: clampRobertsValue(typeof raw.stress === 'number' ? raw.stress : defaults.stress),
    obsession: clampRobertsValue(
      typeof raw.obsession === 'number' ? raw.obsession : defaults.obsession,
    ),
    stanceHistory,
  };
}

export type RobertsDeltaPayload = Partial<Record<RobertsNumericField, number>>;

export function applyRobertsUpdate(
  state: RobertsState,
  update: { delta?: RobertsDeltaPayload; stance?: CommandStance },
): RobertsState {
  let next = state;
  if (update.delta && Object.keys(update.delta).length > 0) {
    next = applyRobertsDelta(next, update.delta);
  }
  if (update.stance && isCommandStance(update.stance)) {
    next = incrementStanceHistory(next, update.stance);
  }
  return next;
}

export function robertsStateEquals(a: RobertsState, b: RobertsState): boolean {
  if (
    a.commandReputation !== b.commandReputation ||
    a.crewTrust !== b.crewTrust ||
    a.familyStrain !== b.familyStrain ||
    a.stress !== b.stress ||
    a.obsession !== b.obsession
  ) {
    return false;
  }
  return COMMAND_STANCES.every((s) => a.stanceHistory[s] === b.stanceHistory[s]);
}
