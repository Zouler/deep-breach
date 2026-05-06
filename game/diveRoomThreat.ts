import type { Room } from '@/types';

/** Visual / UX tier for a compartment during a dive (independent of stored RoomStatus). */
export type DiveRoomThreat = 'safe' | 'warning' | 'danger' | 'critical';

export function getDiveRoomThreat(room: Room): DiveRoomThreat {
  if (room.cracks.some((c) => c.severity === 'critical')) return 'critical';
  if (room.cracks.some((c) => c.severity === 'moderate')) return 'danger';
  if (room.cracks.length > 0) return 'warning';
  if (room.status === 'flooding') return 'critical';
  if (room.status === 'damaged') return 'warning';
  return 'safe';
}
