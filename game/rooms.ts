import type { Room } from '@/types';

export const DEFAULT_ROOM_BLUEPRINTS: Omit<Room, 'cracks' | 'loot' | 'status'>[] = [
  { id: 'bridge', name: 'Bridge' },
  { id: 'engine', name: 'Engine Bay' },
  { id: 'lab', name: 'Research Lab' },
  { id: 'cargo', name: 'Cargo Lockers' },
];

export function createEmptyRooms(): Room[] {
  return DEFAULT_ROOM_BLUEPRINTS.map((b) => ({
    ...b,
    status: 'ok' as const,
    cracks: [],
    loot: [],
  }));
}
