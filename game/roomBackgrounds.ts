import type { ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';
import { LEGACY_ROOM_ID_MAP, type RoomId } from '@/game/rooms';

function canonicalRoomId(roomId: string): RoomId | string {
  return LEGACY_ROOM_ID_MAP[roomId] ?? roomId;
}

/** Room plate background for dive compartment detail screens. */
export function roomBackgroundForId(roomId: string): ImageSourcePropType {
  const id = canonicalRoomId(roomId);
  switch (id) {
    case 'command_center':
      return GAME_ASSETS.bridgeRoomBackground;
    case 'engineering':
      return GAME_ASSETS.engineRoomBackground;
    case 'research_lab':
      return GAME_ASSETS.labRoomBackground;
    case 'cargo_recovery':
      return GAME_ASSETS.cargoRoomBackground;
    default:
      return GAME_ASSETS.diveScreenBg;
  }
}

/** Scrim opacity tuned per room plate brightness. */
export function roomBackgroundScrimForId(roomId: string): number {
  const id = canonicalRoomId(roomId);
  switch (id) {
    case 'research_lab':
      return 0.72;
    case 'engineering':
      return 0.7;
    default:
      return 0.68;
  }
}
