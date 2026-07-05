/**
 * DBX-07 canon compartment registry — data-driven submarine rooms.
 * @see docs/source-of-truth/deep-breach-story-canon-sot-v0.2.md
 */

import type { CanonEra } from '@/game/canon';
import { canReveal, isEraUnlocked } from '@/game/canon';
import type { Crack, Room, RoomStatus } from '@/types';

export type RoomId =
  | 'command_center'
  | 'sonar_room'
  | 'navigation'
  | 'engineering'
  | 'hull_ballast'
  | 'life_support'
  | 'communications'
  | 'optics_mast'
  | 'weapons_room'
  | 'research_lab'
  | 'cargo_recovery'
  | 'medical_bay'
  | 'security_brig'
  | 'crew_quarters';

export type RoomSystem =
  | 'command'
  | 'sonar'
  | 'navigation'
  | 'propulsion'
  | 'hull_ballast'
  | 'life_support'
  | 'comms'
  | 'optics'
  | 'weapons'
  | 'research'
  | 'cargo_recovery'
  | 'medical'
  | 'security'
  | 'morale';

export interface RoomDefinition {
  id: RoomId;
  name: string;
  shortName?: string;
  system: RoomSystem;
  description: string;
  gameplayRole: string;
  defaultUnlocked: boolean;
  lockedByDefault?: boolean;
  unlockEra?: CanonEra;
  revealLevelRequired?: number;
  isCritical?: boolean;
  canTakeDamage?: boolean;
  canHostLeaks?: boolean;
  canHostElectricalFaults?: boolean;
  futureGameplayTags?: string[];
}

export interface CompartmentSaveState {
  unlocked: boolean;
}

export type RoomContext = {
  canonEra: CanonEra;
  revealLevel: number;
  compartments: Record<RoomId, CompartmentSaveState>;
};

/** Legacy dive room ids from pre-registry builds. */
export const LEGACY_ROOM_ID_MAP: Record<string, RoomId> = {
  bridge: 'command_center',
  engine: 'engineering',
  lab: 'research_lab',
  cargo: 'cargo_recovery',
};

export const ROOM_DEFINITIONS: readonly RoomDefinition[] = [
  {
    id: 'command_center',
    name: 'Command Center',
    shortName: 'Command',
    system: 'command',
    description: 'Primary command deck for mission oversight, intent, and officer coordination.',
    gameplayRole: 'Central decision space; mission status, alerts, and command intent.',
    defaultUnlocked: true,
    isCritical: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: true,
    futureGameplayTags: ['command_intent', 'xo_briefing'],
  },
  {
    id: 'sonar_room',
    name: 'Sonar Room',
    shortName: 'Sonar',
    system: 'sonar',
    description: 'Passive and active acoustic monitoring, contact classification, and signal tracking.',
    gameplayRole: 'Sonar contacts, scan support, anomaly interference.',
    defaultUnlocked: true,
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['passive_sonar', 'active_ping', 'scan_area'],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    shortName: 'Nav',
    system: 'navigation',
    description: 'Depth plotting, course setting, route planning, and tactical movement.',
    gameplayRole: 'Route selection, depth control context, collision risk.',
    defaultUnlocked: true,
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['route_planning', 'depth_plot'],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    shortName: 'Engineering',
    system: 'propulsion',
    description: 'Propulsion, power distribution, engine strain, and mechanical systems.',
    gameplayRole: 'Engine heat, power stability, mechanical crises.',
    defaultUnlocked: true,
    isCritical: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: true,
    futureGameplayTags: ['engine_heat', 'blackout'],
  },
  {
    id: 'hull_ballast',
    name: 'Hull & Ballast Control',
    shortName: 'Hull/Ballast',
    system: 'hull_ballast',
    description: 'Pressure hull, ballast tanks, trim, flooding response, and emergency ascent.',
    gameplayRole: 'Hull integrity context, flooding, crush depth risk.',
    defaultUnlocked: true,
    isCritical: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: false,
    futureGameplayTags: ['emergency_blow', 'trim'],
  },
  {
    id: 'life_support',
    name: 'Life Support',
    shortName: 'Life Support',
    system: 'life_support',
    description: 'Oxygen generation, air recycling, CO2 scrubbing, and crew survivability.',
    gameplayRole: 'Oxygen context, contamination events, crew endurance.',
    defaultUnlocked: true,
    isCritical: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: true,
    futureGameplayTags: ['oxygen', 'co2_scrubber'],
  },
  {
    id: 'communications',
    name: 'Communications',
    shortName: 'Comms',
    system: 'comms',
    description: 'Navy message traffic, distress beacons, and encrypted transmissions.',
    gameplayRole: 'Orders, blackouts, corrupted signals.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'dead_beacon',
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['vlf', 'beacon'],
  },
  {
    id: 'optics_mast',
    name: 'Optics Mast',
    shortName: 'Optics',
    system: 'optics',
    description: 'Photonics mast for shallow visual recon and surface confirmation.',
    gameplayRole: 'Limited-depth visual recon; future IR/thermal upgrades.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'anomaly_growth',
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['periscope', 'surface_recon'],
  },
  {
    id: 'weapons_room',
    name: 'Weapons & Countermeasures',
    shortName: 'Weapons',
    system: 'weapons',
    description: 'Torpedo tubes, decoys, acoustic countermeasures, and defensive systems.',
    gameplayRole: 'Story-gated weapons and countermeasures — not available early.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'war',
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['torpedo', 'decoy', 'countermeasure'],
  },
  {
    id: 'research_lab',
    name: 'Research Lab',
    shortName: 'Research',
    system: 'research',
    description: 'Anomaly samples, artifact analysis, and scientific briefings.',
    gameplayRole: 'Research data, samples, anomaly analysis.',
    defaultUnlocked: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: true,
    futureGameplayTags: ['artifact', 'sample'],
  },
  {
    id: 'cargo_recovery',
    name: 'Cargo & Recovery Bay',
    shortName: 'Cargo',
    system: 'cargo_recovery',
    description: 'Salvage staging, ROV deployment, and recovered item transfer.',
    gameplayRole: 'Loot staging, cargo capacity, recovery operations.',
    defaultUnlocked: true,
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: false,
    futureGameplayTags: ['salvage', 'rov'],
  },
  {
    id: 'medical_bay',
    name: 'Medical Bay',
    shortName: 'Medical',
    system: 'medical',
    description: 'Injury treatment, crew health, and psychological recovery.',
    gameplayRole: 'Crew injuries, triage, stress recovery.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'anomaly_growth',
    canTakeDamage: true,
    canHostLeaks: true,
    canHostElectricalFaults: false,
    futureGameplayTags: ['triage', 'sedation'],
  },
  {
    id: 'security_brig',
    name: 'Security & Brig',
    shortName: 'Security',
    system: 'security',
    description: 'CSO domain — internal order, confinement, and sabotage investigation.',
    gameplayRole: 'Discipline, brig, restricted access.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'anomaly_growth',
    canTakeDamage: true,
    canHostLeaks: false,
    canHostElectricalFaults: true,
    futureGameplayTags: ['cso', 'brig'],
  },
  {
    id: 'crew_quarters',
    name: 'Crew Quarters',
    shortName: 'Quarters',
    system: 'morale',
    description: 'Crew rest, morale, personal scenes, and Roberts downtime.',
    gameplayRole: 'Morale, fatigue, interpersonal scenes.',
    defaultUnlocked: false,
    lockedByDefault: true,
    unlockEra: 'anomaly_growth',
    canTakeDamage: false,
    canHostLeaks: false,
    canHostElectricalFaults: false,
    futureGameplayTags: ['morale', 'rest'],
  },
] as const;

