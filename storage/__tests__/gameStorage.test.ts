import { createInitialGameState } from '@/game/initialGame';
import { DEFAULT_CANON_ERA, DEFAULT_REVEAL_LEVEL } from '@/game/canon';
import { createDefaultRobertsState } from '@/game/roberts';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';

function legacySaveFixture(): Record<string, unknown> {
  const state = createInitialGameState() as unknown as Record<string, unknown>;
  // Simulate an old save predating fields added later without a version bump.
  const {
    narrativeRecap,
    crewState,
    pendingInternalCrewEventId,
    resolvedInternalCrewEventIds,
    completedTrialReturnsCount,
    internalCrewReturnsSinceLastEvent,
    internalCrewNextEventAtReturns,
    lastInternalCrewEventAt,
    trialProgressByMissionId,
    commander,
    story,
    baseStorage,
    canonEra,
    revealLevel,
    completedSpineEvents,
    roberts,
    compartments,
    version,
    ...legacyShape
  } = state;
  return legacyShape;
}

function legacyV3SaveFixture(): Record<string, unknown> {
  const state = createInitialGameState() as unknown as Record<string, unknown>;
  const { compartments, version, ...rest } = state;
  return { ...rest, version: 3 };
}

function legacyV2SaveFixture(): Record<string, unknown> {
  const state = createInitialGameState() as unknown as Record<string, unknown>;
  const { roberts, version, ...rest } = state;
  return { ...rest, version: 2 };
}

function legacyV1SaveFixture(): Record<string, unknown> {
  return { ...legacySaveFixture(), version: 1 };
}

describe('migrateGameState', () => {
  it('returns null for garbage input instead of throwing', () => {
    expect(migrateGameState(null)).toBeNull();
    expect(migrateGameState(undefined)).toBeNull();
    expect(migrateGameState('not an object')).toBeNull();
    expect(migrateGameState(42)).toBeNull();
  });

  it('refuses to read a save from a newer, unknown version', () => {
    const future = { ...legacySaveFixture(), version: GAME_STATE_VERSION + 1 };
    expect(migrateGameState(future)).toBeNull();
  });

  it('backfills every field a legacy save is missing, without throwing', () => {
    const legacy = legacySaveFixture();
    expect(legacy.narrativeRecap).toBeUndefined();
    expect(legacy.baseStorage).toBeUndefined();
    expect(legacy.canonEra).toBeUndefined();

    const migrated = migrateGameState(legacy);

    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.canonEra).toBe(DEFAULT_CANON_ERA);
    expect(migrated!.revealLevel).toBe(DEFAULT_REVEAL_LEVEL);
    expect(migrated!.completedSpineEvents).toEqual([]);
    expect(migrated!.roberts).toEqual(createDefaultRobertsState());
    expect(migrated!.narrativeRecap).toEqual({
      lastGlobalBackgroundAt: null,
      lastXOBriefingDismissedFingerprint: null,
      lastXOBriefingDismissedAt: null,
    });
    expect(migrated!.crewState).toBeDefined();
    expect(migrated!.baseStorage).toBeDefined();
    expect(migrated!.commander).toBeDefined();
    expect(migrated!.story).toBeDefined();
    expect(migrated!.trialProgressByMissionId).toEqual({});
    expect(migrated!.resolvedInternalCrewEventIds).toEqual([]);
  });

  it('migrates explicit v1 saves with canon defaults', () => {
    const migrated = migrateGameState(legacyV1SaveFixture());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.canonEra).toBe(DEFAULT_CANON_ERA);
    expect(migrated!.revealLevel).toBe(DEFAULT_REVEAL_LEVEL);
    expect(migrated!.completedSpineEvents).toEqual([]);
  });

  it('migrates explicit v2 saves with Roberts defaults', () => {
    const migrated = migrateGameState(legacyV2SaveFixture());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.roberts).toEqual(createDefaultRobertsState());
  });

  it('migrates explicit v3 saves with compartment defaults', () => {
    const migrated = migrateGameState(legacyV3SaveFixture());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(Object.keys(migrated!.compartments)).toHaveLength(14);
  });

  it('returns null for corrupt saves so callers can fall back to a fresh game', () => {
    expect(migrateGameState({ version: 1, profile: null })).toBeNull();
    const fresh = createInitialGameState();
    expect(fresh.canonEra).toBe(DEFAULT_CANON_ERA);
    expect(fresh.revealLevel).toBe(DEFAULT_REVEAL_LEVEL);
    expect(fresh.completedSpineEvents).toEqual([]);
    expect(fresh.roberts).toEqual(createDefaultRobertsState());
    expect(Object.keys(fresh.compartments)).toHaveLength(14);
    expect(fresh.catalogItems).toEqual({});
  });

  it('is idempotent when applied to an already-current-version save', () => {
    const fresh = createInitialGameState();
    const migrated = migrateGameState(fresh);
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
  });
});
