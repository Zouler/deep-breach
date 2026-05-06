import type { GameState, SubmarineModuleType } from '@/types';

import { withSyncedLegacyEconomy } from '@/game/baseStorage';

export type UpgradeCurrency = 'scrap' | 'research';

export function upgradeModuleScrapCost(level: number): number {
  return 35 + level * 22;
}

/** Research alternative (roughly 40% of scrap “value”, floored). */
export function upgradeModuleResearchCost(level: number): number {
  return Math.max(6, Math.floor(upgradeModuleScrapCost(level) * 0.42));
}

export function canAffordUpgrade(
  state: GameState,
  moduleType: SubmarineModuleType,
  currency: UpgradeCurrency,
): boolean {
  const mod = state.submarine.modules.find((m) => m.type === moduleType);
  if (!mod || mod.level >= mod.maxLevel) return false;
  const scrap = upgradeModuleScrapCost(mod.level);
  const research = upgradeModuleResearchCost(mod.level);
  if (currency === 'scrap') return state.baseStorage.scrap >= scrap;
  return state.baseStorage.researchData >= research;
}

/** Pure preview of post-upgrade state (reducer should remain source of truth). */
export function previewUpgrade(
  state: GameState,
  moduleType: SubmarineModuleType,
  currency: UpgradeCurrency,
): GameState | null {
  const mod = state.submarine.modules.find((m) => m.type === moduleType);
  if (!mod || mod.level >= mod.maxLevel) return null;
  const scrapCost = upgradeModuleScrapCost(mod.level);
  const researchCost = upgradeModuleResearchCost(mod.level);
  if (currency === 'scrap' && state.baseStorage.scrap < scrapCost) return null;
  if (currency === 'research' && state.baseStorage.researchData < researchCost) return null;
  const modules = state.submarine.modules.map((m) =>
    m.type === moduleType ? { ...m, level: m.level + 1 } : m,
  );
  const baseStorage =
    currency === 'scrap'
      ? { ...state.baseStorage, scrap: state.baseStorage.scrap - scrapCost }
      : {
          ...state.baseStorage,
          researchData: state.baseStorage.researchData - researchCost,
        };
  return withSyncedLegacyEconomy({
    ...state,
    baseStorage,
    submarine: { ...state.submarine, modules },
  });
}
