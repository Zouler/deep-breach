import type {
  DiveSession,
  ExternalDiscovery,
  RepairItem,
  Room,
  RoomLoot,
  Submarine,
  Treasure,
} from '@/types';

import { repairTemplateById } from '@/data/repairItems';
import { createId } from '@/game/ids';
import { getItemDisplayName, mergeCatalogCounts, normalizeItemId } from '@/game/items';
import { randomRoomId } from '@/game/diveEvents';
import { cargoCapacityUnits } from '@/game/submarineStats';

/** Cargo units: repair item = 1; scrap/research stack; valuables weighted. */
export const CARGO_UNITS_PER_SCRAP_BLOCK = 10;
export const CARGO_UNITS_PER_RESEARCH_BLOCK = 5;
export const CARGO_UNITS_TREASURE = 3;
export const CARGO_UNITS_ARTIFACT = 3;
export const CARGO_UNITS_SAMPLE = 2;

export function computeCargoUsed(dive: DiveSession): number {
  let u = 0;
  for (const it of dive.expeditionRepairInventory ?? []) {
    u += Math.max(0, it.quantity);
  }
  u += Math.ceil(dive.collectedScrap / CARGO_UNITS_PER_SCRAP_BLOCK);
  u += Math.ceil(dive.collectedResearch / CARGO_UNITS_PER_RESEARCH_BLOCK);
  u += dive.collectedTreasures.length * CARGO_UNITS_TREASURE;
  u += (dive.collectedArtifacts ?? 0) * CARGO_UNITS_ARTIFACT;
  u += (dive.collectedSamples ?? 0) * CARGO_UNITS_SAMPLE;
  return u;
}

export function cargoSpaceRemaining(dive: DiveSession, submarine: Submarine): number {
  return Math.max(0, cargoCapacityUnits(submarine) - computeCargoUsed(dive));
}

function ensureRepairRow(inv: RepairItem[], tpl: RepairItem): void {
  if (!inv.some((x) => x.id === tpl.id)) {
    inv.push({ ...tpl, quantity: 0 });
  }
}

export function addRepairChargesToExpedition(
  dive: DiveSession,
  submarine: Submarine,
  templateId: string,
  quantity: number,
): { dive: DiveSession; applied: number; leftBehind: number; stagedLoot: RoomLoot[] } {
  const tpl = repairTemplateById(templateId);
  if (!tpl || quantity <= 0) {
    return { dive, applied: 0, leftBehind: quantity, stagedLoot: [] };
  }
  let d = dive;
  let applied = 0;
  const stagedLoot: RoomLoot[] = [];
  const inv = (d.expeditionRepairInventory ?? []).map((x) => ({ ...x }));
  ensureRepairRow(inv, tpl);
  const cap = cargoCapacityUnits(submarine);
  for (let n = 0; n < quantity; n++) {
    const trialInv = inv.map((x) => ({ ...x }));
    const trow = trialInv.find((x) => x.id === templateId)!;
    trow.quantity += 1;
    const trialDive = { ...d, expeditionRepairInventory: trialInv };
    if (computeCargoUsed(trialDive) <= cap) {
      const row = inv.find((x) => x.id === templateId)!;
      row.quantity += 1;
      d = { ...d, expeditionRepairInventory: inv.map((x) => ({ ...x })) };
      applied++;
    } else {
      stagedLoot.push({
        id: createId('loot'),
        kind: 'emergency_supply',
        name: `${tpl.name} (overflow staging)`,
        repairTemplateId: templateId,
        repairQuantity: 1,
        collected: false,
      });
    }
  }
  return { dive: d, applied, leftBehind: stagedLoot.length, stagedLoot };
}

/** Merge staged overflow kits into a random compartment's loot table. */
export function attachLootToRandomRoom(rooms: Room[], loot: RoomLoot[]): Room[] {
  if (!loot.length) return rooms;
  const roomId = randomRoomId(rooms);
  return rooms.map((r) =>
    r.id !== roomId
      ? r
      : {
          ...r,
          loot: [...r.loot, ...loot],
        },
  );
}

export function addScrapWithCargoCap(
  dive: DiveSession,
  submarine: Submarine,
  amount: number,
): { dive: DiveSession; added: number; lost: number } {
  if (amount <= 0) return { dive, added: 0, lost: 0 };
  let d = dive;
  let added = 0;
  for (let i = 0; i < amount; i++) {
    const trial = { ...d, collectedScrap: d.collectedScrap + 1 };
    if (computeCargoUsed(trial) <= cargoCapacityUnits(submarine)) {
      d = trial;
      added++;
    } else {
      break;
    }
  }
  return { dive: d, added, lost: amount - added };
}

