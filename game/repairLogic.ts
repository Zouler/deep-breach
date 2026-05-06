import type { Crack, CrackSeverity, DiveSession, RepairItem, Room } from '@/types';

const ORDER: CrackSeverity[] = ['hairline', 'moderate', 'critical'];

function severityIndex(s: CrackSeverity): number {
  return ORDER.indexOf(s);
}

export function canRepairWithItem(
  crack: Crack,
  item: RepairItem,
): boolean {
  if (item.kind === 'oxygen') return false;
  if (item.quantity <= 0) return false;
  return severityIndex(crack.severity) <= severityIndex(item.maxSeverity);
}

export function applyRepairToCrack(
  crack: Crack,
  item: RepairItem,
): { crack: Crack | null; consumed: boolean } {
  if (!canRepairWithItem(crack, item)) return { crack, consumed: false };
  if (crack.severity === 'critical') {
    return {
      crack: { ...crack, severity: 'moderate', leakRatePerSecond: 0.11 },
      consumed: true,
    };
  }
  if (crack.severity === 'moderate') {
    return {
      crack: { ...crack, severity: 'hairline', leakRatePerSecond: 0.045 },
      consumed: true,
    };
  }
  return { crack: null, consumed: true };
}

export function roomAfterRepair(room: Room, crackId: string, newCrackState: Crack | null): Room {
  const cracks = room.cracks
    .map((c) => (c.id === crackId ? newCrackState : c))
    .filter((c): c is Crack => Boolean(c));
  const status: Room['status'] =
    cracks.some((c) => c.severity === 'critical')
      ? 'flooding'
      : cracks.length
        ? 'damaged'
        : 'ok';
  return { ...room, cracks, status };
}

export function diveHullBumpAfterRepair(dive: DiveSession, amount: number): DiveSession {
  return {
    ...dive,
    hullIntegrityPercent: Math.min(100, dive.hullIntegrityPercent + amount),
  };
}
