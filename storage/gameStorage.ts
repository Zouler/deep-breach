import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createExpeditionRepairInventory,
  REPAIR_ITEM_TEMPLATES,
} from '@/data/repairItems';
import { DEFAULT_COMMANDER } from '@/data/storyBriefings';
import {
  baseStorageFromRepairRows,
  createEmptyBaseStorage,
  withSyncedLegacyEconomy,
} from '@/game/baseStorage';
import { DEFAULT_DIVE_ROUTE, emptyRouteTimeMs } from '@/game/navigation';
import {
  clampRevealLevelForEra,
  DEFAULT_CANON_ERA,
  DEFAULT_REVEAL_LEVEL,
  normalizeCanonEra,
  normalizeCompletedSpineEvents,
} from '@/game/canon';
import { normalizeCatalogItems } from '@/game/items';
import { normalizeCompartmentsFromUnknown, normalizeDiveRooms, roomContextFromGameState } from '@/game/rooms';
import { normalizeRobertsState } from '@/game/roberts';
import { stripTransientDiveOverlays } from '@/game/diveTransientState';
import { emergencyOxygenMaxCharges } from '@/game/oxygen';
import type {
  BaseStorage,
  DiveRoute,
  GameState,
  OfflineReport,
  RepairItem,
} from '@/types';
import { GAME_STATE_VERSION } from '@/types';
import { defaultCrewConditionState } from '@/types/internalCrewEvents';
import type { CommanderProfile, StoryProgress } from '@/types/story';

const STORAGE_KEY = '@deep_breach/game_state_v1';

/**
 * One step per version bump: index 0 carries a save from version 1 to version 2,
 * index 1 from version 2 to version 3, and so on. Add a new entry here whenever
 * GAME_STATE_VERSION increments — never edit an old entry once it has shipped.
 */
const MIGRATIONS: ((raw: any) => any)[] = [
  /** v1 → v2: canon progression fields */
  (raw) => ({
    ...raw,
    canonEra: raw.canonEra ?? DEFAULT_CANON_ERA,
    revealLevel: raw.revealLevel ?? DEFAULT_REVEAL_LEVEL,
    completedSpineEvents: raw.completedSpineEvents ?? [],
  }),
  /** v2 → v3: Roberts RPG protagonist state */
  (raw) => ({
    ...raw,
    roberts: normalizeRobertsState(raw.roberts),
  }),
  /** v3 → v4: DBX-07 compartment registry */
  (raw) => {
    const canonEra = normalizeCanonEra(raw.canonEra);
    const revealLevel =
      typeof raw.revealLevel === 'number' ? raw.revealLevel : DEFAULT_REVEAL_LEVEL;
    const compartments = normalizeCompartmentsFromUnknown(raw.compartments, {
      canonEra,
      revealLevel,
    });
    const roomCtx = roomContextFromGameState({ canonEra, revealLevel, compartments });
    const dive =
      raw.dive && typeof raw.dive === 'object'
        ? {
            ...raw.dive,
            rooms: normalizeDiveRooms(raw.dive.rooms, roomCtx),
          }
        : raw.dive;
    return { ...raw, compartments, dive };
  },
  /** v4 → v5: canon item taxonomy catalog */
  (raw) => ({
    ...raw,
    catalogItems: normalizeCatalogItems(raw.catalogItems),
    dive:
      raw.dive && typeof raw.dive === 'object'
        ? {
            ...raw.dive,
            expeditionCatalogItems: normalizeCatalogItems(raw.dive.expeditionCatalogItems),
          }
        : raw.dive,
  }),
];

/**
 * Pure migration entry point: takes whatever shape was parsed from storage and
 * either returns a fully-populated current-version GameState, or null if the
 * save is unreadable (corrupt) or from a newer build than this code understands.
 * Kept free of AsyncStorage so it can be unit tested directly.
 */
