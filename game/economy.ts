import type { RiskLevel, Treasure } from '@/types';

/**
 * Centralized MVP economy tuning for early-game sustain.
 * Keep numbers here so reward/cost changes don't leak into UI components.
 */

// --- Mission completion bonus (paid on success; transferred once per dive) ---
export function missionCompletionBonusScrap(risk: RiskLevel): number {
  switch (risk) {
    case 'low':
      return 25;
    case 'medium':
      return 50;
    case 'medium-high':
      return 75;
    case 'high':
      return 100;
    default:
      return 50;
  }
}

// --- Repair Dock ---
/** 1 scrap repairs 2% hull. */
export const SCRAP_PER_HULL_PERCENT = 0.5;
export const PARTIAL_HULL_REPAIR_PERCENT = 25;

// --- Basic supplies restock ---
export const BASIC_RESTOCK_SCRAP_COST = 10;
export const BASIC_SUPPLIES_TARGETS = {
  hullPatchKits: 1,
  pressureSealant: 1,
  oxygenCanisters: 1,
} as const;

// --- Valuables conversions (immediate utility; no market system yet) ---
export const TREASURE_SALVAGE_SCRAP_COMMON = 25;
export const TREASURE_SALVAGE_SCRAP_RARE = 75;
export const ARTIFACT_ANALYZE_RESEARCH = 40;
export const SAMPLE_ANALYZE_RESEARCH = 20;

export function treasureSalvageValueScrap(t: Treasure): number {
  return t.rarity === 'rare' ? TREASURE_SALVAGE_SCRAP_RARE : TREASURE_SALVAGE_SCRAP_COMMON;
}

