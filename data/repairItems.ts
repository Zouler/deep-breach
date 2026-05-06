import type { RepairItem } from '@/types';

/** Canonical templates (quantity is overwritten per context). */
export const REPAIR_ITEM_TEMPLATES: RepairItem[] = [
  {
    id: 'patch_kit',
    name: 'Hull Patch Kit',
    kind: 'patch',
    maxSeverity: 'moderate',
    power: 2.2,
    quantity: 0,
  },
  {
    id: 'pressure_sealant',
    name: 'Pressure Sealant',
    kind: 'sealant',
    maxSeverity: 'critical',
    power: 3.4,
    quantity: 0,
  },
  {
    id: 'brace_frame',
    name: 'Emergency Brace',
    kind: 'brace',
    maxSeverity: 'moderate',
    power: 2.6,
    quantity: 0,
  },
  {
    id: 'oxygen_canister',
    name: 'Oxygen Canister',
    kind: 'oxygen',
    maxSeverity: 'hairline',
    power: 0,
    quantity: 0,
  },
];

/** Base / drydock stock for a new game (between missions). */
export const STARTER_REPAIR_INVENTORY: RepairItem[] = [
  { ...REPAIR_ITEM_TEMPLATES[0], quantity: 3 },
  { ...REPAIR_ITEM_TEMPLATES[1], quantity: 1 },
  { ...REPAIR_ITEM_TEMPLATES[2], quantity: 2 },
  { ...REPAIR_ITEM_TEMPLATES[3], quantity: 0 },
];

const EXPEDITION_START: Record<string, number> = {
  patch_kit: 1,
  pressure_sealant: 1,
  brace_frame: 0,
  oxygen_canister: 1,
};

export function createExpeditionRepairInventory(): RepairItem[] {
  return REPAIR_ITEM_TEMPLATES.map((t) => ({
    ...t,
    quantity: EXPEDITION_START[t.id] ?? 0,
  }));
}

export function repairTemplateById(id: string): RepairItem | undefined {
  return REPAIR_ITEM_TEMPLATES.find((t) => t.id === id);
}
