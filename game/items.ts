/**
 * Canon salvage / survival item taxonomy v1.
 * @see docs/source-of-truth/deep-breach-story-canon-sot-v0.2.md
 */

import type { CanonEra, RevealLevel } from '@/game/canon';
import { canReveal, isEraUnlocked } from '@/game/canon';
import type { GameState } from '@/types';

export type ItemGroup =
  | 'repair_hull'
  | 'life_support'
  | 'power_engineering'
  | 'sensor_comms'
  | 'research_anomaly'
  | 'crew_morale'
  | 'weapons_countermeasure';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'classified';

export interface ItemDefinition {
  id: string;
  name: string;
  shortName?: string;
  group: ItemGroup;
  rarity: ItemRarity;
  description: string;
  gameplayRole: string;
  effectTag: string;
  eraGate?: CanonEra;
  revealLevelRequired?: RevealLevel;
  canDropInSalvage: boolean;
  canBeLoadedOnExpedition?: boolean;
  canBeStoredAtBase?: boolean;
  isConsumable?: boolean;
  isStoryItem?: boolean;
  legacyRepairTemplateId?: string;
}

export type ItemStateContext = Pick<GameState, 'canonEra' | 'revealLevel' | 'catalogItems'>;

export const ITEM_GROUP_LABELS: Record<ItemGroup, string> = {
  repair_hull: 'Repair & Hull',
  life_support: 'Life Support',
  power_engineering: 'Power & Engineering',
  sensor_comms: 'Sensors & Comms',
  research_anomaly: 'Research & Anomaly',
  crew_morale: 'Crew & Morale',
  weapons_countermeasure: 'Weapons & Countermeasures',
};

export const ITEM_GROUP_ORDER: readonly ItemGroup[] = [
  'repair_hull',
  'life_support',
  'power_engineering',
  'sensor_comms',
  'research_anomaly',
  'crew_morale',
  'weapons_countermeasure',
] as const;

export const LEGACY_ITEM_ID_TO_CANON: Record<string, string> = {
  patch_kit: 'hull_patch_kit',
  hull_patch: 'hull_patch_kit',
  hull_patch_kit: 'hull_patch_kit',
  sealant: 'pressure_sealant',
  pressure_sealant: 'pressure_sealant',
  brace_frame: 'emergency_bulkhead_clamps',
  emergency_brace: 'emergency_bulkhead_clamps',
  oxygen: 'oxygen_canister',
  oxygen_canister: 'oxygen_canister',
  relic: 'unknown_alloy_fragment',
  artifact: 'unknown_alloy_fragment',
};

export const CANON_TO_REPAIR_TEMPLATE: Partial<Record<string, string>> = {
  hull_patch_kit: 'patch_kit',
  pressure_sealant: 'pressure_sealant',
  emergency_bulkhead_clamps: 'brace_frame',
  oxygen_canister: 'oxygen_canister',
};

function item(def: ItemDefinition): ItemDefinition {
  return {
    canBeLoadedOnExpedition: true,
    canBeStoredAtBase: true,
    isConsumable: def.group !== 'research_anomaly',
    ...def,
  };
}

