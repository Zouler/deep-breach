import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createExpeditionRepairInventory,
  REPAIR_ITEM_TEMPLATES,
} from '@/data/repairItems';
import {
  baseStorageFromRepairRows,
  createEmptyBaseStorage,
  withSyncedLegacyEconomy,
} from '@/game/baseStorage';
import { DEFAULT_DIVE_ROUTE, emptyRouteTimeMs } from '@/game/navigation';
import { emergencyOxygenMaxCharges } from '@/game/oxygen';
import type { BaseStorage, DiveRoute, GameState, OfflineReport, RepairItem } from '@/types';

const STORAGE_KEY = '@deep_breach/game_state_v1';

export async function loadGameState(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || parsed.version !== 1) return null;
    return migrate(parsed);
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

function migrate(state: GameState): GameState {
  const baseStorage = migrateBaseStorage(state);
  const dive = state.dive
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
      }
    : null;
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
        storageTransferPreview: state.lastMissionOutcome.storageTransferPreview,
      }
    : null;
  const merged: GameState = {
    ...state,
    baseStorage,
    repairInventory: migrateRepairItems(state.repairInventory),
    dive,
    pendingOfflineReport,
    lastMissionOutcome,
  };
  return withSyncedLegacyEconomy(merged);
}