export function migrateGameState(parsed: unknown): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null;
  let raw = parsed as { version?: number } & Record<string, unknown>;
  const storedVersion = typeof raw.version === 'number' ? raw.version : 1;

  if (storedVersion > GAME_STATE_VERSION) {
    // Save came from a newer build than this code knows how to read — don't guess.
    return null;
  }

  for (let v = storedVersion; v < GAME_STATE_VERSION; v++) {
    const step = MIGRATIONS[v - 1];
    if (!step) return null; // no known path from this version forward
    raw = { ...step(raw), version: v + 1 };
  }

  const normalized = normalizeV1Shape(raw as unknown as GameState);
  return isValidPersistedGameState(normalized) ? normalized : null;
}

function isValidPersistedGameState(state: GameState | null): state is GameState {
  if (!state || typeof state !== 'object') return false;
  const profile = state.profile;
  if (!profile || typeof profile !== 'object' || typeof profile.id !== 'string') return false;
  if (!state.submarine || typeof state.submarine !== 'object') return false;
  if (!state.baseStorage || typeof state.baseStorage !== 'object') return false;
  if (!Array.isArray(state.crew)) return false;
  return true;
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  const payload = JSON.stringify(state);
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function migrateOfflineReport(report: OfflineReport): OfflineReport {
  const timeAwayMs = report.timeAwayMs ?? 0;
  const effectiveAwayMs = report.effectiveAwayMs ?? timeAwayMs;
  const depthEndM = report.depthEndM ?? report.depthReachedM ?? 0;
  const depthReachedM = report.depthReachedM ?? depthEndM;
  const explorationProgressPercent = report.explorationProgressPercent ?? 0;
  return {
    ...report,
    timeAwayMs,
    effectiveAwayMs,
    depthReachedM,
    depthEndM,
    explorationProgressPercent,
    explorationSummary:
      report.explorationSummary ??
      `Depth advanced to ${Math.round(depthReachedM)}m during unattended interval.`,
    oxygenUsedPercent: report.oxygenUsedPercent ?? 0,
    waterIngressPercent: report.waterIngressPercent ?? 0,
    specialEventsDiscovered: report.specialEventsDiscovered ?? [],
    crewNotes: report.crewNotes ?? [],
    recommendedAction:
      report.recommendedAction ??
      'Review systems and decide whether to continue the dive or surface.',
    missionStatus: report.missionStatus ?? 'still_active',
    emergencyExtraction: report.emergencyExtraction ?? false,
    surfaceHullPenaltyPercent: report.surfaceHullPenaltyPercent ?? 0,
    cargoAtCapacity: report.cargoAtCapacity ?? false,
  };
}

const DEFAULT_REPAIR_POWER: Record<string, number> = Object.fromEntries(
  REPAIR_ITEM_TEMPLATES.map((r) => [r.id, r.power]),
);

function migrateRepairItems(items: RepairItem[]): RepairItem[] {
  return items.map((r) => ({
    ...r,
    power: r.power ?? DEFAULT_REPAIR_POWER[r.id] ?? 2,
  }));
}

function migrateBaseStorage(state: GameState): BaseStorage {
  const existing = (state as GameState & { baseStorage?: BaseStorage }).baseStorage;
  if (existing) return existing;
  let bs = createEmptyBaseStorage();
  bs.scrap = state.resources?.scrap ?? 0;
  bs.researchData = state.resources?.researchData ?? 0;
  bs.treasures = [...(state.treasureInventory ?? [])];
  bs = baseStorageFromRepairRows(bs, state.repairInventory ?? []);
  return bs;
}

/** Normalize legacy narrative cut-in ids so saves stay valid across content revisions. */
function migrateCutInIdList(ids: string[] | undefined): string[] {
  const renames: Record<string, string> = {
    trial_completed: 'first_trial_completed',
  };
  const removed = new Set([
    'first_trial_start',
    'first_critical_breach',
    'first_repair_success',
  ]);
  const raw = ids ?? [];
  const out: string[] = [];
  for (const id of raw) {
    if (removed.has(id)) continue;
    const next = renames[id] ?? id;
    if (!out.includes(next)) out.push(next);
  }
  return out;
}

/** Backfills every optional field the current code expects onto a version-1-shaped save. */
function normalizeV1Shape(state: GameState): GameState {
  const baseStorage = migrateBaseStorage(state);
  const canonEra = normalizeCanonEra((state as GameState).canonEra);
  const revealLevel = clampRevealLevelForEra(
    canonEra,
    typeof (state as GameState).revealLevel === 'number'
      ? (state as GameState).revealLevel
      : DEFAULT_REVEAL_LEVEL,
  );
  const compartments = normalizeCompartmentsFromUnknown((state as GameState).compartments, {
    canonEra,
    revealLevel,
  });
  const roomCtx = roomContextFromGameState({ canonEra, revealLevel, compartments });
  const diveBase = state.dive
    ? {
        ...state.dive,
        outcomeRecorded: state.dive.outcomeRecorded ?? false,
        supplyLog: state.dive.supplyLog ?? [],
        pendingDiscovery: state.dive.pendingDiscovery
          ? {
              ...state.dive.pendingDiscovery,
              provenance: state.dive.pendingDiscovery.provenance ?? 'passive',
            }
          : null,
        discoveryJournal: (state.dive.discoveryJournal ?? []).map((j) => ({
          ...j,
          source: j.source ?? 'passive',
        })),
        rooms: normalizeDiveRooms(
          (state.dive.rooms ?? []).map((r) => ({
            ...r,
            cracks: r.cracks.map((c) => ({
              ...c,
              spawnedAt: c.spawnedAt ?? state.dive!.startedAt,
              escalatesAt: c.escalatesAt ?? null,
            })),
          })),
          roomCtx,
        ),
        lastCrackSpawnAt: state.dive.lastCrackSpawnAt ?? state.dive.startedAt,
        lastAmbientAt: state.dive.lastAmbientAt ?? state.dive.startedAt,
        lastDiscoveryOfferAt:
          state.dive.lastDiscoveryOfferAt ?? state.dive.startedAt + 12_000,
        nextCrackGapMs: state.dive.nextCrackGapMs ?? 55_000,
        nextAmbientGapMs: state.dive.nextAmbientGapMs ?? 60_000,
        nextDiscoveryGapMs: state.dive.nextDiscoveryGapMs ?? 70_000,
        currentRoute: (state.dive.currentRoute ?? DEFAULT_DIVE_ROUTE) as DiveRoute,
        routeTimeMs: state.dive.routeTimeMs ?? emptyRouteTimeMs(),
        lastAreaScanAt: state.dive.lastAreaScanAt ?? 0,
        scansPerformed: state.dive.scansPerformed ?? 0,
        emergencyOxygenChargesRemaining:
          state.dive.emergencyOxygenChargesRemaining ??
          emergencyOxygenMaxCharges(state.submarine),
        emergencyOxygenUsesThisDive: state.dive.emergencyOxygenUsesThisDive ?? 0,
        crewMessages: state.dive.crewMessages ?? [],
        lastReactiveCrewAt:
          state.dive.lastReactiveCrewAt ?? state.dive.startedAt,
        activeModifierId: state.dive.activeModifierId ?? null,
        engineHeatPercent: state.dive.engineHeatPercent ?? 0,
        lastEngineHeatVentAt: state.dive.lastEngineHeatVentAt ?? state.dive.startedAt,
        engineHeatWarned: state.dive.engineHeatWarned ?? false,
        collectedArtifacts: state.dive.collectedArtifacts ?? 0,
        collectedSamples: state.dive.collectedSamples ?? 0,
        missionCompletionBonusScrap: state.dive.missionCompletionBonusScrap ?? 0,
        expeditionRepairInventory:
          state.dive.expeditionRepairInventory ?? createExpeditionRepairInventory(),
        discoveryOutcomeBanner: state.dive.discoveryOutcomeBanner ?? null,
        repairSuppliesConsumedThisDive: state.dive.repairSuppliesConsumedThisDive ?? 0,
        repairSuppliesRecoveredThisDive: state.dive.repairSuppliesRecoveredThisDive ?? 0,
        oxygenCanisterUsesThisDive: state.dive.oxygenCanisterUsesThisDive ?? 0,
        cargoLeftBehindNotes: state.dive.cargoLeftBehindNotes ?? [],
        cargoTransferredToBase: state.dive.cargoTransferredToBase ?? false,
        expeditionCatalogItems: normalizeCatalogItems(
          (state.dive as NonNullable<GameState['dive']>).expeditionCatalogItems,
        ),
        horizontalDistanceKm: state.dive.horizontalDistanceKm ?? 0,
        verticalMovementState: state.dive.verticalMovementState ?? 'descending',
        horizontalMovementState: state.dive.horizontalMovementState ?? 'advancing',
        descentRateMPerMin: state.dive.descentRateMPerMin ?? 0,
        horizontalSpeedKmPerMin: state.dive.horizontalSpeedKmPerMin ?? 0,
      }
    : null;
  const dive =
    diveBase && diveBase.status !== 'active'
      ? stripTransientDiveOverlays(diveBase)
      : diveBase;
  const pendingOfflineReport = state.pendingOfflineReport
    ? migrateOfflineReport(state.pendingOfflineReport)
    : null;
  const lastMissionOutcome = state.lastMissionOutcome
    ? {
        ...state.lastMissionOutcome,
        itemsCollectedSummary: state.lastMissionOutcome.itemsCollectedSummary ?? [],
        externalDiscoveriesAttempted:
          state.lastMissionOutcome.externalDiscoveriesAttempted ?? 0,
        externalDiscoveriesIgnored: state.lastMissionOutcome.externalDiscoveriesIgnored ?? 0,
        externalDiscoveryHazardsTriggered:
          state.lastMissionOutcome.externalDiscoveryHazardsTriggered ?? 0,
        externalDiscoverySpecialEvents:
          state.lastMissionOutcome.externalDiscoverySpecialEvents ?? 0,
        externalDiscoverySummaries:
          state.lastMissionOutcome.externalDiscoverySummaries ?? [],
        dominantRoute: (state.lastMissionOutcome.dominantRoute ??
          DEFAULT_DIVE_ROUTE) as DiveRoute,
        scansPerformed: state.lastMissionOutcome.scansPerformed ?? 0,
        discoveriesFromScan: state.lastMissionOutcome.discoveriesFromScan ?? 0,
        discoveriesFromPassive: state.lastMissionOutcome.discoveriesFromPassive ?? 0,
        emergencyOxygenUses: state.lastMissionOutcome.emergencyOxygenUses ?? 0,
        crewMessageCount: state.lastMissionOutcome.crewMessageCount ?? 0,
        cargoLimit: state.lastMissionOutcome.cargoLimit ?? 20,
        cargoUsedApprox: state.lastMissionOutcome.cargoUsedApprox ?? 0,
        repairSuppliesConsumed: state.lastMissionOutcome.repairSuppliesConsumed ?? 0,
        repairSuppliesRecovered: state.lastMissionOutcome.repairSuppliesRecovered ?? 0,
        oxygenCanisterUses: state.lastMissionOutcome.oxygenCanisterUses ?? 0,
        cargoLeftBehindLines: state.lastMissionOutcome.cargoLeftBehindLines ?? [],
        treasuresRecovered: state.lastMissionOutcome.treasuresRecovered ?? 0,
        artifactsRecovered: state.lastMissionOutcome.artifactsRecovered ?? 0,
        samplesRecovered: state.lastMissionOutcome.samplesRecovered ?? 0,
        missionCompletionBonusScrap:
          state.lastMissionOutcome.missionCompletionBonusScrap ?? 0,
        discoveriesResolvedViaScan:
          state.lastMissionOutcome.discoveriesResolvedViaScan ?? 0,
        discoveriesResolvedPassive:
          state.lastMissionOutcome.discoveriesResolvedPassive ?? 0,
        trialAborted: state.lastMissionOutcome.trialAborted ?? false,
        missionId: state.lastMissionOutcome.missionId,
        oxygenRemainingPercent: state.lastMissionOutcome.oxygenRemainingPercent,
        trialDebrief: state.lastMissionOutcome.trialDebrief,
        storageTransferPreview: state.lastMissionOutcome.storageTransferPreview,
      }
    : null;
  const legacy = state as GameState & Partial<{ commander: CommanderProfile; story: StoryProgress }>;
  const commander = legacy.commander ?? { ...DEFAULT_COMMANDER };
  const s: Partial<StoryProgress> = legacy.story ?? { assignmentBriefingSeen: true };
  const seen = s.assignmentBriefingSeen ?? false;
  const migratedFromLegacy =
    Boolean(seen) &&
    s.introSequenceCompleted === undefined &&
    s.assignmentBriefingAccepted === undefined &&
    s.assignmentBriefingSkipped === undefined;
  const story: StoryProgress = {
    assignmentBriefingSeen: seen,
    assignmentBriefingAccepted: s.assignmentBriefingAccepted ?? migratedFromLegacy,
    assignmentBriefingSkipped: s.assignmentBriefingSkipped ?? false,
    introSequenceCompleted: s.introSequenceCompleted ?? migratedFromLegacy,
    introSequenceSkipped: s.introSequenceSkipped ?? false,
  };

  const narrativeRecap = state.narrativeRecap ?? {
    lastGlobalBackgroundAt: null,
    lastXOBriefingDismissedFingerprint: null,
    lastXOBriefingDismissedAt: null,
  };
  const crew = (state.crew ?? []).map((c) => ({
    ...c,
    divesCompleted: c.divesCompleted ?? 0,
    specializationId: c.specializationId ?? null,
  }));
  const merged: GameState = {
    ...state,
    commander,
    story,
    baseStorage,
    crew,
    repairInventory: migrateRepairItems(state.repairInventory ?? []),
    dive,
    pendingOfflineReport,
    lastMissionOutcome,
    storyBeats: state.storyBeats ?? [],
    narrativeRecap: {
      lastGlobalBackgroundAt: narrativeRecap.lastGlobalBackgroundAt ?? null,
      lastXOBriefingDismissedFingerprint:
        narrativeRecap.lastXOBriefingDismissedFingerprint ?? null,
      lastXOBriefingDismissedAt: narrativeRecap.lastXOBriefingDismissedAt ?? null,
    },
    pendingNarrativeCutInIds: migrateCutInIdList(state.pendingNarrativeCutInIds),
    seenCutInIds: migrateCutInIdList(state.seenCutInIds),
    crewState: (state as GameState).crewState ?? defaultCrewConditionState(),
    pendingInternalCrewEventId: (state as GameState).pendingInternalCrewEventId ?? null,
    resolvedInternalCrewEventIds: (state as GameState).resolvedInternalCrewEventIds ?? [],
    completedTrialReturnsCount: (state as GameState).completedTrialReturnsCount ?? 0,
    internalCrewReturnsSinceLastEvent: (state as GameState).internalCrewReturnsSinceLastEvent ?? 0,
    internalCrewNextEventAtReturns: (state as GameState).internalCrewNextEventAtReturns ?? 4,
    lastInternalCrewEventAt: (state as GameState).lastInternalCrewEventAt ?? null,
    trialProgressByMissionId: (state as GameState).trialProgressByMissionId ?? {},
    canonEra,
    revealLevel,
    completedSpineEvents: normalizeCompletedSpineEvents(
      (state as GameState).completedSpineEvents,
    ),
    roberts: normalizeRobertsState((state as GameState).roberts),
    compartments,
    catalogItems: normalizeCatalogItems((state as GameState).catalogItems),
  };
  return withSyncedLegacyEconomy(merged);
}