export const CANON_ITEMS: readonly ItemDefinition[] = [
  item({ id: 'hull_patch_kit', name: 'Hull Patch Kit', group: 'repair_hull', rarity: 'common', description: 'Field-applied hull patch for moderate breaches.', gameplayRole: 'basic hull repair', effectTag: 'repair_hull', canDropInSalvage: true, legacyRepairTemplateId: 'patch_kit' }),
  item({ id: 'pressure_sealant', name: 'Pressure Sealant', group: 'repair_hull', rarity: 'common', description: 'Sealant compound for pressurized micro-leaks.', gameplayRole: 'seal small leaks', effectTag: 'seal_leak', canDropInSalvage: true, legacyRepairTemplateId: 'pressure_sealant' }),
  item({ id: 'reinforced_plating', name: 'Reinforced Plating', group: 'repair_hull', rarity: 'uncommon', description: 'Salvaged plating segments for stronger field repairs.', gameplayRole: 'improves repair quality / future upgrade material', effectTag: 'hull_upgrade_material', canDropInSalvage: true }),
  item({ id: 'ballast_valve_parts', name: 'Ballast Valve Parts', group: 'repair_hull', rarity: 'uncommon', description: 'Replacement valve assemblies for ballast control.', gameplayRole: 'ballast repair / emergency ascent support', effectTag: 'ballast_repair', canDropInSalvage: true }),
  item({ id: 'emergency_bulkhead_clamps', name: 'Emergency Bulkhead Clamps', group: 'repair_hull', rarity: 'rare', description: 'Temporary bulkhead clamps for flooding containment.', gameplayRole: 'temporary containment of flooding', effectTag: 'flood_containment', canDropInSalvage: true, legacyRepairTemplateId: 'brace_frame' }),
  item({ id: 'anti_corrosion_coating', name: 'Anti-Corrosion Coating', group: 'repair_hull', rarity: 'rare', description: 'Protective coating sample resisting anomalous oxidation.', gameplayRole: 'future anomaly/hull degradation resistance', effectTag: 'anomaly_hull_resist', canDropInSalvage: true, eraGate: 'dead_beacon' }),
  item({ id: 'oxygen_canister', name: 'Oxygen Canister', group: 'life_support', rarity: 'common', description: 'Portable oxygen reserve for emergency replenishment.', gameplayRole: 'emergency oxygen', effectTag: 'oxygen_restore', canDropInSalvage: true, legacyRepairTemplateId: 'oxygen_canister' }),
  item({ id: 'co2_scrubber_filter', name: 'CO₂ Scrubber Filter', group: 'life_support', rarity: 'common', description: 'Replacement filter cartridge for CO₂ scrubbers.', gameplayRole: 'life support recovery', effectTag: 'co2_scrub', canDropInSalvage: true }),
  item({ id: 'air_recycler_module', name: 'Air Recycler Module', group: 'life_support', rarity: 'uncommon', description: 'Compact recycler module for oxygen efficiency.', gameplayRole: 'oxygen efficiency / life support repair', effectTag: 'oxygen_efficiency', canDropInSalvage: true }),
  item({ id: 'emergency_breathing_masks', name: 'Emergency Breathing Masks', group: 'life_support', rarity: 'uncommon', description: 'Portable masks for crew use during life support incidents.', gameplayRole: 'crew survival during life support incidents', effectTag: 'crew_breathing', canDropInSalvage: true }),
  item({ id: 'pressure_suit_patch', name: 'Pressure Suit Patch', group: 'life_support', rarity: 'rare', description: 'Patch kit for pressure suits and future EVA gear.', gameplayRole: 'crew survival / future EVA/ROV support', effectTag: 'eva_support', canDropInSalvage: true, eraGate: 'anomaly_growth' }),
  item({ id: 'spare_fuse_bank', name: 'Spare Fuse Bank', group: 'power_engineering', rarity: 'common', description: 'Assorted fuses for electrical fault recovery.', gameplayRole: 'electrical fault recovery', effectTag: 'electrical_repair', canDropInSalvage: true }),
  item({ id: 'battery_cell', name: 'Battery Cell', group: 'power_engineering', rarity: 'common', description: 'High-density cell for emergency power reserves.', gameplayRole: 'power reserve / emergency systems', effectTag: 'power_reserve', canDropInSalvage: true }),
  item({ id: 'coolant_cartridge', name: 'Coolant Cartridge', group: 'power_engineering', rarity: 'uncommon', description: 'Coolant charge for engine heat dissipation.', gameplayRole: 'engine heat / power stability', effectTag: 'engine_coolant', canDropInSalvage: true }),
  item({ id: 'motor_servo_unit', name: 'Motor Servo Unit', group: 'power_engineering', rarity: 'uncommon', description: 'Servo assembly for propulsion subsystem repairs.', gameplayRole: 'propulsion repair', effectTag: 'propulsion_repair', canDropInSalvage: true }),
  item({ id: 'reactor_stabilizer_part', name: 'Reactor Stabilizer Part', group: 'power_engineering', rarity: 'rare', description: 'Stabilizer component for future power upgrades.', gameplayRole: 'future power upgrade material', effectTag: 'power_upgrade_material', canDropInSalvage: true, eraGate: 'dead_beacon' }),
  item({ id: 'engine_bearing_set', name: 'Engine Bearing Set', group: 'power_engineering', rarity: 'rare', description: 'Precision bearings for propulsion strain recovery.', gameplayRole: 'propulsion strain repair / upgrade material', effectTag: 'propulsion_upgrade_material', canDropInSalvage: true }),
  item({ id: 'sonar_calibration_chip', name: 'Sonar Calibration Chip', group: 'sensor_comms', rarity: 'common', description: 'Calibration chip improving sonar accuracy.', gameplayRole: 'sonar accuracy / scan improvement', effectTag: 'sonar_accuracy', canDropInSalvage: true }),
  item({ id: 'signal_booster', name: 'Signal Booster', group: 'sensor_comms', rarity: 'uncommon', description: 'Amplifier module for weak signal tracking.', gameplayRole: 'comms / signal tracking', effectTag: 'signal_boost', canDropInSalvage: true }),
  item({ id: 'hydrophone_array_part', name: 'Hydrophone Array Part', group: 'sensor_comms', rarity: 'uncommon', description: 'Passive hydrophone segment for sonar upgrades.', gameplayRole: 'passive sonar improvement', effectTag: 'passive_sonar', canDropInSalvage: true }),
  item({ id: 'encrypted_beacon_core', name: 'Encrypted Beacon Core', group: 'sensor_comms', rarity: 'rare', description: 'Damaged beacon core with encrypted authentication headers.', gameplayRole: 'story/research item', effectTag: 'beacon_research', canDropInSalvage: true, isStoryItem: true, eraGate: 'dead_beacon' }),
  item({ id: 'optics_lens_assembly', name: 'Optics Lens Assembly', group: 'sensor_comms', rarity: 'rare', description: 'Precision lens assembly for optics mast upgrades.', gameplayRole: 'optics mast upgrade material', effectTag: 'optics_upgrade', canDropInSalvage: true, eraGate: 'anomaly_growth' }),
  item({ id: 'damaged_black_box', name: 'Damaged Black Box', group: 'sensor_comms', rarity: 'rare', description: 'Cracked flight recorder with partial log fragments.', gameplayRole: 'story/log/research item', effectTag: 'log_research', canDropInSalvage: true, isStoryItem: true, eraGate: 'dead_beacon' }),
  item({ id: 'sediment_sample', name: 'Sediment Sample', group: 'research_anomaly', rarity: 'common', description: 'Sealed sediment core for baseline research.', gameplayRole: 'research data', effectTag: 'research_data', canDropInSalvage: true }),
  item({ id: 'biological_trace_sample', name: 'Biological Trace Sample', group: 'research_anomaly', rarity: 'uncommon', description: 'Trace biological material for anomaly study.', gameplayRole: 'research data / anomaly study', effectTag: 'bio_research', canDropInSalvage: true }),
  item({ id: 'unknown_alloy_fragment', name: 'Unknown Alloy Fragment', group: 'research_anomaly', rarity: 'rare', description: 'Unidentified alloy with anomalous stress patterns.', gameplayRole: 'anomaly research', effectTag: 'anomaly_research', canDropInSalvage: true, eraGate: 'dead_beacon' }),
  item({ id: 'pressure_warped_metal', name: 'Pressure-Warped Metal', group: 'research_anomaly', rarity: 'rare', description: 'Metal warped by impossible deep pressure signatures.', gameplayRole: 'anomaly/hull research', effectTag: 'anomaly_hull_research', canDropInSalvage: true, eraGate: 'dead_beacon' }),
  item({ id: 'non_human_geometry_relic', name: 'Non-Human Geometry Relic', group: 'research_anomaly', rarity: 'classified', description: 'Artifact fragment with geometry that should not exist.', gameplayRole: 'late-game anomaly artifact', effectTag: 'anomaly_artifact', canDropInSalvage: true, isStoryItem: true, eraGate: 'anomaly_growth', revealLevelRequired: 5 }),
  item({ id: 'anomalous_signal_fragment', name: 'Anomalous Signal Fragment', group: 'research_anomaly', rarity: 'classified', description: 'Corrupted signal shard tied to impossible beacon traffic.', gameplayRole: 'anomaly signal research', effectTag: 'signal_anomaly', canDropInSalvage: true, isStoryItem: true, eraGate: 'dead_beacon', revealLevelRequired: 2 }),
  item({ id: 'medical_supplies', name: 'Medical Supplies', group: 'crew_morale', rarity: 'common', description: 'Basic medical kit for injury recovery.', gameplayRole: 'injury recovery', effectTag: 'medical_recovery', canDropInSalvage: true }),
  item({ id: 'sedative_pack', name: 'Sedative Pack', group: 'crew_morale', rarity: 'uncommon', description: 'Sedatives for stress or medical crisis stabilization.', gameplayRole: 'stress/medical crisis', effectTag: 'stress_relief', canDropInSalvage: true }),
  item({ id: 'ration_crate', name: 'Ration Crate', group: 'crew_morale', rarity: 'common', description: 'Extended-deployment ration crate.', gameplayRole: 'morale / long deployment support', effectTag: 'morale_boost', canDropInSalvage: true }),
  item({ id: 'personal_letter_bundle', name: 'Personal Letter Bundle', group: 'crew_morale', rarity: 'uncommon', description: 'Recovered personal mail tied to crew or family.', gameplayRole: 'crew morale / narrative event', effectTag: 'narrative_morale', canDropInSalvage: true, isStoryItem: true }),
  item({ id: 'old_music_tape', name: 'Old Music Tape', group: 'crew_morale', rarity: 'rare', description: 'Worn audio tape with handwritten track list.', gameplayRole: 'morale / Roberts or crew scene', effectTag: 'morale_scene', canDropInSalvage: true, isStoryItem: true }),
  item({ id: 'crew_photo', name: 'Crew Photo', group: 'crew_morale', rarity: 'rare', description: 'Waterlogged photograph from a lost vessel.', gameplayRole: 'emotional/narrative item', effectTag: 'emotional_item', canDropInSalvage: true, isStoryItem: true }),
  item({ id: 'acoustic_decoy', name: 'Acoustic Decoy', group: 'weapons_countermeasure', rarity: 'uncommon', description: 'Deployable acoustic decoy canister (not yet armed).', gameplayRole: 'future defensive countermeasure', effectTag: 'acoustic_decoy', canDropInSalvage: true, eraGate: 'anomaly_growth' }),
  item({ id: 'countermeasure_foam', name: 'Countermeasure Foam', group: 'weapons_countermeasure', rarity: 'uncommon', description: 'Signature-disrupting foam canister.', gameplayRole: 'future hull/signature defense', effectTag: 'signature_defense', canDropInSalvage: true, eraGate: 'anomaly_growth' }),
  item({ id: 'torpedo_guidance_component', name: 'Torpedo Guidance Component', group: 'weapons_countermeasure', rarity: 'rare', description: 'Guidance module for torpedo systems.', gameplayRole: 'future weapons upgrade', effectTag: 'torpedo_upgrade', canDropInSalvage: true, eraGate: 'war' }),
  item({ id: 'mine_disruptor_charge', name: 'Mine Disruptor Charge', group: 'weapons_countermeasure', rarity: 'rare', description: 'Restricted charge for mine disruption.', gameplayRole: 'future hazard/war era item', effectTag: 'mine_counter', canDropInSalvage: true, eraGate: 'war' }),
  item({ id: 'classified_payload_module', name: 'Classified Payload Module', group: 'weapons_countermeasure', rarity: 'classified', description: 'Sealed payload module with Navy classification tags.', gameplayRole: 'future story/weapons item', effectTag: 'classified_payload', canDropInSalvage: true, isStoryItem: true, eraGate: 'war' }),
];

