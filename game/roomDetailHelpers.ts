import type { Crack, RepairItem, Room } from '@/types';

import { getDiveRoomThreat } from '@/game/diveRoomThreat';
import { validateRepairPreconditions } from '@/game/repairOutcome';

export type RoomDamageBadge = 'SAFE' | 'WARNING' | 'DAMAGED' | 'CRITICAL';

export function getRoomDamageBadge(room: Room): RoomDamageBadge {
  const t = getDiveRoomThreat(room);
  switch (t) {
    case 'safe':
      return 'SAFE';
    case 'warning':
      return 'WARNING';
    case 'danger':
      return 'DAMAGED';
    case 'critical':
      return 'CRITICAL';
    default:
      return 'SAFE';
  }
}

export function getTotalLeakRate(room: Room): number {
  return room.cracks.reduce((sum, c) => sum + c.leakRatePerSecond, 0);
}

export function formatSeverityUi(severity: Crack['severity']): string {
  return severity.toUpperCase();
}

/**
 * UI recommendation aligned with repair rules: only sealant can engage `critical` cracks.
 */
export function getRecommendedRepairItemId(crack: Crack): string {
  if (crack.severity === 'hairline') return 'patch_kit';
  if (crack.severity === 'moderate') return 'pressure_sealant';
  return 'pressure_sealant';
}

const PURPOSE: Record<string, string> = {
  patch_kit: 'Best for small cracks',
  pressure_sealant: 'Best for moderate leaks',
  brace_frame: 'Best for severe breaches',
};

export function getRepairItemPurpose(templateId: string): string {
  return PURPOSE[templateId] ?? 'Field repair tool';
}

export const REPAIR_TOOL_ORDER = ['patch_kit', 'pressure_sealant', 'brace_frame'] as const;

export function getExpeditionRepairTools(inventory: RepairItem[]): RepairItem[] {
  const map = new Map(inventory.map((i) => [i.id, i]));
  return REPAIR_TOOL_ORDER.map((id) => map.get(id)).filter(Boolean) as RepairItem[];
}

export function getRepairActionAvailability(
  crack: Crack,
  item: RepairItem,
): { available: boolean; reason?: string } {
  if (item.quantity <= 0) {
    return { available: false, reason: 'No stock' };
  }
  const pre = validateRepairPreconditions(crack, item);
  if (!pre.ok) {
    return { available: false, reason: pre.reason };
  }
  return { available: true };
}
