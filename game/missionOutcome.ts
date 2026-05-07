import type {
  DiveSession,
  Mission,
  MissionOutcome,
  OfflineReport,
  Submarine,
} from '@/types';

import { computeCargoUsed } from '@/game/cargo';
import { computeCargoTransferSummary } from '@/game/cargoTransfer';
import { missionCompletionBonusScrap } from '@/game/economy';
import { dominantRoute } from '@/game/navigation';
import { countHullRepairUnitsInExpedition } from '@/game/repairResourceStatus';
import { cargoCapacityUnits } from '@/game/submarineStats';

function buildFallbackItemsSummary(dive: DiveSession): string[] {
  const lines: string[] = [];
  if (dive.collectedScrap > 0) lines.push(`Salvage tallied: ${dive.collectedScrap} scrap (mission haul)`);
  if (dive.collectedResearch > 0) {
    lines.push(`Research packets logged: ${dive.collectedResearch}`);
  }
  if (dive.collectedTreasures.length > 0) {
    lines.push(`Relics secured: ${dive.collectedTreasures.length}`);
  }
  if ((dive.collectedArtifacts ?? 0) > 0) {
    lines.push(`Artifacts catalogued: ${dive.collectedArtifacts}`);
  }
  if ((dive.collectedSamples ?? 0) > 0) {
    lines.push(`Samples contained: ${dive.collectedSamples}`);
  }
  if (!lines.length) lines.push('No notable recoveries recorded.');
  return lines;
}

function discoveryLines(dive: DiveSession): string[] {
  const journal = dive.discoveryJournal ?? [];
  if (!journal.length) return ['No external contacts resolved.'];
  return journal.map((j) => {
    const tag = j.choice === 'attempted' ? 'Recovery' : 'Ignored';
    const src = j.source === 'scan' ? ' · scan' : ' · passive';
    const hazard = j.hazardTriggered ? ' · hazard' : '';
    const spec = j.specialEventNoted ? ' · special' : '';
    return `${tag}: ${j.title} — ${j.outcomeSummary}${src}${hazard}${spec}`;
  });
}

export function buildMissionOutcome(
  dive: DiveSession,
  mission: Mission,
  submarine: Submarine,
  pendingOfflineReport: OfflineReport | null | undefined,
): MissionOutcome {
  const success = dive.status === 'success';
  const completionBonus = success ? missionCompletionBonusScrap(mission.risk) : 0;
  const rewards = {
    scrap: dive.collectedScrap,
    researchData: dive.collectedResearch,
  };
  const approxHull =
    100 - dive.hullIntegrityPercent + Math.round(dive.waterLevelPercent * 0.15);
  const hullKitUnitsEnd = countHullRepairUnitsInExpedition(dive.expeditionRepairInventory);
  const itemsCollectedSummary = (() => {
    const base =
      dive.supplyLog.length > 0 ? [...dive.supplyLog] : buildFallbackItemsSummary(dive);
    return [
      ...base,
      `Expedition hull repair stock at end: ${hullKitUnitsEnd} unit(s) (patch / sealant / brace).`,
    ];
  })();
  const journal = dive.discoveryJournal ?? [];
  const routeTime = dive.routeTimeMs ?? ({} as DiveSession['routeTimeMs']);
  const cargoLimit = cargoCapacityUnits(submarine);
  const cargoUsedApprox = computeCargoUsed(dive);
  const leftBehind = dive.cargoLeftBehindNotes ?? [];
  const storageTransferPreview = dive.cargoTransferredToBase
    ? undefined
    : computeCargoTransferSummary(dive, pendingOfflineReport ?? null);
  const trialAborted = Boolean(
    dive.offlineEmergencyExtraction || pendingOfflineReport?.emergencyExtraction,
  );
  return {
    success,
    trialAborted,
    missionId: mission.id,
    missionName: dive.missionName,
    targetDepthM: mission.targetDepthM,
    depthReachedM: Math.round(dive.currentDepthM),
    oxygenRemainingPercent: Math.round(dive.oxygenPercent),
    rewards,
    missionCompletionBonusScrap: completionBonus,
    treasures: dive.collectedTreasures,
    hullDamageTakenApprox: Math.max(0, approxHull),
    itemsCollectedSummary,
    events: dive.eventLog.slice(-8),
    externalDiscoveriesAttempted: journal.filter((j) => j.choice === 'attempted').length,
    externalDiscoveriesIgnored: journal.filter((j) => j.choice === 'ignored').length,
    externalDiscoveryHazardsTriggered: journal.filter((j) => j.hazardTriggered).length,
    externalDiscoverySpecialEvents: journal.filter((j) => j.specialEventNoted).length,
    externalDiscoverySummaries: discoveryLines(dive),
    dominantRoute: dominantRoute(routeTime),
    scansPerformed: dive.scansPerformed ?? 0,
    discoveriesFromScan: journal.filter((j) => j.source === 'scan').length,
    discoveriesFromPassive: journal.filter((j) => j.source === 'passive').length,
    emergencyOxygenUses: dive.emergencyOxygenUsesThisDive ?? 0,
    crewMessageCount: (dive.crewMessages ?? []).length,
    cargoLimit,
    cargoUsedApprox,
    repairSuppliesConsumed: dive.repairSuppliesConsumedThisDive ?? 0,
    repairSuppliesRecovered: dive.repairSuppliesRecoveredThisDive ?? 0,
    oxygenCanisterUses: dive.oxygenCanisterUsesThisDive ?? 0,
    cargoLeftBehindLines: [...leftBehind],
    treasuresRecovered: dive.collectedTreasures.length,
    artifactsRecovered: dive.collectedArtifacts ?? 0,
    samplesRecovered: dive.collectedSamples ?? 0,
    discoveriesResolvedViaScan: journal.filter(
      (j) => j.choice === 'attempted' && j.source === 'scan',
    ).length,
    discoveriesResolvedPassive: journal.filter(
      (j) => j.choice === 'attempted' && j.source === 'passive',
    ).length,
    storageTransferPreview,
  };
}