export const CANON_ITEMS_BY_ID: Record<string, ItemDefinition> = Object.fromEntries(
  CANON_ITEMS.map((i) => [i.id, i]),
);

export function normalizeItemId(itemId: string): string {
  return LEGACY_ITEM_ID_TO_CANON[itemId] ?? itemId;
}

export function legacyItemIdToCanonItemId(legacyId: string): string {
  return normalizeItemId(legacyId);
}

export function getItemDefinition(itemId: string): ItemDefinition | undefined {
  return CANON_ITEMS_BY_ID[normalizeItemId(itemId)];
}

export function getAllItemDefinitions(): ItemDefinition[] {
  return [...CANON_ITEMS];
}

export function getItemsByGroup(group: ItemGroup): ItemDefinition[] {
  return CANON_ITEMS.filter((i) => i.group === group);
}

export function repairTemplateIdForCanonItem(itemId: string): string | undefined {
  const def = getItemDefinition(itemId);
  if (def?.legacyRepairTemplateId) return def.legacyRepairTemplateId;
  return CANON_TO_REPAIR_TEMPLATE[normalizeItemId(itemId)];
}

export function getItemDisplayName(itemId: string): string {
  return getItemDefinition(itemId)?.name ?? itemId;
}

export function isItemUnlockedForState(itemId: string, ctx: ItemStateContext): boolean {
  const def = getItemDefinition(itemId);
  if (!def) return false;
  if (def.eraGate && !isEraUnlocked(ctx.canonEra, def.eraGate)) return false;
  if (
    def.revealLevelRequired !== undefined &&
    !canReveal(ctx.canonEra, ctx.revealLevel, def.revealLevelRequired)
  ) {
    return false;
  }
  return true;
}

