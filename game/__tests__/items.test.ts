import { DEFAULT_CANON_ERA, DEFAULT_REVEAL_LEVEL } from '@/game/canon';
import {
  CANON_ITEMS,
  getAllItemDefinitions,
  getItemDefinition,
  getItemsByGroup,
  groupCatalogEntries,
  groupRepairInventoryForDisplay,
  ITEM_GROUP_ORDER,
  legacyItemIdToCanonItemId,
  canItemDrop,
  filterDropEligibleItems,
  isItemUnlockedForState,
  normalizeItemId,
  type ItemDefinition,
  type ItemGroup,
} from '@/game/items';
import { createInitialGameState } from '@/game/initialGame';
import { migrateGameState } from '@/storage/gameStorage';
import { GAME_STATE_VERSION } from '@/types';

const REQUIRED_FIELDS: (keyof ItemDefinition)[] = [
  'id',
  'name',
  'group',
  'rarity',
  'description',
  'gameplayRole',
  'effectTag',
  'canDropInSalvage',
];

function itemCtx(
  overrides: Partial<{ canonEra: typeof DEFAULT_CANON_ERA; revealLevel: number }> = {},
) {
  return {
    canonEra: overrides.canonEra ?? DEFAULT_CANON_ERA,
    revealLevel: overrides.revealLevel ?? DEFAULT_REVEAL_LEVEL,
    catalogItems: {},
  };
}

describe('canon item taxonomy', () => {
  it('defines 35–45 items with required fields', () => {
    expect(CANON_ITEMS.length).toBeGreaterThanOrEqual(35);
    expect(CANON_ITEMS.length).toBeLessThanOrEqual(45);
    for (const def of CANON_ITEMS) {
      for (const field of REQUIRED_FIELDS) {
        expect(def[field]).toBeDefined();
        expect(String(def[field]).length).toBeGreaterThan(0);
      }
    }
  });

  it('uses unique item IDs', () => {
    const ids = CANON_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns every item to a valid group', () => {
    for (const def of CANON_ITEMS) {
      expect(ITEM_GROUP_ORDER).toContain(def.group);
      expect(getItemsByGroup(def.group).some((i) => i.id === def.id)).toBe(true);
    }
  });

  it('blocks Non-Human Geometry Relic drops during experimental_trials and dead_beacon', () => {
    expect(canItemDrop('non_human_geometry_relic', itemCtx())).toBe(false);
    expect(
      canItemDrop('non_human_geometry_relic', itemCtx({ canonEra: 'dead_beacon', revealLevel: 2 })),
    ).toBe(false);
    expect(
      filterDropEligibleItems(CANON_ITEMS, itemCtx()).some(
        (i) => i.id === 'non_human_geometry_relic',
      ),
    ).toBe(false);
  });

  it('blocks weapons/countermeasure drops before the war era', () => {
    const weapons = CANON_ITEMS.filter((i) => i.group === 'weapons_countermeasure');
    expect(weapons.length).toBeGreaterThan(0);
    for (const item of weapons) {
      expect(canItemDrop(item.id, itemCtx({ canonEra: 'experimental_trials' }))).toBe(false);
    }
  });

  it('allows common repair/life support drops during experimental_trials', () => {
    expect(canItemDrop('hull_patch_kit', itemCtx())).toBe(true);
    expect(canItemDrop('oxygen_canister', itemCtx())).toBe(true);
    expect(canItemDrop('co2_scrubber_filter', itemCtx())).toBe(true);
  });

  it('maps legacy item IDs to canon IDs', () => {
    expect(legacyItemIdToCanonItemId('patch_kit')).toBe('hull_patch_kit');
    expect(legacyItemIdToCanonItemId('hull_patch')).toBe('hull_patch_kit');
    expect(legacyItemIdToCanonItemId('sealant')).toBe('pressure_sealant');
    expect(legacyItemIdToCanonItemId('oxygen')).toBe('oxygen_canister');
    expect(legacyItemIdToCanonItemId('brace_frame')).toBe('emergency_bulkhead_clamps');
    expect(legacyItemIdToCanonItemId('relic')).toBe('unknown_alloy_fragment');
    expect(normalizeItemId('hull_patch_kit')).toBe('hull_patch_kit');
    expect(getItemDefinition('patch_kit')?.id).toBe('hull_patch_kit');
  });

  it('groups catalog entries by item group', () => {
    const grouped = groupCatalogEntries({
      hull_patch_kit: 2,
      sonar_calibration_chip: 1,
      spare_fuse_bank: 3,
    });
    expect(grouped.repair_hull?.map((e) => e.itemId)).toContain('hull_patch_kit');
    expect(grouped.sensor_comms?.map((e) => e.itemId)).toContain('sonar_calibration_chip');
    expect(grouped.power_engineering?.map((e) => e.itemId)).toContain('spare_fuse_bank');
  });

  it('groups repair inventory rows by canon group', () => {
    const grouped = groupRepairInventoryForDisplay([
      { id: 'patch_kit', name: 'Hull Patch Kit', quantity: 2 },
      { id: 'oxygen_canister', name: 'Oxygen Canister', quantity: 1 },
    ]);
    expect(grouped.repair_hull?.[0]?.itemId).toBe('hull_patch_kit');
    expect(grouped.life_support?.[0]?.itemId).toBe('oxygen_canister');
  });

  it('exposes getAllItemDefinitions with full catalog', () => {
    expect(getAllItemDefinitions().length).toBe(CANON_ITEMS.length);
  });

  it('unlocks era-gated weapons when war era is active', () => {
    expect(isItemUnlockedForState('torpedo_guidance_component', itemCtx())).toBe(false);
    expect(
      isItemUnlockedForState('torpedo_guidance_component', itemCtx({ canonEra: 'war' })),
    ).toBe(true);
  });
});

describe('save migration v4 → v5 (catalog items)', () => {
  function legacyV4SaveFixture(catalogItems?: Record<string, number>) {
    const state = createInitialGameState();
    const { version, catalogItems: _drop, ...rest } = state;
    return {
      ...rest,
      version: 4,
      ...(catalogItems !== undefined ? { catalogItems } : {}),
    };
  }

  it('normalizes legacy catalog IDs and preserves quantities', () => {
    const migrated = migrateGameState(
      legacyV4SaveFixture({
        patch_kit: 2,
        sealant: 1,
        hull_patch_kit: 1,
        sonar_calibration_chip: 3,
      }),
    );
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
    expect(migrated!.catalogItems.hull_patch_kit).toBe(3);
    expect(migrated!.catalogItems.pressure_sealant).toBe(1);
    expect(migrated!.catalogItems.sonar_calibration_chip).toBe(3);
  });

  it('backfills empty catalogItems on v4 saves missing the field', () => {
    const migrated = migrateGameState(legacyV4SaveFixture());
    expect(migrated).not.toBeNull();
    expect(migrated!.catalogItems).toEqual({});
    expect(migrated!.version).toBe(GAME_STATE_VERSION);
  });
});
