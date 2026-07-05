import { DEFAULT_CANON_ERA } from '@/game/canon';
import { randomRoomId } from '@/game/diveEvents';
import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';
import {
  ALL_ROOM_IDS,
  canRoomBeTargetedByDiveEvent,
  computeRoomUnlockedFromCanon,
  createDiveRooms,
  getRoomDefinition,
  getUnlockedRoomDefinitions,
  isRoomUnlocked,
  LEGACY_ROOM_ID_MAP,
  normalizeCompartmentRegistry,
  normalizeDiveRooms,
  roomContextFromGameState,
  ROOM_DEFINITIONS,
  ROOM_DEFINITIONS_BY_ID,
} from '@/game/rooms';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';
import type { Room } from '@/types';

function trialsContext() {
  const state = createInitialGameState();
  return roomContextFromGameState(state);
}

describe('DBX-07 room registry', () => {
  it('defines all 14 canon compartments', () => {
    expect(ROOM_DEFINITIONS).toHaveLength(14);
    expect(ALL_ROOM_IDS).toHaveLength(14);
    expect(new Set(ALL_ROOM_IDS).size).toBe(14);
  });

  it('includes required metadata on every room', () => {
    for (const def of ROOM_DEFINITIONS) {
      expect(def.id).toBeTruthy();
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.system).toBeTruthy();
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.gameplayRole.length).toBeGreaterThan(0);
      expect(typeof def.defaultUnlocked).toBe('boolean');
      expect(ROOM_DEFINITIONS_BY_ID[def.id]).toEqual(def);
    }
  });

  it('locks weapons room before war era', () => {
    const ctx = trialsContext();
    expect(isRoomUnlocked('weapons_room', ctx)).toBe(false);
    expect(
      computeRoomUnlockedFromCanon(getRoomDefinition('weapons_room')!, {
        canonEra: 'dead_beacon',
        revealLevel: 0,
      }),
    ).toBe(false);
    expect(
      computeRoomUnlockedFromCanon(getRoomDefinition('weapons_room')!, {
        canonEra: 'war',
        revealLevel: 0,
      }),
    ).toBe(true);
  });

  it('keeps default playable trial compartments available', () => {
    const unlocked = getUnlockedRoomDefinitions(trialsContext()).map((d) => d.id);
    expect(unlocked).toContain('command_center');
    expect(unlocked).toContain('engineering');
    expect(unlocked).toContain('life_support');
    expect(unlocked).toContain('cargo_recovery');
    expect(unlocked).toContain('research_lab');
    expect(unlocked).toContain('navigation');
    expect(unlocked).toContain('sonar_room');
    expect(unlocked).toContain('hull_ballast');
    expect(unlocked).not.toContain('weapons_room');
    expect(unlocked).not.toContain('communications');
  });

  it('does not target locked rooms in random dive events', () => {
    const ctx = trialsContext();
    const rooms = createDiveRooms(ctx);
    for (let i = 0; i < 30; i++) {
      const id = randomRoomId(rooms, ctx);
      expect(canRoomBeTargetedByDiveEvent(id, ctx)).toBe(true);
      expect(isRoomUnlocked(id, ctx)).toBe(true);
    }
    expect(canRoomBeTargetedByDiveEvent('weapons_room', ctx)).toBe(false);
  });

  it('maps legacy room ids to canon ids', () => {
    expect(LEGACY_ROOM_ID_MAP.bridge).toBe('command_center');
    expect(LEGACY_ROOM_ID_MAP.engine).toBe('engineering');
  });

  it('normalizes legacy dive rooms and preserves damage state', () => {
    const ctx = trialsContext();
    const legacyRooms: Room[] = [
      {
        id: 'engine',
        name: 'Engine Bay',
        status: 'damaged',
        cracks: [
          {
            id: 'c1',
            roomId: 'engine',
            severity: 'moderate',
            leakRatePerSecond: 0.1,
            spawnedAt: 1,
            escalatesAt: null,
          },
        ],
        loot: [],
      },
      {
        id: 'bridge',
        name: 'Bridge',
        status: 'ok',
        cracks: [],
        loot: [],
      },
    ];
    const normalized = normalizeDiveRooms(legacyRooms, ctx);
    const engineering = normalized.find((r) => r.id === 'engineering');
    expect(engineering).toBeDefined();
    expect(engineering!.status).toBe('damaged');
    expect(engineering!.cracks[0]!.roomId).toBe('engineering');
    expect(normalized.find((r) => r.id === 'command_center')).toBeDefined();
  });

  it('getUnlockedRoomDefinitions respects era gates', () => {
    const deadBeacon = roomContextFromGameState({
      canonEra: 'dead_beacon',
      revealLevel: 0,
      compartments: normalizeCompartmentRegistry({
        canonEra: 'dead_beacon',
        revealLevel: 0,
        compartments: {} as never,
      }),
    });
    const ids = getUnlockedRoomDefinitions(deadBeacon).map((d) => d.id);
    expect(ids).toContain('communications');
    expect(ids).not.toContain('weapons_room');
    expect(ids).not.toContain('optics_mast');
  });
});

describe('room save migration', () => {
  function legacyV3WithoutCompartments(): Record<string, unknown> {
    const state = createInitialGameState() as unknown as Record<string, unknown>;
    const { compartments, version, ...rest } = state;
    return { ...rest, version: 3 };
  }

  it('migrates v3 saves to v4 with full compartment registry', () => {
    const migrated = migrateGameState(legacyV3WithoutCompartments());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(Object.keys(migrated!.compartments)).toHaveLength(14);
    expect(migrated!.canonEra).toBe(DEFAULT_CANON_ERA);
  });

  it('migrates active dive legacy rooms on v3 → v4', () => {
    const state = createInitialGameState();
    const mission = state.missions[0]!;
    const dive = createDiveSessionForMission(mission, state.submarine, 0, state);
    dive.rooms = [
      {
        id: 'cargo',
        name: 'Cargo Lockers',
        status: 'flooding',
        cracks: [
          {
            id: 'x',
            roomId: 'cargo',
            severity: 'critical',
            leakRatePerSecond: 0.2,
            spawnedAt: 100,
            escalatesAt: null,
          },
        ],
        loot: [],
      },
    ];
    const raw = {
      ...(state as unknown as Record<string, unknown>),
      version: 3,
      dive,
      compartments: undefined,
    };
    const migrated = migrateGameState(raw);
    const cargo = migrated!.dive!.rooms.find((r) => r.id === 'cargo_recovery');
    expect(cargo).toBeDefined();
    expect(cargo!.status).toBe('flooding');
    expect(cargo!.cracks).toHaveLength(1);
  });

  it('new game initializes compartment registry', () => {
    const state = createInitialGameState();
    expect(Object.keys(state.compartments)).toHaveLength(14);
    expect(state.compartments.weapons_room!.unlocked).toBe(false);
  });
});

describe('room registry regression', () => {
  it('does not mutate compartments via unrelated reducer actions', () => {
    const state = createInitialGameState();
    const next = reduceGame(state, { type: 'STORY_MARK_ASSIGNMENT_BRIEFING_SEEN' });
    expect(next.compartments).toEqual(state.compartments);
  });
});