export function canItemDrop(itemId: string, ctx: ItemStateContext): boolean {
  const def = getItemDefinition(itemId);
  if (!def?.canDropInSalvage) return false;
  return isItemUnlockedForState(itemId, ctx);
}

export function filterDropEligibleItems(
  items: readonly ItemDefinition[],
  ctx: ItemStateContext,
): ItemDefinition[] {
  return items.filter((i) => canItemDrop(i.id, ctx));
}

export function getItemRarityWeight(item: ItemDefinition): number {
  switch (item.rarity) {
    case 'common':
      return 10;
    case 'uncommon':
      return 5;
    case 'rare':
      return 2;
    case 'epic':
      return 1;
    case 'classified':
      return 0.5;
    default:
      return 1;
  }
}

export function normalizeCatalogItems(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    const canonId = normalizeItemId(key);
    if (!getItemDefinition(canonId)) continue;
    out[canonId] = (out[canonId] ?? 0) + Math.floor(value);
  }
  return out;
}

export function mergeCatalogCounts(
  base: Record<string, number>,
  adds: Record<string, number>,
): Record<string, number> {
  const out = { ...base };
  for (const [id, qty] of Object.entries(adds)) {
    if (qty <= 0) continue;
    const canonId = normalizeItemId(id);
    out[canonId] = (out[canonId] ?? 0) + qty;
  }
  return out;
}