export const ROOM_DEFINITIONS_BY_ID: Record<RoomId, RoomDefinition> = Object.fromEntries(
  ROOM_DEFINITIONS.map((def) => [def.id, def]),
) as Record<RoomId, RoomDefinition>;

export const ALL_ROOM_IDS: readonly RoomId[] = ROOM_DEFINITIONS.map((d) => d.id);

export function resolveRoomId(roomId: string): RoomId | null {
  const mapped = LEGACY_ROOM_ID_MAP[roomId] ?? roomId;
  return ALL_ROOM_IDS.includes(mapped as RoomId) ? (mapped as RoomId) : null;
}

export function getRoomDefinition(roomId: string): RoomDefinition | undefined {
  const id = resolveRoomId(roomId);
  return id ? ROOM_DEFINITIONS_BY_ID[id] : undefined;
}

export function getRoomDisplayName(roomId: string): string {
  return getRoomDefinition(roomId)?.name ?? roomId;
}

export function getRoomsBySystem(system: RoomSystem): RoomDefinition[] {
  return ROOM_DEFINITIONS.filter((d) => d.system === system);
}

export function isPropulsionRoom(roomId: string): boolean {
  return getRoomDefinition(roomId)?.system === 'propulsion';
}

export function computeRoomUnlockedFromCanon(
  def: RoomDefinition,
  ctx: Pick<RoomContext, 'canonEra' | 'revealLevel'>,
): boolean {
  if (def.unlockEra) {
    if (!isEraUnlocked(ctx.canonEra, def.unlockEra)) return false;
  } else if (!def.defaultUnlocked) {
    return false;
  }
  if (
    def.revealLevelRequired !== undefined &&
    !canReveal(ctx.canonEra, ctx.revealLevel, def.revealLevelRequired as never)
  ) {
    return false;
  }
  return true;
}

export function normalizeCompartmentRegistry(
  ctx: Pick<RoomContext, 'canonEra' | 'revealLevel' | 'compartments'>,
): Record<RoomId, CompartmentSaveState> {
  const out = {} as Record<RoomId, CompartmentSaveState>;
  for (const def of ROOM_DEFINITIONS) {
    out[def.id] = { unlocked: computeRoomUnlockedFromCanon(def, ctx) };
  }
  return out;
}

