import type { BaseStorage, GameState } from '@/types';

import { addRepairToBaseStorage, withSyncedLegacyEconomy } from '@/game/baseStorage';
import {
  BASIC_RESTOCK_SCRAP_COST,
  BASIC_SUPPLIES_TARGETS,
  PARTIAL_HULL_REPAIR_PERCENT,
  SCRAP_PER_HULL_PERCENT,
} from '@/game/economy';

export type SubmarineConditionLabel =
  | 'Pristine'
  | 'Operational'
  | 'Damaged'
  | 'Critical'
  | 'Disabled';

export function getSubmarineConditionLabel(hullPercent: number): SubmarineConditionLabel {
  if (hullPercent >= 100) return 'Pristine';
  if (hullPercent >= 70) return 'Operational';
  if (hullPercent >= 40) return 'Damaged';
  if (hullPercent >= 1) return 'Critical';
  return 'Disabled';
}

export function calculateHullRepairCost(currentHull: number, targetHull: number): number {
  const delta = Math.max(0, Math.min(100, targetHull) - Math.max(0, Math.min(100, currentHull)));
  return Math.ceil(delta * SCRAP_PER_HULL_PERCENT);
}

export function calculatePartialRepairTarget(currentHull: number): number {
  return Math.min(100, currentHull + PARTIAL_HULL_REPAIR_PERCENT);
}

export function canAffordScrap(bs: BaseStorage, cost: number): boolean {
  return bs.scrap >= cost;
}

export type HullRepairResult =
  | { ok: true; newHull: number; scrapSpent: number; message: string }
  | { ok: false; message: string };

export function repairHullToTarget(
  state: GameState,
  targetHull: number,
): { state: GameState; result: HullRepairResult } {
  const hull = state.submarine.hullIntegrityPercent;
  const clampedTarget = Math.max(hull, Math.min(100, targetHull));
  if (clampedTarget <= hull) {
    return {
      state,
      result: { ok: false, message: 'Hull is already at or above that target.' },
    };
  }
  const cost = calculateHullRepairCost(hull, clampedTarget);
  if (!canAffordScrap(state.baseStorage, cost)) {
    return {
      state,
      result: { ok: false, message: 'Not enough Scrap in Base Storage to complete repairs.' },
    };
  }
  const bs: BaseStorage = {
    ...state.baseStorage,
    scrap: state.baseStorage.scrap - cost,
  };
  const next: GameState = {
    ...state,
    baseStorage: bs,
    submarine: {
      ...state.submarine,
      hullIntegrityPercent: clampedTarget,
    },
  };
  const msg =
    clampedTarget >= 100
      ? 'Hull repaired to 100%.'
      : `Hull repaired by ${Math.round(clampedTarget - hull)}%.`;
  return {
    state: withSyncedLegacyEconomy(next),
    result: { ok: true, newHull: clampedTarget, scrapSpent: cost, message: msg },
  };
}

export type RestockBasicResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function describeBasicRestock(state: GameState): {
  canRestock: boolean;
  message: string;
} {
  const bs = state.baseStorage;
  const need =
    bs.hullPatchKits < BASIC_SUPPLIES_TARGETS.hullPatchKits ||
    bs.pressureSealant < BASIC_SUPPLIES_TARGETS.pressureSealant ||
    bs.oxygenCanisters < BASIC_SUPPLIES_TARGETS.oxygenCanisters;
  if (!need) {
    return { canRestock: false, message: 'Basic supplies available.' };
  }
  if (bs.scrap < BASIC_RESTOCK_SCRAP_COST) {
    return {
      canRestock: false,
      message: `Not enough Scrap in Base Storage for the basic kit (${BASIC_RESTOCK_SCRAP_COST}).`,
    };
  }
  return {
    canRestock: true,
    message: `Spend ${BASIC_RESTOCK_SCRAP_COST} scrap to add missing kits to Base Storage.`,
  };
}

/** Adds missing basic kits to Base Storage for a flat scrap fee. */
export function restockBasicSupplies(state: GameState): {
  state: GameState;
  result: RestockBasicResult;
} {
  const bs = state.baseStorage;
  const needPatch = bs.hullPatchKits < BASIC_SUPPLIES_TARGETS.hullPatchKits ? 1 : 0;
  const needSeal = bs.pressureSealant < BASIC_SUPPLIES_TARGETS.pressureSealant ? 1 : 0;
  const needO2 = bs.oxygenCanisters < BASIC_SUPPLIES_TARGETS.oxygenCanisters ? 1 : 0;
  if (needPatch + needSeal + needO2 === 0) {
    return { state, result: { ok: false, message: 'Basic supplies available.' } };
  }
  if (!canAffordScrap(bs, BASIC_RESTOCK_SCRAP_COST)) {
    return {
      state,
      result: {
        ok: false,
        message: `Not enough Scrap for the basic supply kit (${BASIC_RESTOCK_SCRAP_COST}).`,
      },
    };
  }
  let nextBs = { ...bs, scrap: bs.scrap - BASIC_RESTOCK_SCRAP_COST };
  if (needPatch) nextBs = addRepairToBaseStorage(nextBs, 'patch_kit', 1);
  if (needSeal) nextBs = addRepairToBaseStorage(nextBs, 'pressure_sealant', 1);
  if (needO2) nextBs = addRepairToBaseStorage(nextBs, 'oxygen_canister', 1);
  const next: GameState = { ...state, baseStorage: nextBs };
  return {
    state: withSyncedLegacyEconomy(next),
    result: { ok: true, message: 'Restocked missing basic supplies into Base Storage.' },
  };
}