export type GroupedCatalogEntry = {
  itemId: string;
  name: string;
  quantity: number;
  rarity: ItemRarity;
};

export function groupCatalogEntries(
  counts: Record<string, number>,
): Partial<Record<ItemGroup, GroupedCatalogEntry[]>> {
  const grouped: Partial<Record<ItemGroup, GroupedCatalogEntry[]>> = {};
  for (const [itemId, quantity] of Object.entries(counts)) {
    if (quantity <= 0) continue;
    const def = getItemDefinition(itemId);
    if (!def) continue;
    const row: GroupedCatalogEntry = {
      itemId: def.id,
      name: def.name,
      quantity,
      rarity: def.rarity,
    };
    grouped[def.group] = [...(grouped[def.group] ?? []), row];
  }
  for (const group of ITEM_GROUP_ORDER) {
    grouped[group]?.sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

export function groupRepairInventoryForDisplay(
  repairRows: { id: string; name: string; quantity: number }[],
): Partial<Record<ItemGroup, GroupedCatalogEntry[]>> {
  const counts: Record<string, number> = {};
  for (const row of repairRows) {
    if (row.quantity <= 0) continue;
    counts[normalizeItemId(row.id)] = (counts[normalizeItemId(row.id)] ?? 0) + row.quantity;
  }
  return groupCatalogEntries(counts);
}
