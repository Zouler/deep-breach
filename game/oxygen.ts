import type { DiveRoute, Mission } from '@/types';

import { getCommandIntentModifiers } from '@/game/navigationIntent';
import { moduleLevel, riskScalar } from '@/game/submarineStats';
import type { Submarine } from '@/types';

/**
 * Baseline oxygen loss rate (% of full reserves per second) at reference conditions:
 * low risk scalar ~0.75, no flooding, mid oxygen efficiency, neutral route.
 * Tuned so low-risk ~3–4 min missions stay readable (~25–40% O₂ used) while still mattering.
 */
export const OXYGEN_BASE_DRAIN_PER_SEC = 0.00042;

export type OxygenTickContext = {
  mission: Mission;
  submarine: Submarine;
  waterLevelPercent: number;
  route: DiveRoute;
  /** When set (e.g. from dive tick), skips a second lookup — keeps intent in sync. */
  oxygenIntentMultiplier?: number;
};

/**
 * Returns oxygen percent points to subtract for this interval (positive number).
 */
export function computeOxygenDrainPercent(deltaMs: number, ctx: OxygenTickContext): number {
  if (deltaMs <= 0) return 0;
  const dtSec = deltaMs / 1000;
  const rs = riskScalar(ctx.mission.risk);
  const flood = ctx.waterLevelPercent / 100;
  const oxyLv = moduleLevel(ctx.submarine, 'oxygen');
  /** Stronger plant = lower drain; level 1 ≈ 0.65 eff, level 6 ≈ 1.05 */
  const eff = 0.55 + oxyLv * 0.1;
  const efficiencyMitigation = Math.max(0.18, 1.05 - eff * 0.72);
  const routeMul =
    ctx.oxygenIntentMultiplier ?? getCommandIntentModifiers(ctx.route).oxygenDrainMultiplier;
  const drain =
    OXYGEN_BASE_DRAIN_PER_SEC *
    dtSec *
    rs *
    routeMul *
    efficiencyMitigation *
    (1 + flood * 1.35);
  return drain * 100;
}

export function emergencyOxygenRestorePercent(submarine: Submarine): number {
  const lv = moduleLevel(submarine, 'oxygen');
  return Math.min(32, 15 + lv * 2.5);
}

export function emergencyOxygenMaxCharges(submarine: Submarine): number {
  const lv = moduleLevel(submarine, 'oxygen');
  return Math.min(4, 1 + Math.floor(Math.max(0, lv - 1) / 2));
}

/** One-shot bottled O₂ used before drawing on built-in emergency reserves. */
export function oxygenCanisterRestorePercent(): number {
  return 22;
}
