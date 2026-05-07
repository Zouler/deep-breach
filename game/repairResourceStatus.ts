import type { BaseStorage, DiveSession, RepairItem } from '@/types';

/** Hull field-repair tools only (not oxygen canisters). */
export const HULL_REPAIR_TEMPLATE_IDS = ['patch_kit', 'pressure_sealant', 'brace_frame'] as const;

export type HullRepairTemplateId = (typeof HULL_REPAIR_TEMPLATE_IDS)[number];

export type RepairStockStatus = 'healthy' | 'low' | 'empty' | 'critical_empty';

export function countActiveCracks(dive: DiveSession): number {
  return dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
}

/** Sum quantities of hull repair tools in expedition inventory. */
export function countHullRepairUnitsInExpedition(inv: RepairItem[] | undefined): number {
  if (!inv?.length) return 0;
  let n = 0;
  for (const id of HULL_REPAIR_TEMPLATE_IDS) {
    n += inv.find((x) => x.id === id)?.quantity ?? 0;
  }
  return n;
}

export function getRepairStockStatus(dive: DiveSession): RepairStockStatus {
  const units = countHullRepairUnitsInExpedition(dive.expeditionRepairInventory);
  const cracks = countActiveCracks(dive);
  if (units <= 0 && cracks > 0) return 'critical_empty';
  if (units <= 0) return 'empty';
  if (units === 1) return 'low';
  return 'healthy';
}

export function repairStockStatusRank(s: RepairStockStatus): number {
  switch (s) {
    case 'healthy':
      return 0;
    case 'low':
      return 1;
    case 'empty':
      return 2;
    case 'critical_empty':
      return 3;
    default:
      return 0;
  }
}

/** Primary dive HUD line for repair awareness. */
export function repairStockHudLine(status: RepairStockStatus, units: number): string {
  switch (status) {
    case 'healthy':
      return `Repair stock: ${units} (hull kits)`;
    case 'low':
      return 'Repair stock: Low (1 hull kit)';
    case 'empty':
      return 'Repair stock: Empty';
    case 'critical_empty':
      return 'No repair stock — active breach';
    default:
      return `Repair stock: ${units}`;
  }
}

/** Base drydock: hull tools in Base Storage (not O₂). */
export function countHullRepairUnitsInBaseStorage(bs: BaseStorage): number {
  return bs.hullPatchKits + bs.pressureSealant + bs.emergencyBrace;
}

export function getBaseRepairStockStatus(bs: BaseStorage): RepairStockStatus {
  const u = countHullRepairUnitsInBaseStorage(bs);
  if (u <= 0) return 'empty';
  if (u === 1) return 'low';
  return 'healthy';
}
