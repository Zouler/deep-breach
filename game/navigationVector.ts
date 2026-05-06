import type { CommandIntentModifiers } from '@/game/navigationIntent';
import type {
  DiveRoute,
  DiveSession,
  HorizontalMovementState,
  VerticalMovementState,
} from '@/types';

/** ~0.17 km/min forward/sweep at multiplier 1.0 — abstract track space. */
export const BASE_HORIZONTAL_KM_PER_MS = 2.8e-6;

const SMOOTH_ALPHA = 0.14;

export function horizontalKmPerMinute(modifiers: CommandIntentModifiers): number {
  return BASE_HORIZONTAL_KM_PER_MS * modifiers.horizontalSpeedMultiplier * 60_000;
}

export function deriveVerticalMovementState(
  descentMPerMin: number,
  route: DiveRoute,
): VerticalMovementState {
  const nearZero = Math.abs(descentMPerMin) < 1.25;
  if (nearZero && route === 'stabilize_systems') return 'holding_depth';
  if (nearZero) return 'holding_depth';
  if (descentMPerMin < -0.75) return 'ascending';
  return 'descending';
}

export function deriveHorizontalMovementState(route: DiveRoute): HorizontalMovementState {
  switch (route) {
    case 'avoid_hazards':
      return 'drifting';
    case 'stabilize_systems':
      return 'holding_position';
    case 'push_deeper':
    case 'search_salvage':
    case 'follow_signal':
    default:
      return 'advancing';
  }
}

export function formatVerticalLabel(v: VerticalMovementState): string {
  switch (v) {
    case 'ascending':
      return '↑ Ascending';
    case 'holding_depth':
      return '◌ Holding depth';
    default:
      return '↓ Descending';
  }
}

export function formatHorizontalLabel(h: HorizontalMovementState): string {
  switch (h) {
    case 'reversing':
      return '← Reversing';
    case 'holding_position':
      return '● Holding position';
    case 'drifting':
      return '↝ Drifting (evasive)';
    default:
      return '→ Advancing';
  }
}

export type NavigationKinematicsUpdate = Pick<
  DiveSession,
  | 'horizontalDistanceKm'
  | 'verticalMovementState'
  | 'horizontalMovementState'
  | 'descentRateMPerMin'
  | 'horizontalSpeedKmPerMin'
>;

export function tickNavigationKinematics(
  dive: DiveSession,
  deltaMs: number,
  depthDeltaM: number,
  modifiers: CommandIntentModifiers,
): NavigationKinematicsUpdate {
  const dt = Math.max(0, deltaMs);
  const horizontalDeltaKm =
    dt > 0 ? BASE_HORIZONTAL_KM_PER_MS * modifiers.horizontalSpeedMultiplier * dt : 0;
  const horizontalDistanceKm = dive.horizontalDistanceKm + horizontalDeltaKm;

  const instantDescentMPerMin = dt > 0 ? (depthDeltaM / dt) * 60_000 : 0;
  const targetHorizKmPerMin = horizontalKmPerMinute(modifiers);

  const descentRateMPerMin =
    dive.descentRateMPerMin * (1 - SMOOTH_ALPHA) + instantDescentMPerMin * SMOOTH_ALPHA;
  const horizontalSpeedKmPerMin =
    dive.horizontalSpeedKmPerMin * (1 - SMOOTH_ALPHA) + targetHorizKmPerMin * SMOOTH_ALPHA;

  const verticalMovementState = deriveVerticalMovementState(instantDescentMPerMin, dive.currentRoute);
  const horizontalMovementState = deriveHorizontalMovementState(dive.currentRoute);

  return {
    horizontalDistanceKm,
    verticalMovementState,
    horizontalMovementState,
    descentRateMPerMin,
    horizontalSpeedKmPerMin,
  };
}
