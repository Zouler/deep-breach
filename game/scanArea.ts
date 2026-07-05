import type { CrewMember, DiveSession, ExternalDiscovery, GameEvent, Mission, Submarine } from '@/types';

import { generateExternalDiscovery } from '@/game/discoveries';
import { createId } from '@/game/ids';
import { getCommandIntentModifiers } from '@/game/navigationIntent';
import { depthProgress } from '@/game/pacing';
import { assignedCrew, crewNavigationBonus, riskScalar, sonarQuality } from '@/game/submarineStats';

export const SCAN_AREA_COOLDOWN_MS = 45_000;

export function canPerformAreaScan(dive: DiveSession, now: number): boolean {
  if (dive.status !== 'active') return false;
  if (dive.pendingDiscovery) return false;
  return now - dive.lastAreaScanAt >= SCAN_AREA_COOLDOWN_MS;
}

export function areaScanFindChance(
  mission: Mission,
  dive: DiveSession,
  submarine: Submarine,
  crew: CrewMember[],
): number {
  const rs = riskScalar(mission.risk);
  const sonar = sonarQuality(submarine);
  const nav = crewNavigationBonus(crew);
  const sci = assignedCrew(crew).some((c) => c.role === 'scientist') ? 0.08 : 0;
  const depth = depthProgress(dive) * 0.12;
  const lowMissionBonus = rs < 0.82 ? 0.12 : 0;
  const intent = getCommandIntentModifiers(dive.currentRoute);
  const base =
    (0.38 + sonar * 0.22 + nav * 0.12 + sci + depth + lowMissionBonus) *
    intent.discoveryChanceMultiplier;
  return Math.min(0.92, Math.max(0.12, base));
}

export type AreaScanResult =
  | { kind: 'found'; discovery: ExternalDiscovery }
  | { kind: 'empty'; event: GameEvent };

export function performAreaScan(
  mission: Mission,
  dive: DiveSession,
  submarine: Submarine,
  crew: CrewMember[],
  now: number,
): AreaScanResult {
  const p = areaScanFindChance(mission, dive, submarine, crew);
  if (Math.random() < p) {
    const disc = generateExternalDiscovery(mission, dive, submarine, crew, now, {
      provenance: 'scan',
    });
    if (disc) return { kind: 'found', discovery: disc };
  }
  return {
    kind: 'empty',
    event: {
      id: createId('evt'),
      type: 'sonar_contact',
      message: 'No contacts on current sweep.',
      timestamp: now,
    },
  };
}
