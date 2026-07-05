import type { Room } from '@/types';
import { isPropulsionRoom } from '@/game/rooms';
import { ENGINE_HEAT_CRITICAL_PCT, ENGINE_HEAT_WARNING_PCT } from '@/game/engineHeat';

/** Visual / UX tier for a compartment during a dive (independent of stored RoomStatus). */
export type DiveRoomThreat = 'safe' | 'warning' | 'danger' | 'critical';

function heatThreat(heatPercent: number): DiveRoomThreat {
  if (heatPercent >= ENGINE_HEAT_CRITICAL_PCT) return 'critical';
  if (heatPercent >= ENGINE_HEAT_WARNING_PCT) return 'danger';
  if (heatPercent > 0) return 'warning';
  return 'safe';
}

const TIER_RANK: Record<DiveRoomThreat, number> = { safe: 0, warning: 1, danger: 2, critical: 3 };

/** `engineHeatPercent` only applies to the Engine Bay; omit for other rooms. */
export function getDiveRoomThreat(room: Room, engineHeatPercent?: number): DiveRoomThreat {
  let tier: DiveRoomThreat = 'safe';
  if (room.cracks.some((c) => c.severity === 'critical')) tier = 'critical';
  else if (room.cracks.some((c) => c.severity === 'moderate')) tier = 'danger';
  else if (room.cracks.length > 0) tier = 'warning';
  else if (room.status === 'flooding') tier = 'critical';
  else if (room.status === 'damaged') tier = 'warning';

  if (isPropulsionRoom(room.id) && typeof engineHeatPercent === 'number') {
    const heat = heatThreat(engineHeatPercent);
    if (TIER_RANK[heat] > TIER_RANK[tier]) tier = heat;
  }

  return tier;
}
