import type {
  BaseStorage,
  CargoTransferSummary,
  DiveSession,
  GameState,
  OfflineReport,
  Treasure,
} from '@/types';

import {
  addRepairToBaseStorage,
  appendTreasuresToBaseStorage,
  withSyncedLegacyEconomy,
} from '@/game/baseStorage';
import { mergeExpeditionCatalogIntoBase } from '@/game/salvageCatalog';

export function emptyCargoTransferSummary(): CargoTransferSummary {
  return {
    scrap: 0,
    missionCompletionBonusScrap: 0,
    researchData: 0,
    treasures: 0,
    artifacts: 0,
    samples: 0,
    hullPatchKits: 0,
    pressureSealant: 0,
    emergencyBrace: 0,
    oxygenCanisters: 0,
  };
}

function expeditionRepairQty(dive: DiveSession, id: string): number {
  return dive.expeditionRepairInventory?.find((i) => i.id === id)?.quantity ?? 0;
}

/**
 * Computes cargo deltas for expedition → base (matches legacy flush salvage fractions).
 */
export function computeCargoTransferSummary(
  dive: DiveSession,
  report: OfflineReport | null | undefined,
): CargoTransferSummary {
  const emergency = report?.emergencyExtraction ?? dive.offlineEmergencyExtraction ?? false;
  const success = dive.status === 'success';
  const completionBonus = success ? (dive.missionCompletionBonusScrap ?? 0) : 0;
  const scrapGain = success
    ? dive.collectedScrap + completionBonus
    : emergency
      ? Math.floor(dive.collectedScrap * 0.52)
      : Math.floor(dive.collectedScrap * 0.35);
  const researchGain = success
    ? dive.collectedResearch
    : emergency
      ? Math.floor(dive.collectedResearch * 0.45)
      : Math.floor(dive.collectedResearch * 0.25);
  const art = dive.collectedArtifacts ?? 0;
  const smp = dive.collectedSamples ?? 0;
  const artifactGain = success ? art : emergency ? Math.floor(art * 0.52) : Math.floor(art * 0.35);
  const sampleGain = success ? smp : emergency ? Math.floor(smp * 0.52) : Math.floor(smp * 0.35);
  const treasuresList = success ? dive.collectedTreasures : [];
  return {
    scrap: Math.max(0, scrapGain),
    missionCompletionBonusScrap: Math.max(0, completionBonus),
    researchData: Math.max(0, researchGain),
    treasures: treasuresList.length,
    artifacts: Math.max(0, artifactGain),
    samples: Math.max(0, sampleGain),
    hullPatchKits: expeditionRepairQty(dive, 'patch_kit'),
    pressureSealant: expeditionRepairQty(dive, 'pressure_sealant'),
    emergencyBrace: expeditionRepairQty(dive, 'brace_frame'),
    oxygenCanisters: expeditionRepairQty(dive, 'oxygen_canister'),
  };
}

function mergeSummaryIntoBaseStorage(
  bs: BaseStorage,
  summary: CargoTransferSummary,
  treasuresToAdd: Treasure[],
): BaseStorage {
  let next: BaseStorage = {
    ...bs,
    scrap: bs.scrap + summary.scrap,
    researchData: bs.researchData + summary.researchData,
    artifacts: bs.artifacts + summary.artifacts,
    samples: bs.samples + summary.samples,
  };
  next = addRepairToBaseStorage(next, 'patch_kit', summary.hullPatchKits);
  next = addRepairToBaseStorage(next, 'pressure_sealant', summary.pressureSealant);
  next = addRepairToBaseStorage(next, 'brace_frame', summary.emergencyBrace);
  next = addRepairToBaseStorage(next, 'oxygen_canister', summary.oxygenCanisters);
  if (treasuresToAdd.length) {
    next = appendTreasuresToBaseStorage(next, treasuresToAdd);
  }
  return next;
}

/**
 * Applies expedition cargo → base once per dive (`cargoTransferredToBase` guard).
 */
export function applyExpeditionCargoTransfer(state: GameState): {
  state: GameState;
  summary: CargoTransferSummary;
} {
  const dive = state.dive;
  if (!dive || dive.cargoTransferredToBase) {
    return { state, summary: emptyCargoTransferSummary() };
  }
  const summary = computeCargoTransferSummary(dive, state.pendingOfflineReport);
  const treasures = dive.status === 'success' ? [...dive.collectedTreasures] : [];
  const nextBs = mergeSummaryIntoBaseStorage(state.baseStorage, summary, treasures);
  const emergency = state.pendingOfflineReport?.emergencyExtraction ?? dive.offlineEmergencyExtraction ?? false;
  const successFraction =
    dive.status === 'success' ? 1 : emergency ? 0.52 : 0.35;
  const catalogItems = mergeExpeditionCatalogIntoBase(
    state.catalogItems ?? {},
    dive.expeditionCatalogItems,
    successFraction,
  );
  const next: GameState = {
    ...state,
    baseStorage: nextBs,
    catalogItems,
    dive: { ...dive, cargoTransferredToBase: true },
  };
  return { state: withSyncedLegacyEconomy(next), summary };
}
