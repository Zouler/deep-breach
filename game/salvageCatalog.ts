import type { DiveRoute, GameState } from '@/types';

import type { RewardIntent } from '@/game/cargo';
import type { ItemDefinition, ItemGroup, ItemStateContext } from '@/game/items';
import {
  CANON_ITEMS,
  filterDropEligibleItems,
  getItemRarityWeight,
  repairTemplateIdForCanonItem,
} from '@/game/items';

type DropContext = ItemStateContext & {
  route?: DiveRoute;
  discoveryCategory?: string;
};

function groupWeight(group: ItemGroup, ctx: DropContext): number {
  const route = ctx.route;
  const cat = ctx.discoveryCategory ?? '';
  if (route === 'search_salvage' || cat === 'salvage') {
    const weights: Partial<Record<ItemGroup, number>> = {
      repair_hull: 3,
      life_support: 2.5,
      power_engineering: 2,
      crew_morale: 0.6,
      sensor_comms: 0.4,
      research_anomaly: 0.3,
      weapons_countermeasure: 0,
    };
    return weights[group] ?? 0.2;
  }
  if (route === 'follow_signal' || cat === 'research_signal' || cat === 'unknown_artifact') {
    const weights: Partial<Record<ItemGroup, number>> = {
      sensor_comms: 2.5,
      research_anomaly: 2.2,
      repair_hull: 0.5,
      life_support: 0.6,
      power_engineering: 0.7,
      crew_morale: 0.4,
      weapons_countermeasure: 0,
    };
    return weights[group] ?? 0.2;
  }
  if (cat === 'biological_contact' || cat === 'thermal_anomaly') {
    return group === 'research_anomaly' ? 2 : group === 'life_support' ? 0.8 : 0.4;
  }
  return group === 'weapons_countermeasure' ? 0 : 1;
}

function weightedPick(pool: ItemDefinition[]): ItemDefinition | null {
  if (!pool.length) return null;
  let total = 0;
  const weights = pool.map((item) => {
    const w = getItemRarityWeight(item);
    total += w;
    return w;
  });
  if (total <= 0) return pool[0] ?? null;
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[pool.length - 1] ?? null;
}

export function rollSalvageCatalogDrop(ctx: DropContext): string | null {
  const eligible = filterDropEligibleItems(
    CANON_ITEMS.filter((i) => i.canDropInSalvage),
    ctx,
  );
  if (!eligible.length) return null;

  const weighted = eligible.flatMap((item) => {
    const gw = groupWeight(item.group, ctx);
    if (gw <= 0) return [];
    const copies = Math.max(1, Math.round(gw * getItemRarityWeight(item) / 3));
    return Array.from({ length: copies }, () => item);
  });
  return weightedPick(weighted)?.id ?? null;
}

export function appendCatalogSalvageToRewardIntent(
  intent: RewardIntent,
  ctx: DropContext,
  rolls = 1,
): RewardIntent {
  const next: RewardIntent = {
    ...intent,
    repairAdds: intent.repairAdds ? [...intent.repairAdds] : undefined,
    catalogAdds: intent.catalogAdds ? [...intent.catalogAdds] : undefined,
  };

  for (let i = 0; i < rolls; i++) {
    if (Math.random() > 0.42) continue;
    const itemId = rollSalvageCatalogDrop(ctx);
    if (!itemId) continue;
    const tpl = repairTemplateIdForCanonItem(itemId);
    if (tpl) {
      const adds = next.repairAdds ?? [];
      const row = adds.find((a) => a.templateId === tpl);
      if (row) row.quantity += 1;
      else adds.push({ templateId: tpl, quantity: 1 });
      next.repairAdds = adds;
    } else {
      const adds = next.catalogAdds ?? [];
      const row = adds.find((a) => a.itemId === itemId);
      if (row) row.quantity += 1;
      else adds.push({ itemId, quantity: 1 });
      next.catalogAdds = adds;
    }
  }

  if (!next.repairAdds?.length) delete next.repairAdds;
  if (!next.catalogAdds?.length) delete next.catalogAdds;
  return next;
}

export function itemStateFromGameState(
  state: Pick<GameState, 'canonEra' | 'revealLevel' | 'catalogItems'>,
): ItemStateContext {
  return {
    canonEra: state.canonEra,
    revealLevel: state.revealLevel,
    catalogItems: state.catalogItems ?? {},
  };
}

export function mergeExpeditionCatalogIntoBase(
  base: Record<string, number>,
  expedition: Record<string, number> | undefined,
  successFraction = 1,
): Record<string, number> {
  const out = { ...base };
  for (const [id, qty] of Object.entries(expedition ?? {})) {
    const moved = Math.max(0, Math.floor(qty * successFraction));
    if (moved <= 0) continue;
    out[id] = (out[id] ?? 0) + moved;
  }
  return out;
}
