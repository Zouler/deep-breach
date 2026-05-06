import type { Room, Submarine } from '@/types';

import { threatForHigherIsBetter, type ThreatLevel } from '@/game/threatLevels';

/** Single source for room status derived from crack severity (keeps UI consistent). */
export function getRoomStatus(room: Room): Room['status'] {
  if (room.cracks.some((c) => c.severity === 'critical')) return 'flooding';
  if (room.cracks.length > 0) return 'damaged';
  return 'ok';
}

export type SubmarineStatus = {
  label: string;
  level: ThreatLevel;
};

export function getSubmarineStatus(submarine: Submarine): SubmarineStatus {
  const h = submarine.hullIntegrityPercent;
  const level = threatForHigherIsBetter(h);
  const label =
    level === 'safe'
      ? 'Pressure nominal'
      : level === 'warning'
        ? 'Fatigue accumulating'
        : level === 'danger'
          ? 'Structural margins thin'
          : 'Imminent breach risk';
  return { label, level };
}
