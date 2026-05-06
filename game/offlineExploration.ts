import type {
  CrewMember,
  DiveSession,
  GameEvent,
  Mission,
  OfflineMissionStatus,
  OfflineReport,
  Submarine,
  Treasure,
} from '@/types';

import { addResearchWithCargoCap, addScrapWithCargoCap, addTreasureWithCargoCap } from '@/game/cargo';
import { createId } from '@/game/ids';
import { getCommandIntentModifiers } from '@/game/navigationIntent';
import {
  BASE_HORIZONTAL_KM_PER_MS,
  deriveHorizontalMovementState,
  deriveVerticalMovementState,
} from '@/game/navigationVector';
import { calculateMissionRisk } from '@/game/missionRisk';
import {
  autoSealStrength,
  crewNavigationBonus,
  crewResearchBonus,
  engineerRepairBonus,
  hullMitigation,
  oxygenEfficiency,
  riskScalar,
  sonarQuality,
} from '@/game/submarineStats';

const MOCK_TREASURES: Treasure[] = [
  {
    id: 'tr_chronos',
    name: 'Chrono Compass',
    description: 'Pre-flood nav artifact.',
    rarity: 'rare',
  },
  {
    id: 'tr_void',
    name: 'Voidglass Shard',
    description: 'Refracts sound into color.',
    rarity: 'legendary',
  },
  {
    id: 'tr_tag',
    name: 'Tagged Dog Tag',
    description: 'Unknown expedition.',
    rarity: 'common',
  },
];

/** Wall-clock away time is capped for fairness (ms). */
export const MAX_OFFLINE_CALC_MS = 4 * 60 * 60 * 1000;

/** Simulation step for margin checks (ms). */
const STEP_MS = 60 * 1000;

function detNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface OfflineExplorationParams {
  dive: DiveSession;
  mission: Mission;
  submarine: Submarine;
  crew: CrewMember[];
  awayMs: number;
  now: number;
}

export interface OfflineExplorationResult {
  dive: DiveSession;
  report: OfflineReport;
}

function buildCrewNotes(
  crew: CrewMember[],
  ctx: {
    depthGain: number;
    scrapDelta: number;
    riskScore: number;
    emergency: boolean;
    navigatorDampenedEvents: boolean;
  },
): string[] {
  const assigned = crew.filter((c) => c.hired && c.assignedToDive);
  const lines: string[] = [];
  if (!assigned.length) {
    lines.push('Bridge: no dive roster logged — passive autopilot only.');
  } else {
    assigned.forEach((c) => {
      if (c.role === 'engineer') {
        lines.push(
          `${c.name}: rode shock loads; compensators ${ctx.emergency ? 'tripped extract' : 'held band'}.`,
        );
      } else if (c.role === 'navigator') {
        lines.push(
          `${c.name}: corridor ${ctx.navigatorDampenedEvents ? 'filtered' : 'tracked'} pings; +${Math.round(ctx.depthGain)}m vs baseline.`,
        );
      } else {
        lines.push(
          `${c.name}: passive spectra; salvage delta ${Math.round(ctx.scrapDelta)} vs ${ctx.riskScore}% risk.`,
        );
      }
    });
  }
  return lines.slice(0, 5);
}

function buildRecommendedAction(args: {
  hullIntegrityPercent: number;
  waterLevelPercent: number;
  oxygenPercent: number;
  missionStatus: OfflineMissionStatus;
}): string {
  if (args.missionStatus === 'emergency_extraction') {
    return 'Emergency extraction logged — drydock checks and hull stress review before next unattended run.';
  }
  if (args.missionStatus === 'failed') {
    return 'Emergency surface protocol — drydock inspection before next contract.';
  }
  if (args.missionStatus === 'completed') {
    return 'Mission objectives satisfied — offload cargo and decompress logs.';
  }
  if (args.hullIntegrityPercent < 35) {
    return 'Prioritize hull work and reduce offline exposure until integrity recovers.';
  }
  if (args.waterLevelPercent > 55) {
    return 'Bilge load high — cycle crew through engine spaces and seal checks.';
  }
  if (args.oxygenPercent < 40) {
    return 'Oxygen margins tight — shorten next offline window or upgrade O₂ plant.';
  }
  return 'Systems stable — you may continue the dive or return to base to bank cargo.';
}