export function addResearchWithCargoCap(
  dive: DiveSession,
  submarine: Submarine,
  amount: number,
): { dive: DiveSession; added: number; lost: number } {
  if (amount <= 0) return { dive, added: 0, lost: 0 };
  let d = dive;
  let added = 0;
  for (let i = 0; i < amount; i++) {
    const trial = { ...d, collectedResearch: d.collectedResearch + 1 };
    if (computeCargoUsed(trial) <= cargoCapacityUnits(submarine)) {
      d = trial;
      added++;
    } else {
      break;
    }
  }
  return { dive: d, added, lost: amount - added };
}

export function addTreasureWithCargoCap(
  dive: DiveSession,
  submarine: Submarine,
  treasure: Treasure,
): { dive: DiveSession; ok: boolean } {
  const trial = {
    ...dive,
    collectedTreasures: [...dive.collectedTreasures, treasure],
  };
  if (computeCargoUsed(trial) <= cargoCapacityUnits(submarine)) {
    return { dive: trial, ok: true };
  }
  return { dive, ok: false };
}

export function addArtifactsWithCargoCap(
  dive: DiveSession,
  submarine: Submarine,
  count: number,
): { dive: DiveSession; added: number; lost: number } {
  if (count <= 0) return { dive, added: 0, lost: 0 };
  let d = dive;
  let added = 0;
  for (let i = 0; i < count; i++) {
    const trial = { ...d, collectedArtifacts: (d.collectedArtifacts ?? 0) + 1 };
    if (computeCargoUsed(trial) <= cargoCapacityUnits(submarine)) {
      d = trial;
      added++;
    } else break;
  }
  return { dive: d, added, lost: count - added };
}

export function addSamplesWithCargoCap(
  dive: DiveSession,
  submarine: Submarine,
  count: number,
): { dive: DiveSession; added: number; lost: number } {
  if (count <= 0) return { dive, added: 0, lost: 0 };
  let d = dive;
  let added = 0;
  for (let i = 0; i < count; i++) {
    const trial = { ...d, collectedSamples: (d.collectedSamples ?? 0) + 1 };
    if (computeCargoUsed(trial) <= cargoCapacityUnits(submarine)) {
      d = trial;
      added++;
    } else break;
  }
  return { dive: d, added, lost: count - added };
}

export type RewardIntent = {
  scrap?: number;
  research?: number;
  repairAdds?: { templateId: string; quantity: number }[];
  catalogAdds?: { itemId: string; quantity: number }[];
  treasures?: Treasure[];
  artifacts?: number;
  samples?: number;
};

export type RewardApplicationResult = {
  dive: DiveSession;
  lines: string[];
  recoveredRepairUnits: number;
};

