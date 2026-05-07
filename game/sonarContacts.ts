import type { DiscoveryCategory, DiveRoute, DiveSession, ExternalDiscovery, Mission } from '@/types';
import type { SonarContact, SonarContactType } from '@/types/navigationMap';

import { createId } from '@/game/ids';

const TYPE_DISPLAY: Record<SonarContactType, string> = {
  salvage: 'Salvage Contact',
  signal: 'Signal Contact',
  thermal: 'Thermal Activity',
  volcanic: 'Volcanic Activity',
  terrain: 'Terrain Reference',
  wreck: 'Wreck Site',
  unknown: 'Unknown Contact',
  hazard: 'Hazard',
};

function categoryToSonarType(category: DiscoveryCategory): SonarContactType {
  switch (category) {
    case 'salvage':
      return 'salvage';
    case 'research_signal':
      return 'signal';
    case 'treasure_cache':
      return 'wreck';
    case 'thermal_anomaly':
      return 'thermal';
    case 'biological_contact':
      return 'unknown';
    case 'volcanic_rock':
      return 'volcanic';
    case 'unknown_artifact':
      return 'unknown';
    default:
      return 'unknown';
  }
}

function riskFromBand(band: ExternalDiscovery['riskBand']): SonarContact['risk'] {
  return band;
}

/** Deterministic PRNG for stable ambient contacts during a dive session. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function mixSeed(dive: DiveSession, missionId: string): number {
  const a = Math.floor(dive.startedAt / 1000);
  const b = Math.floor(dive.currentDepthM);
  const c = Math.floor((dive.horizontalDistanceKm ?? 0) * 1000);
  let h = 2166136261 ^ a;
  h = Math.imul(h ^ b, 16777619);
  h = Math.imul(h ^ c, 16777619);
  h = Math.imul(h ^ dive.missionId.length, 16777619);
  for (let i = 0; i < missionId.length; i++) h = Math.imul(h ^ missionId.charCodeAt(i), 16777619);
  return h >>> 0;
}

const AMBIENT_POOLS: Record<
  DiveRoute,
  { types: SonarContactType[]; labels: Partial<Record<SonarContactType, string[]>>; count: [number, number] }
> = {
  push_deeper: {
    types: ['thermal', 'volcanic', 'terrain', 'hazard', 'signal'],
    labels: {
      terrain: ['Rock Formation', 'Coral Wall'],
      hazard: ['Pressure Shear', 'Sediment Plume'],
    },
    count: [3, 5],
  },
  search_salvage: {
    types: ['salvage', 'wreck', 'terrain', 'signal'],
    labels: {
      terrain: ['Debris Lane', 'Rock Formation'],
      salvage: ['Salvage Contact', 'Metal Scatter'],
    },
    count: [4, 6],
  },
  follow_signal: {
    types: ['signal', 'unknown', 'thermal', 'wreck'],
    labels: {
      signal: ['Signal Contact', 'Carrier Echo'],
    },
    count: [4, 6],
  },
  avoid_hazards: {
    types: ['hazard', 'terrain', 'thermal', 'volcanic'],
    labels: {
      terrain: ['Seabed Ridge', 'Coral Wall'],
      hazard: ['Thermal Plume', 'Gas Vent'],
    },
    count: [4, 6],
  },
  stabilize_systems: {
    types: ['terrain', 'signal', 'thermal'],
    labels: {
      terrain: ['Reference Beacon', 'Rock Formation'],
    },
    count: [2, 3],
  },
};

function pickAmbientLabel(type: SonarContactType, pool: (typeof AMBIENT_POOLS)[DiveRoute], rand: () => number): string {
  const custom = pool.labels[type];
  if (custom?.length) return custom[Math.floor(rand() * custom.length)]!;
  return TYPE_DISPLAY[type];
}

function ambientRisk(type: SonarContactType, rand: () => number): SonarContact['risk'] {
  if (type === 'hazard' || type === 'volcanic') return rand() > 0.55 ? 'high' : 'medium';
  if (type === 'thermal') return rand() > 0.6 ? 'medium' : 'low';
  return 'low';
}

function buildAmbientContacts(dive: DiveSession, route: DiveRoute, missionId: string): SonarContact[] {
  const pool = AMBIENT_POOLS[route] ?? AMBIENT_POOLS.stabilize_systems;
  const rand = makeRng(mixSeed(dive, missionId) ^ route.length * 9973);
  const [lo, hi] = pool.count;
  const n = lo + Math.floor(rand() * (hi - lo + 1));
  const out: SonarContact[] = [];
  for (let i = 0; i < n; i++) {
    const t = pool.types[Math.floor(rand() * pool.types.length)]!;
    const bearingDeg = Math.floor(rand() * 360);
    const distanceMeters = 120 + Math.floor(rand() * 2400);
    out.push({
      id: createId('amb'),
      type: t,
      label: pickAmbientLabel(t, pool, rand),
      bearingDeg,
      distanceMeters,
      risk: ambientRisk(t, rand),
      discovered: true,
      source: 'ambient',
    });
  }
  return out;
}

function hasCriticalLeak(dive: DiveSession): boolean {
  return dive.rooms.some((r) => r.cracks.some((c) => c.severity === 'critical'));
}

export function buildSonarContacts(args: {
  dive: DiveSession;
  mission: Mission | null;
  route: DiveRoute;
}): SonarContact[] {
  const { dive, mission, route } = args;
  const missionId = mission?.id ?? dive.missionId;
  const contacts: SonarContact[] = [];

  const pending = dive.pendingDiscovery;
  if (pending) {
    const st = categoryToSonarType(pending.category);
    contacts.push({
      id: createId('son'),
      type: st,
      label: pending.title || TYPE_DISPLAY[st],
      bearingDeg: 38 + (pending.id.length % 180),
      distanceMeters: 420 + (pending.createdAt % 800),
      risk: riskFromBand(pending.riskBand),
      discovered: true,
      relatedDiscoveryId: pending.id,
      source: 'active',
    });
  }

  if (hasCriticalLeak(dive)) {
    contacts.push({
      id: createId('son'),
      type: 'hazard',
      label: 'Hull Stress',
      bearingDeg: 220 + (dive.rooms.length % 90),
      distanceMeters: 180,
      risk: 'high',
      discovered: true,
      source: 'active',
    });
  }

  contacts.push(...buildAmbientContacts(dive, route, missionId));
  return contacts;
}

/** Visual emphasis 0.55–1.35 by command intent (weighted, not mechanical). */
export function sonarBlipEmphasis(type: SonarContactType, route: DiveRoute): number {
  const w = (boost: number) => 0.85 + boost * 0.12;
  switch (route) {
    case 'push_deeper':
      if (type === 'thermal' || type === 'volcanic' || type === 'hazard') return w(1.1);
      if (type === 'salvage' || type === 'wreck') return w(0.35);
      return w(0.55);
    case 'search_salvage':
      if (type === 'salvage' || type === 'wreck') return w(1.15);
      if (type === 'signal' || type === 'unknown') return w(0.45);
      return w(0.65);
    case 'follow_signal':
      if (type === 'signal' || type === 'unknown') return w(1.2);
      if (type === 'salvage' || type === 'wreck') return w(0.5);
      return w(0.65);
    case 'avoid_hazards':
      if (type === 'hazard' || type === 'terrain' || type === 'volcanic') return w(1.1);
      if (type === 'salvage') return w(0.45);
      return w(0.7);
    case 'stabilize_systems':
      return w(0.25);
    default:
      return 1;
  }
}

export function sonarLegendLabel(type: SonarContactType): string {
  return TYPE_DISPLAY[type];
}
