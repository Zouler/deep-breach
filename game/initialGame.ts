import { INITIAL_CREW } from '@/data/crew';
import { MOCK_MISSIONS } from '@/data/missions';
import { STARTER_REPAIR_INVENTORY, createExpeditionRepairInventory } from '@/data/repairItems';
import {
  baseStorageFromRepairRows,
  createEmptyBaseStorage,
  withSyncedLegacyEconomy,
} from '@/game/baseStorage';
import { createId } from '@/game/ids';
import { DEFAULT_DIVE_ROUTE, emptyRouteTimeMs } from '@/game/navigation';
import { emergencyOxygenMaxCharges } from '@/game/oxygen';
import { initializePacingGaps } from '@/game/pacing';
import { createEmptyRooms } from '@/game/rooms';
import type { DiveSession, GameState, Mission, PlayerProfile, Submarine } from '@/types';
import { GAME_STATE_VERSION } from '@/types';

function defaultSubmarine(): Submarine {
  return {
    hullIntegrityPercent: 100,
    modules: [
      { id: 'mod_hull', type: 'hull', name: 'Pressure Hull', level: 1, maxLevel: 6 },
      { id: 'mod_cargo', type: 'cargo', name: 'Cargo Bay', level: 1, maxLevel: 6 },
      { id: 'mod_sonar', type: 'sonar', name: 'Sonar Array', level: 1, maxLevel: 6 },
      { id: 'mod_oxygen', type: 'oxygen', name: 'Oxygen System', level: 1, maxLevel: 6 },
      { id: 'mod_autoseal', type: 'autoSeal', name: 'Auto-Seal', level: 1, maxLevel: 6 },
    ],
  };
}

export function createNewProfile(): PlayerProfile {
  const now = Date.now();
  return {
    id: createId('captain'),
    displayName: 'Captain',
    createdAt: now,
    lastSavedAt: now,
  };
}

function createInitialBaseStorage(): GameState['baseStorage'] {
  let bs = createEmptyBaseStorage();
  bs.scrap = 120;
  bs.researchData = 6;
  bs = baseStorageFromRepairRows(bs, STARTER_REPAIR_INVENTORY.map((r) => ({ ...r })));
  return bs;
}

export function createInitialGameState(): GameState {
  const baseStorage = createInitialBaseStorage();
  const raw: GameState = {
    version: GAME_STATE_VERSION,
    profile: createNewProfile(),
    resources: { scrap: baseStorage.scrap, researchData: baseStorage.researchData },
    baseStorage,
    submarine: defaultSubmarine(),
    crew: INITIAL_CREW.map((c) => ({ ...c })),
    repairInventory: STARTER_REPAIR_INVENTORY.map((r) => ({ ...r })),
    treasureInventory: [],
    missions: MOCK_MISSIONS.map((m) => ({ ...m })),
    dive: null,
    pendingOfflineReport: null,
    lastMissionOutcome: null,
  };
  return withSyncedLegacyEconomy(raw);
}

export function createDiveSessionForMission(
  mission: Mission,
  submarine: Submarine,
): DiveSession {
  const now = Date.now();
  const initialHull = Math.max(5, Math.min(100, submarine.hullIntegrityPercent));
  const base: DiveSession = {
    outcomeRecorded: false,
    missionId: mission.id,
    missionName: mission.name,
    targetDepthM: mission.targetDepthM,
    missionDurationMs: mission.durationMinutes * 60 * 1000,
    startedAt: now,
    missionElapsedMs: 0,
    currentDepthM: 0,
    oxygenPercent: 100,
    waterLevelPercent: 0,
    hullIntegrityPercent: initialHull,
    rooms: createEmptyRooms(),
    continueExplorationWhileAway: false,
    backgroundedAt: null,
    status: 'active',
    collectedScrap: 0,
    collectedResearch: 0,
    collectedTreasures: [],
    collectedArtifacts: 0,
    collectedSamples: 0,
    expeditionRepairInventory: createExpeditionRepairInventory(),
    discoveryOutcomeBanner: null,
    repairSuppliesConsumedThisDive: 0,
    repairSuppliesRecoveredThisDive: 0,
    oxygenCanisterUsesThisDive: 0,
    cargoLeftBehindNotes: [],
    supplyLog: [],
    eventLog: [],
    pendingDiscovery: null,
    discoveryJournal: [],
    lastCrackSpawnAt: now,
    lastAmbientAt: now,
    lastDiscoveryOfferAt: now + 12_000,
    nextCrackGapMs: 55_000,
    nextAmbientGapMs: 60_000,
    nextDiscoveryGapMs: 70_000,
    currentRoute: DEFAULT_DIVE_ROUTE,
    routeTimeMs: emptyRouteTimeMs(),
    lastAreaScanAt: 0,
    scansPerformed: 0,
    emergencyOxygenChargesRemaining: emergencyOxygenMaxCharges(submarine),
    emergencyOxygenUsesThisDive: 0,
    crewMessages: [],
    lastReactiveCrewAt: now,
  };
  return initializePacingGaps(base, mission);
}