export function applyRewardIntent(
  dive: DiveSession,
  submarine: Submarine,
  intent: RewardIntent,
  rooms: Room[],
): { dive: DiveSession; rooms: Room[]; result: RewardApplicationResult } {
  let d = dive;
  const lines: string[] = [];
  let recoveredRepairUnits = 0;
  let nextRooms = rooms;

  for (const add of intent.repairAdds ?? []) {
    const { dive: d2, applied, stagedLoot } = addRepairChargesToExpedition(
      d,
      submarine,
      add.templateId,
      add.quantity,
    );
    d = d2;
    recoveredRepairUnits += applied;
    if (applied > 0) {
      const nm = repairTemplateById(add.templateId)?.name ?? 'repair kit';
      lines.push(`+${applied}× ${nm} (expedition cargo)`);
    }
    if (stagedLoot.length) {
      nextRooms = attachLootToRandomRoom(nextRooms, stagedLoot);
      lines.push('Cargo full — some kits lashed to a staging rack in a compartment.');
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          'Repair supplies staged in a room — collect or make cargo space.',
        ],
      };
    }
  }

  for (const add of intent.catalogAdds ?? []) {
    const itemId = normalizeItemId(add.itemId);
    if (add.quantity <= 0) continue;
    const current = d.expeditionCatalogItems ?? {};
    d = {
      ...d,
      expeditionCatalogItems: mergeCatalogCounts(current, { [itemId]: add.quantity }),
    };
    lines.push(`+${add.quantity}× ${getItemDisplayName(itemId)} (catalog)`);
  }

  const scrapAmt = intent.scrap ?? 0;
  if (scrapAmt > 0) {
    const { dive: d2, added, lost } = addScrapWithCargoCap(d, submarine, scrapAmt);
    d = d2;
    if (added > 0) lines.push(`+${added} scrap`);
    if (lost > 0) {
      lines.push(`Partial stow: ${lost} scrap left outside (cargo capacity).`);
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          `${lost} scrap not brought aboard — cargo limit reached.`,
        ],
      };
    }
  }

  const resAmt = intent.research ?? 0;
  if (resAmt > 0) {
    const { dive: d2, added, lost } = addResearchWithCargoCap(d, submarine, resAmt);
    d = d2;
    if (added > 0) lines.push(`+${added} research data`);
    if (lost > 0) {
      lines.push(`Partial stow: ${lost} research packets trimmed (cargo capacity).`);
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          `${lost} research data not stored — cargo limit reached.`,
        ],
      };
    }
  }

  for (const tr of intent.treasures ?? []) {
    const { dive: d2, ok } = addTreasureWithCargoCap(d, submarine, tr);
    if (ok) {
      d = d2;
      lines.push(`Relic secured: ${tr.name}`);
    } else {
      lines.push(`Cargo full — could not secure relic: ${tr.name}.`);
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          `Treasure left behind: ${tr.name}.`,
        ],
      };
    }
  }

  const art = intent.artifacts ?? 0;
  if (art > 0) {
    const { dive: d2, added, lost } = addArtifactsWithCargoCap(d, submarine, art);
    d = d2;
    if (added > 0) lines.push(`+${added} artifact signature(s) catalogued`);
    if (lost > 0) {
      lines.push(`Cargo tight — ${lost} artifact record(s) not fully archived.`);
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          `${lost} artifact(s) left in the water column — cargo limit.`,
        ],
      };
    }
  }

  const smp = intent.samples ?? 0;
  if (smp > 0) {
    const { dive: d2, added, lost } = addSamplesWithCargoCap(d, submarine, smp);
    d = d2;
    if (added > 0) lines.push(`+${added} sample(s) in containment`);
    if (lost > 0) {
      lines.push(`Sample overflow — ${lost} specimen(s) not stored.`);
      d = {
        ...d,
        cargoLeftBehindNotes: [
          ...(d.cargoLeftBehindNotes ?? []),
          `${lost} sample(s) not brought aboard.`,
        ],
      };
    }
  }

  const result: RewardApplicationResult = { dive: d, lines, recoveredRepairUnits };
  return { dive: d, rooms: nextRooms, result };
}

export function oxygenCanisterCount(dive: DiveSession): number {
  return dive.expeditionRepairInventory?.find((i) => i.id === 'oxygen_canister')?.quantity ?? 0;
}

export function consumeOneOxygenCanister(dive: DiveSession): DiveSession {
  const inv = (dive.expeditionRepairInventory ?? []).map((x) => ({ ...x }));
  const row = inv.find((i) => i.id === 'oxygen_canister');
  if (row && row.quantity > 0) {
    row.quantity -= 1;
  }
  return { ...dive, expeditionRepairInventory: inv };
}

export function scanNarrativeForDiscovery(discovery: ExternalDiscovery): string {
  const risk = discovery.riskBand.toUpperCase();
  const haz = Math.round(discovery.hazardChanceDisplay * 100);
  const rw = Math.round(discovery.rewardQualityDisplay * 100);
  const rewardWords = rewardWordsForCategory(discovery.category);
  let extra = '';
  if (discovery.category === 'thermal_anomaly' || discovery.category === 'volcanic_rock') {
    if (discovery.hazardChanceDisplay > 0.42) {
      extra = ' Warning: unstable thermal readings detected.';
    }
  }
  return `Research Lead — scan confirms. Estimated risk: ${risk} (~${haz}% hazard). Possible rewards: ${rewardWords} (quality ~${rw}%).${extra}`;
}

function rewardWordsForCategory(cat: ExternalDiscovery['category']): string {
  switch (cat) {
    case 'salvage':
      return 'scrap, patch kits, sealant';
    case 'research_signal':
      return 'research data, samples';
    case 'treasure_cache':
      return 'treasures, scrap, braces';
    case 'thermal_anomaly':
    case 'volcanic_rock':
      return 'samples, research data (hull stress risk)';
    case 'biological_contact':
      return 'research data, rare relics';
    case 'unknown_artifact':
      return 'artifacts, research data';
    default:
      return 'mixed salvage';
  }
}
