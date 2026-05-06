import type { BaseStorage, GameState, RepairItem, Treasure } from '@/types';

import { REPAIR_ITEM_TEMPLATES } from '@/data/repairItems';
import {
  ARTIFACT_ANALYZE_RESEARCH,
  SAMPLE_ANALYZE_RESEARCH,
  TREASURE_SALVAGE_SCRAP_COMMON,
  TREASURE_SALVAGE_SCRAP_RARE,
} from '@/game/economy';

export function createEmptyBaseStorage(): BaseStorage {
  return {
    scrap: 0,
    researchData: 0,
    treasures: [],
    artifacts: 0,
    samples: 0,
    hullPatchKits: 0,
    pressureSealant: 0,
    emergencyBrace: 0,
    oxygenCanisters: 0,
  };
}

export function repairQuantityFromBaseStorage(bs: BaseStorage, templateId: string): number {
  switch (templateId) {
    case 'patch_kit':
      return bs.hullPatchKits;
    case 'pressure_sealant':
      return bs.pressureSealant;
    case 'brace_frame':
      return bs.emergencyBrace;
    case 'oxygen_canister':
      return bs.oxygenCanisters;
    default:
      return 0;
  }
}

export function repairInventoryFromBaseStorage(bs: BaseStorage): RepairItem[] {
  return REPAIR_ITEM_TEMPLATES.map((t) => ({
    ...t,
    quantity: repairQuantityFromBaseStorage(bs, t.id),
  }));
}

export function addRepairToBaseStorage(
  bs: BaseStorage,
  templateId: string,
  delta: number,
): BaseStorage {
  if (delta <= 0) return bs;
  switch (templateId) {
    case 'patch_kit':
      return { ...bs, hullPatchKits: bs.hullPatchKits + delta };
    case 'pressure_sealant':
      return { ...bs, pressureSealant: bs.pressureSealant + delta };
    case 'brace_frame':
      return { ...bs, emergencyBrace: bs.emergencyBrace + delta };
    case 'oxygen_canister':
      return { ...bs, oxygenCanisters: bs.oxygenCanisters + delta };
    default:
      return bs;
  }
}

export function consumeRepairFromBaseStorage(
  bs: BaseStorage,
  templateId: string,
  amount: number,
): BaseStorage | null {
  if (amount <= 0) return bs;
  const q = repairQuantityFromBaseStorage(bs, templateId);
  if (q < amount) return null;
  switch (templateId) {
    case 'patch_kit':
      return { ...bs, hullPatchKits: bs.hullPatchKits - amount };
    case 'pressure_sealant':
      return { ...bs, pressureSealant: bs.pressureSealant - amount };
    case 'brace_frame':
      return { ...bs, emergencyBrace: bs.emergencyBrace - amount };
    case 'oxygen_canister':
      return { ...bs, oxygenCanisters: bs.oxygenCanisters - amount };
    default:
      return null;
  }
}

/** Merge migrated repair rows into numeric base storage fields. */
export function baseStorageFromRepairRows(
  bs: BaseStorage,
  rows: RepairItem[],
): BaseStorage {
  let next = { ...bs };
  for (const r of rows) {
    next = addRepairToBaseStorage(next, r.id, r.quantity);
  }
  return next;
}

export function totalRepairSupplyUnits(bs: BaseStorage): number {
  return (
    bs.hullPatchKits +
    bs.pressureSealant +
    bs.emergencyBrace +
    bs.oxygenCanisters
  );
}

/** Keep `resources`, `treasureInventory`, and `repairInventory` aligned with base storage. */
export function withSyncedLegacyEconomy(state: GameState): GameState {
  const bs = state.baseStorage;
  return {
    ...state,
    resources: { scrap: bs.scrap, researchData: bs.researchData },
    treasureInventory: bs.treasures,
    repairInventory: repairInventoryFromBaseStorage(bs),
  };
}

export function appendTreasuresToBaseStorage(bs: BaseStorage, found: Treasure[]): BaseStorage {
  if (!found.length) return bs;
  return { ...bs, treasures: [...bs.treasures, ...found] };
}

export type TreasureRarityBucket = 'common' | 'rare';

export function salvageTreasureValueScrap(rarity: TreasureRarityBucket): number {
  return rarity === 'rare' ? TREASURE_SALVAGE_SCRAP_RARE : TREASURE_SALVAGE_SCRAP_COMMON;
}

export function salvageTreasuresFromBaseStorage(
  bs: BaseStorage,
  rarity: TreasureRarityBucket,
  count: number,
): { bs: BaseStorage; salvaged: number; scrapGained: number } {
  const want = Math.max(0, Math.floor(count));
  if (want <= 0) return { bs, salvaged: 0, scrapGained: 0 };
  const matches = bs.treasures.filter((t) => (t.rarity ?? 'common') === rarity);
  const salvaged = Math.min(want, matches.length);
  if (salvaged <= 0) return { bs, salvaged: 0, scrapGained: 0 };
  let remaining = salvaged;
  const nextTreasures: Treasure[] = [];
  for (const t of bs.treasures) {
    if (remaining > 0 && (t.rarity ?? 'common') === rarity) {
      remaining -= 1;
      continue;
    }
    nextTreasures.push(t);
  }
  const scrapGained = salvaged * salvageTreasureValueScrap(rarity);
  return {
    bs: { ...bs, scrap: bs.scrap + scrapGained, treasures: nextTreasures },
    salvaged,
    scrapGained,
  };
}

export function analyzeArtifactsFromBaseStorage(
  bs: BaseStorage,
  count: number,
): { bs: BaseStorage; analyzed: number; researchGained: number } {
  const want = Math.max(0, Math.floor(count));
  const analyzed = Math.min(want, Math.max(0, bs.artifacts));
  if (analyzed <= 0) return { bs, analyzed: 0, researchGained: 0 };
  const researchGained = analyzed * ARTIFACT_ANALYZE_RESEARCH;
  return {
    bs: {
      ...bs,
      artifacts: bs.artifacts - analyzed,
      researchData: bs.researchData + researchGained,
    },
    analyzed,
    researchGained,
  };
}

export function analyzeSamplesFromBaseStorage(
  bs: BaseStorage,
  count: number,
): { bs: BaseStorage; analyzed: number; researchGained: number } {
  const want = Math.max(0, Math.floor(count));
  const analyzed = Math.min(want, Math.max(0, bs.samples));
  if (analyzed <= 0) return { bs, analyzed: 0, researchGained: 0 };
  const researchGained = analyzed * SAMPLE_ANALYZE_RESEARCH;
  return {
    bs: {
      ...bs,
      samples: bs.samples - analyzed,
      researchData: bs.researchData + researchGained,
    },
    analyzed,
    researchGained,
  };
}
