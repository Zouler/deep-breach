import type { Room } from '@/types';

/** Align `room.status` with current cracks (call after tick/repair). */
export function syncRoomStatuses(rooms: Room[]): Room[] {
  return rooms.map((room) => {
    const status: Room['status'] = room.cracks.some((c) => c.severity === 'critical')
      ? 'flooding'
      : room.cracks.length > 0
        ? 'damaged'
        : 'ok';
    if (status === room.status) return room;
    return { ...room, status };
  });
}