function missionStatusFromDive(status: DiveSession['status'], emergency: boolean): OfflineMissionStatus {
  if (emergency) return 'emergency_extraction';
  if (status === 'success') return 'completed';
  if (status === 'failed') return 'failed';
  return 'still_active';
}

function explorationSummaryText(args: {
  depthStartM: number;
  depthEndM: number;
  targetDepthM: number;
  effectiveAwayMs: number;
  emergency: boolean;
  cargoAtCapacity: boolean;
}): string {
  const gain = Math.max(0, args.depthEndM - args.depthStartM);
  const mins = Math.round(args.effectiveAwayMs / 60000);
  const cap = args.cargoAtCapacity ? ' Cargo headroom throttled salvage.' : '';
  const ext = args.emergency ? ' Autonomous extract at survival margins.' : '';
  return `Simulated ${mins}m unattended; depth +${Math.round(gain)}m toward ${args.targetDepthM}m contract.${cap}${ext}`;
}

/**
 * Reconciles an away interval into dive mutations plus a structured expedition report.
 * Stepped simulation enforces oxygen/hull floors before unfair loss and can trigger extraction.
 */
export function calculateOfflineProgress(
  input: OfflineExplorationParams,
): OfflineExplorationResult {
  const { dive: initialDive, mission, submarine, crew, awayMs, now } = input;

  const effectiveAwayMs = Math.min(Math.max(0, awayMs), MAX_OFFLINE_CALC_MS);
  const steps = Math.max(1, Math.ceil(effectiveAwayMs / STEP_MS));

  const rs = riskScalar(mission.risk);
  const mit =
    hullMitigation(submarine) +
    engineerRepairBonus(crew) * 0.18 +
    autoSealStrength(submarine) * 0.2;
  const mitClamp = Math.min(0.82, Math.max(0.12, mit));
  const sonar = sonarQuality(submarine);
  const nav = 1 + crewNavigationBonus(crew);
  const researchC = crewResearchBonus(crew);
  const oxyEff = oxygenEfficiency(submarine);
  const riskScore = calculateMissionRisk(mission);
  const navEventDampen = crew.some((c) => c.hired && c.assignedToDive && c.role === 'navigator');

  const depthStartM = initialDive.currentDepthM;
  const depthRemainingStart = Math.max(0, initialDive.targetDepthM - depthStartM);
  const missionWallMin = Math.max(0.5, initialDive.missionDurationMs / 60000);
  const awayMin = effectiveAwayMs / 60000;
  const progressFrac = Math.min(1, awayMin / missionWallMin);
  const intent = getCommandIntentModifiers(initialDive.currentRoute);
  let horizontalKm = initialDive.horizontalDistanceKm ?? 0;
  const depthGainTotal = Math.min(
    depthRemainingStart,
    depthRemainingStart *
      progressFrac *
      nav *
      (0.82 + sonar * 0.22) *
      intent.depthSpeedMultiplier,
  );
  const depthPerStepBase = depthGainTotal / steps;

  let depth = depthStartM;
  let oxy = initialDive.oxygenPercent;
  let hull = initialDive.hullIntegrityPercent;
  let water = initialDive.waterLevelPercent;
  let missionElapsed = initialDive.missionElapsedMs;

  let deltaScrap = 0;
  let deltaResearch = 0;
  const treasuresThisInterval: Treasure[] = [];
  const newEvents: GameEvent[] = [];

  let cumulativeHullLoss = 0;
  let cumulativeOxy = 0;
  let cumulativeWater = 0;
  let emergency = false;
  let cargoAtCapacity = false;
  let surfaceHullPenaltyPercent = 0;
  let simulatedMs = 0;

  for (let i = 0; i < steps; i++) {
    simulatedMs += STEP_MS;
    const seed = Math.floor(now / STEP_MS) + i * 131 + mission.id.length * 17;

    if (hull <= 24 || oxy <= 24) {
      emergency = true;
      surfaceHullPenaltyPercent = 6 + Math.round(rs * 4);
      break;
    }

    const depthBudget = Math.max(0, initialDive.targetDepthM - depth);
    const depthGainStep = Math.min(
      depthBudget,
      depthPerStepBase * (0.9 + detNoise(seed) * 0.22),
    );
    depth += depthGainStep;

    horizontalKm += BASE_HORIZONTAL_KM_PER_MS * intent.horizontalSpeedMultiplier * STEP_MS;

    const o2Stress = (0.045 + rs * 0.028) * (1.35 - oxyEff * 0.55);
    const o2Drop = Math.min(
      6,
      o2Stress * (STEP_MS / 60000) * intent.oxygenDrainMultiplier,
    );
    oxy = Math.max(0, oxy - o2Drop);
    cumulativeOxy += o2Drop;

    const cycle = detNoise(seed + 3);
    let hullLoss = 0;
    if (cycle < 0.9) {
      hullLoss =
        (0.08 + rs * 0.12) *
        (1 - mitClamp) *
        (0.35 + cycle * 0.45) *
        (STEP_MS / 60000) *
        (0.55 + 0.45 * intent.crackRiskMultiplier);
    } else {
      const spike =
        (0.9 + rs * 1.1) *
        (1 - mitClamp * 0.92) *
        (STEP_MS / 60000) *
        (0.65 + 0.35 * intent.hazardChanceMultiplier);
      hullLoss = Math.min(3.2, spike);
    }
    hull = Math.max(0, hull - hullLoss);
    cumulativeHullLoss += hullLoss;

    const waterBump = Math.min(
      2.4,
      (0.05 + rs * 0.08) * (1 - mitClamp * 0.45) * (STEP_MS / 60000),
    );
    water = Math.min(100, water + waterBump);
    cumulativeWater += waterBump;

    const microSeal = engineerRepairBonus(crew) * 0.04 + autoSealStrength(submarine) * 0.06;
    hull = Math.min(100, hull + microSeal * (STEP_MS / 60000));

    // Early-game sustain: scrap is the core loop fuel. Bias unattended exploration toward salvage.
    const scrapPotential =
      (0.85 + sonar * 0.75 + rs * 0.45) *
      (1 + (submarine.modules.find((m) => m.type === 'cargo')?.level ?? 1) * 0.12) *
      (STEP_MS / 60000);
    const scrapSlice = scrapPotential * (0.92 + detNoise(seed + 9) * 0.16);
    const scrapWorking: DiveSession = {
      ...initialDive,
      collectedScrap: initialDive.collectedScrap + deltaScrap,
      collectedResearch: Math.floor(initialDive.collectedResearch + deltaResearch),
      collectedTreasures: [...initialDive.collectedTreasures, ...treasuresThisInterval],
      expeditionRepairInventory: initialDive.expeditionRepairInventory ?? [],
      collectedArtifacts: initialDive.collectedArtifacts ?? 0,
      collectedSamples: initialDive.collectedSamples ?? 0,
    };
    const scrapAddRes = addScrapWithCargoCap(
      scrapWorking,
      submarine,
      Math.max(0, Math.floor(scrapSlice)),
    );
    if (scrapAddRes.lost > 0) cargoAtCapacity = true;
    deltaScrap += scrapAddRes.added;

    const researchPotential =
      (0.12 + researchC * 0.45 + rs * 0.18) * (STEP_MS / 60000) * (cargoAtCapacity ? 0.65 : 1);
    const researchSlice = researchPotential * (0.85 + detNoise(seed + 5) * 0.25);
    const researchWorking: DiveSession = {
      ...initialDive,
      collectedScrap: initialDive.collectedScrap + deltaScrap,
      collectedResearch: Math.floor(initialDive.collectedResearch + deltaResearch),
      collectedTreasures: [...initialDive.collectedTreasures, ...treasuresThisInterval],
      expeditionRepairInventory: initialDive.expeditionRepairInventory ?? [],
      collectedArtifacts: initialDive.collectedArtifacts ?? 0,
      collectedSamples: initialDive.collectedSamples ?? 0,
    };
    const resAdd = addResearchWithCargoCap(
      researchWorking,
      submarine,
      Math.max(0, Math.floor(researchSlice)),
    );
    if (resAdd.lost > 0) cargoAtCapacity = true;
    deltaResearch += resAdd.added;

    missionElapsed = Math.min(
      initialDive.missionDurationMs,
      missionElapsed + STEP_MS * 0.62 * nav,
    );

    const eventRoll = detNoise(seed + 7);
    const eventChance =
      mission.specialEventChance *
      (navEventDampen ? 0.72 : 1) *
      intent.ambientChanceMultiplier *
      intent.discoveryChanceMultiplier;
    if (eventRoll < eventChance * 0.08) {
      newEvents.push({
        id: createId('evt'),
        type: 'bio_signature',
        message: 'Passive bio sweep logged while away.',
        timestamp: now,
      });
    } else if (eventRoll > 1 - eventChance * 0.06) {
      newEvents.push({
        id: createId('evt'),
        type: 'special_signal',
        message: 'Anomalous ping train buffered for decode.',
        timestamp: now,
      });
    }

    const treasureRoll = detNoise(seed + 21);
    if (
      treasureRoll <
      mission.treasureChance *
        (0.04 + sonar * 0.05 + researchC * 0.06) *
        nav *
        intent.discoveryChanceMultiplier
    ) {
      const pick = MOCK_TREASURES[Math.floor(detNoise(seed + 2) * MOCK_TREASURES.length)];
      const tr = { ...pick, id: createId('tr') };
      const treasureWorking: DiveSession = {
        ...initialDive,
        collectedScrap: initialDive.collectedScrap + deltaScrap,
        collectedResearch: Math.floor(initialDive.collectedResearch + deltaResearch),
        collectedTreasures: [...initialDive.collectedTreasures, ...treasuresThisInterval],
        expeditionRepairInventory: initialDive.expeditionRepairInventory ?? [],
        collectedArtifacts: initialDive.collectedArtifacts ?? 0,
        collectedSamples: initialDive.collectedSamples ?? 0,
      };
      const trRes = addTreasureWithCargoCap(treasureWorking, submarine, tr);
      if (trRes.ok) {
        treasuresThisInterval.push(tr);
      } else {
        cargoAtCapacity = true;
      }
    }

    if (depth >= initialDive.targetDepthM * 0.998) {
      break;
    }
    if (missionElapsed >= initialDive.missionDurationMs) {
      break;
    }
  }

  if (!emergency && (hull <= 0 || oxy <= 0)) {
    emergency = true;
    hull = Math.max(18, hull);
    oxy = Math.max(18, oxy);
    surfaceHullPenaltyPercent = 8 + Math.round(rs * 3);
  }

  if (emergency) {
    deltaScrap = Math.floor(deltaScrap * 0.55);
    deltaResearch = Math.floor(deltaResearch * 0.6);
    if (treasuresThisInterval.length > 1) {
      treasuresThisInterval.splice(1);
    }
  }

  const scrapDelta = Math.max(0, Math.floor(deltaScrap));
  const researchDelta = Math.max(0, Math.floor(deltaResearch));
  const collectedScrap = initialDive.collectedScrap + scrapDelta;
  const collectedResearch = initialDive.collectedResearch + researchDelta;
  const collectedTreasures = [...initialDive.collectedTreasures, ...treasuresThisInterval];

  let status: DiveSession['status'] = initialDive.status;
  if (emergency) {
    status = 'failed';
  } else if (depth >= initialDive.targetDepthM * 0.995 || missionElapsed >= initialDive.missionDurationMs) {
    status = 'success';
  } else {
    status = 'active';
  }

  const missionStatus = missionStatusFromDive(status, emergency);
  const explorationProgressPercent = Math.min(
    100,
    Math.round((Math.min(initialDive.targetDepthM, depth) / Math.max(1, initialDive.targetDepthM)) * 100),
  );
  const specialEventsDiscovered = newEvents.map((e) => e.message);

  const crewNotes = buildCrewNotes(crew, {
    depthGain: Math.min(initialDive.targetDepthM, depth) - depthStartM,
    scrapDelta,
    riskScore,
    emergency,
    navigatorDampenedEvents: navEventDampen,
  });

  const recommendedAction = buildRecommendedAction({
    hullIntegrityPercent: hull,
    waterLevelPercent: water,
    oxygenPercent: oxy,
    missionStatus,
  });

  const simMsForRates = emergency ? simulatedMs : effectiveAwayMs;
  const minsElapsed = Math.max(0.05, simMsForRates / 60000);
  const depthDeltaRun = Math.min(initialDive.targetDepthM, depth) - depthStartM;
  const avgDescentMPerMin = depthDeltaRun / minsElapsed;
  const horizDeltaKm = horizontalKm - (initialDive.horizontalDistanceKm ?? 0);
  const avgHorizKmPerMin = horizDeltaKm / minsElapsed;

  const nextDive: DiveSession = {
    ...initialDive,
    missionElapsedMs: missionElapsed,
    currentDepthM: Math.min(initialDive.targetDepthM, depth),
    hullIntegrityPercent: Math.max(0, Math.min(100, hull)),
    waterLevelPercent: Math.max(0, Math.min(100, water)),
    oxygenPercent: Math.max(0, Math.min(100, oxy)),
    backgroundedAt: null,
    status,
    collectedScrap,
    collectedResearch,
    collectedTreasures,
    eventLog: [...initialDive.eventLog, ...newEvents],
    horizontalDistanceKm: horizontalKm,
    verticalMovementState: deriveVerticalMovementState(avgDescentMPerMin, initialDive.currentRoute),
    horizontalMovementState: deriveHorizontalMovementState(initialDive.currentRoute),
    descentRateMPerMin: avgDescentMPerMin,
    horizontalSpeedKmPerMin: avgHorizKmPerMin,
  };

  const report: OfflineReport = {
    id: createId('report'),
    timeAwayMs: awayMs,
    effectiveAwayMs: emergency ? simulatedMs : effectiveAwayMs,
    depthStartM,
    depthEndM: nextDive.currentDepthM,
    depthReachedM: nextDive.currentDepthM,
    explorationProgressPercent,
    explorationSummary: explorationSummaryText({
      depthStartM,
      depthEndM: nextDive.currentDepthM,
      targetDepthM: initialDive.targetDepthM,
      effectiveAwayMs: emergency ? simulatedMs : effectiveAwayMs,
      emergency,
      cargoAtCapacity,
    }),
    scrapCollected: scrapDelta,
    researchCollected: researchDelta,
    treasuresFound: treasuresThisInterval,
    hullDamagePercent: cumulativeHullLoss,
    oxygenUsedPercent: cumulativeOxy,
    waterIngressPercent: cumulativeWater,
    events: newEvents,
    specialEventsDiscovered,
    crewNotes,
    recommendedAction,
    generatedAt: now,
    missionStatus,
    emergencyExtraction: emergency,
    surfaceHullPenaltyPercent,
    cargoAtCapacity,
  };

  return { dive: nextDive, report };
}