export function createDefaultRoomContext(): RoomContext {
  const canonEra = 'experimental_trials' as const;
  const revealLevel = 0;
  const compartments = normalizeCompartmentRegistry({
    canonEra,
    revealLevel,
    compartments: {} as Record<RoomId, CompartmentSaveState>,
  });
  return { canonEra, revealLevel, compartments };
}

export function isRoomUnlocked(roomId: string, ctx: RoomContext): boolean {
  const id = resolveRoomId(roomId);
  if (!id) return false;
  const entry = ctx.compartments[id];
  if (entry) return entry.unlocked;
  const def = ROOM_DEFINITIONS_BY_ID[id];
  return def ? computeRoomUnlockedFromCanon(def, ctx) : false;
}

export function getUnlockedRoomDefinitions(ctx: RoomContext): RoomDefinition[] {
  return ROOM_DEFINITIONS.filter((def) => isRoomUnlocked(def.id, ctx));
}

export function canRoomBeTargetedByDiveEvent(roomId: string, ctx: RoomContext): boolean {
  const def = getRoomDefinition(roomId);
  if (!def) return false;
  if (!isRoomUnlocked(roomId, ctx)) return false;
  if (def.canTakeDamage === false) return false;
  return def.canHostLeaks !== false || def.canTakeDamage === true;
}

export function roomContextFromGameState(
  state: Pick<RoomContext, 'canonEra' | 'revealLevel' | 'compartments'>,
): RoomContext {
  const compartments = normalizeCompartmentRegistry(state);
  return { canonEra: state.canonEra, revealLevel: state.revealLevel, compartments };
}

export function createDiveRooms(ctx: RoomContext): Room[] {
  return getUnlockedRoomDefinitions(ctx).map((def) => ({
    id: def.id,
    name: def.name,
    status: 'ok' as const,
    cracks: [],
    loot: [],
  }));
}

/** @deprecated Use createDiveRooms with RoomContext */
export function createEmptyRooms(ctx?: RoomContext): Room[] {
  return createDiveRooms(ctx ?? createDefaultRoomContext());
}

function mergeRoomState(existing: Room, incoming: Room, def: RoomDefinition): Room {
  return {
    id: def.id,
    name: def.name,
    status: pickWorstRoomStatus(existing.status, incoming.status),
    cracks: [...existing.cracks, ...incoming.cracks].map((c) => ({
      ...c,
      roomId: def.id,
    })),
    loot: dedupeLoot([...existing.loot, ...incoming.loot]),
  };
}

function pickWorstRoomStatus(a: RoomStatus, b: RoomStatus): RoomStatus {
  const rank: Record<RoomStatus, number> = { ok: 0, damaged: 1, flooding: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function dedupeLoot(loot: Room['loot']): Room['loot'] {
  const seen = new Set<string>();
  const out: Room['loot'] = [];
  for (const item of loot) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function migrateSingleRoom(room: Room): { id: RoomId; room: Room } | null {
  const id = resolveRoomId(room.id);
  if (!id) return null;
  const def = ROOM_DEFINITIONS_BY_ID[id];
  return {
    id,
    room: {
      ...room,
      id: def.id,
      name: def.name,
      cracks: room.cracks.map((c) => ({ ...c, roomId: def.id })),
    },
  };
}

export function normalizeDiveRooms(rooms: Room[] | undefined, ctx: RoomContext): Room[] {
  const merged = new Map<RoomId, Room>();
  for (const room of rooms ?? []) {
    const migrated = migrateSingleRoom(room);
    if (!migrated) continue;
    const def = ROOM_DEFINITIONS_BY_ID[migrated.id];
    const prev = merged.get(migrated.id);
    merged.set(migrated.id, prev ? mergeRoomState(prev, migrated.room, def) : migrated.room);
  }

  const defaults = createDiveRooms(ctx);
  return defaults.map((d) => merged.get(d.id as RoomId) ?? d);
}

export function normalizeRooms(existingRooms: Room[] | undefined, ctx: RoomContext): Room[] {
  return normalizeDiveRooms(existingRooms, ctx);
}

export function getLockedRoomLabel(def: RoomDefinition): string {
  if (def.system === 'weapons') return 'Classified — authorization pending';
  if (def.unlockEra === 'dead_beacon') return 'Sealed — awaiting operational clearance';
  return 'Not yet operational';
}

export function normalizeCompartmentsFromUnknown(
  value: unknown,
  ctx: Pick<RoomContext, 'canonEra' | 'revealLevel'>,
): Record<RoomId, CompartmentSaveState> {
  const partial =
    value && typeof value === 'object'
      ? (value as Record<string, Partial<CompartmentSaveState>>)
      : {};
  const merged: Record<RoomId, CompartmentSaveState> = {} as Record<RoomId, CompartmentSaveState>;
  for (const def of ROOM_DEFINITIONS) {
    const saved = partial[def.id];
    merged[def.id] = {
      unlocked:
        typeof saved?.unlocked === 'boolean'
          ? saved.unlocked
          : computeRoomUnlockedFromCanon(def, ctx),
    };
  }
  return normalizeCompartmentRegistry({ ...ctx, compartments: merged });
}
