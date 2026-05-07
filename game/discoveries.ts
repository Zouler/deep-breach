import type {
  CrewMember,
  DiscoveryCategory,
  DiscoveryJournalEntry,
  DiscoveryProvenance,
  DiveRoute,
  DiveSession,
  ExternalDiscovery,
  GameEvent,
  Mission,
  Submarine,
  Treasure,
} from '@/types';

import { repairTemplateById } from '@/data/repairItems';
import { makePacedCrack, randomRoomId } from '@/game/diveEvents';
import type { RewardIntent } from '@/game/cargo';
import { scanNarrativeForDiscovery } from '@/game/cargo';
import { createId } from '@/game/ids';
import { getCommandIntentModifiers, type CommandIntentModifiers } from '@/game/navigationIntent';
import {
  criticalRandomAllowed,
  depthProgress,
  inEarlyGracePeriod,
  missionProgress,
} from '@/game/pacing';
import {
  assignedCrew,
  crewResearchBonus,
  moduleLevel,
  riskScalar,
  sonarQuality,
} from '@/game/submarineStats';

/** Modest extra repair-supply odds on early Experimental Trials. */
function experimentalTrialRepairSupplyBias(missionId: string): number {
  if (missionId === 'shallow_descent') return 1.18;
  if (missionId === 'wreck_survey') return 1.1;
  if (missionId === 'signal_below') return 1.05;
  return 1;
}

function repairSupplyOutcomePreamble(intent: RewardIntent): string[] {
  const adds = intent.repairAdds ?? [];
  if (!adds.length) return [];
  const lines = ['Recovered repair supplies:'];
  for (const add of adds) {
    const nm = repairTemplateById(add.templateId)?.name ?? add.templateId;
    lines.push(`+${add.quantity} ${nm}`);
  }
  return lines;
}

const RUNTIME_TREASURES: Treasure[] = [
  {
    id: 'tr_slate',
    name: 'Slate Reliquary',
    description: 'Carved pressure symbols.',
    rarity: 'rare',
  },
  {
    id: 'tr_coin',
    name: 'Brine-Etched Coin',
    description: 'Currency from a drowned market.',
    rarity: 'common',
  },
];

const TEMPLATES: Record<
  DiscoveryCategory,
  { title: string; description: string; risk: ExternalDiscovery['riskBand']; rewardHint: string }
> = {
  salvage: {
    title: 'Metallic debris field detected',
    description: 'Dense scatter outside the hull — possible salvage.',
    risk: 'low',
    rewardHint: 'Scrap · occasional repair stock',
  },
  research_signal: {
    title: 'Encoded research signal',
    description: 'Narrowband carrier rising from the trench wall.',
    risk: 'low',
    rewardHint: 'Research packets · anomaly notes',
  },
  treasure_cache: {
    title: 'Possible salvage container',
    description: 'Structured return on sonar — may be rigged or trapped.',
    risk: 'medium',
    rewardHint: 'Relic chance · moderate hazard',
  },
  thermal_anomaly: {
    title: 'Thermal anomaly near the hull',
    description: 'Heat plume convection against the pressure skin.',
    risk: 'medium',
    rewardHint: 'Research · heat stress risk',
  },
  biological_contact: {
    title: 'Unknown biological movement',
    description: 'Large displacement without collision — curiosity or aggression unknown.',
    risk: 'high',
    rewardHint: 'Rare data · possible relic · impact risk',
  },
  volcanic_rock: {
    title: 'Volcanic rock outgassing',
    description: 'Mineral venting superheated chemistry along the seabed.',
    risk: 'high',
    rewardHint: 'Mineral research · burn / crack risk',
  },
  unknown_artifact: {
    title: 'Unknown artifact signature',
    description: 'Non-terrestrial harmonics on passive array.',
    risk: 'medium',
    rewardHint: 'Special event chance · unpredictable hazard',
  },
};

export function scanAvailable(submarine: Submarine, crew: CrewMember[]): boolean {
  if (moduleLevel(submarine, 'sonar') >= 1) return true;
  return assignedCrew(crew).some((c) => c.role === 'scientist');
}

export function calculateDiscoveryRisk(
  discovery: ExternalDiscovery,
  mission: Mission,
  dive: DiveSession,
  submarine: Submarine,
  crew: CrewMember[],
): number {
  const rs = riskScalar(mission.risk);
  const base =
    discovery.riskBand === 'low' ? 0.18 : discovery.riskBand === 'medium' ? 0.32 : 0.48;
  const depth = depthProgress(dive) * 0.18;
  const hull = (100 - dive.hullIntegrityPercent) / 220;
  const o2 = (100 - dive.oxygenPercent) / 260;
  const sonar = (1 - sonarQuality(submarine)) * 0.08;
  const sci = 1 - crewResearchBonus(crew) * 0.35;
  const raw = (base + depth + hull + o2) * rs * sci + sonar;
  return Math.min(0.92, Math.max(0.08, raw));
}

export function scanDiscovery(
  discovery: ExternalDiscovery,
  mission: Mission,
  dive: DiveSession,
  submarine: Submarine,
  crew: CrewMember[],
): ExternalDiscovery {
  const sonarMit = moduleLevel(submarine, 'sonar') * 0.04;
  const sciMit = assignedCrew(crew).some((c) => c.role === 'scientist') ? 0.06 : 0;
  const nextHazard = Math.max(0.05, discovery.hazardChanceDisplay - (0.12 + sonarMit + sciMit));
  const nextReward = Math.min(0.95, discovery.rewardQualityDisplay + 0.08 + sonarMit * 0.5);
  const band: ExternalDiscovery['riskBand'] =
    nextHazard < 0.28 ? 'low' : nextHazard < 0.52 ? 'medium' : 'high';
  const refined = {
    ...discovery,
    scanned: true,
    hazardChanceDisplay: nextHazard,
    rewardQualityDisplay: nextReward,
    riskBand: band,
    rewardHint: `${discovery.rewardHint} · scan refines margins (+sonar/science).`,
  };
  return {
    ...refined,
    scanNarrative: scanNarrativeForDiscovery(refined),
  };
}

function pickCategory(
  mission: Mission,
  dive: DiveSession,
  inGrace: boolean,
  route: DiveRoute,
  intent: CommandIntentModifiers,
): DiscoveryCategory {
  const roll =
    Math.random() + (depthProgress(dive) * 0.35 + missionProgress(dive) * 0.25) * 0.2;
  const rs = riskScalar(mission.risk);
  const d = depthProgress(dive);

  if (inGrace) {
    if (route === 'follow_signal' && roll < 0.4) return 'research_signal';
    if (route === 'search_salvage' && roll < 0.55) return 'salvage';
    if (roll < 0.55) return 'salvage';
    if (roll < 0.9) return 'research_signal';
    return 'unknown_artifact';
  }

  const pick = (weights: Partial<Record<DiscoveryCategory, number>>): DiscoveryCategory => {
    const entries = Object.entries(weights) as [DiscoveryCategory, number][];
    const sum = entries.reduce((a, [, w]) => a + w, 0);
    let t = Math.random() * sum;
    for (const [cat, w] of entries) {
      t -= w;
      if (t <= 0) return cat;
    }
    return entries[0][0];
  };

  const sal = intent.salvageCategoryWeightMultiplier;
  const sig = intent.signalCategoryWeightMultiplier;

  if (route === 'search_salvage') {
    return pick({
      salvage: (0.42 + (rs < 1 ? 0.12 : 0)) * sal,
      treasure_cache: 0.28 * sal,
      research_signal: 0.18,
      thermal_anomaly: 0.12,
    });
  }
  if (route === 'follow_signal') {
    return pick({
      research_signal: 0.34 * sig,
      unknown_artifact: 0.26 * sig,
      biological_contact: 0.18 + d * 0.12,
      treasure_cache: 0.12,
      salvage: 0.1,
    });
  }
  if (route === 'avoid_hazards') {
    return pick({
      salvage: 0.35,
      research_signal: 0.35,
      treasure_cache: 0.18,
      unknown_artifact: 0.12,
    });
  }
  if (route === 'stabilize_systems') {
    return pick({
      research_signal: 0.38,
      salvage: 0.32,
      treasure_cache: 0.18,
      unknown_artifact: 0.12,
    });
  }
  if (route === 'push_deeper') {
    if (d > 0.55 && Math.random() < 0.35 + rs * 0.1) {
      return pick({
        thermal_anomaly: 0.45 * intent.hazardChanceMultiplier,
        volcanic_rock: 0.35 * intent.hazardChanceMultiplier,
        biological_contact: 0.2 * intent.hazardChanceMultiplier,
      });
    }
    return pick({
      salvage: 0.22 * sal,
      research_signal: 0.22 * sig,
      treasure_cache: 0.2,
      thermal_anomaly: 0.18 * intent.hazardChanceMultiplier,
      biological_contact: 0.1 * intent.hazardChanceMultiplier,
      volcanic_rock: 0.08 * intent.hazardChanceMultiplier,
    });
  }

  if (rs < 0.9) {
    if (roll < 0.35) return 'salvage';
    if (roll < 0.65) return 'research_signal';
    if (roll < 0.82) return 'treasure_cache';
    return 'thermal_anomaly';
  }
  if (roll < 0.25) return 'salvage';
  if (roll < 0.45) return 'research_signal';
  if (roll < 0.62) return 'treasure_cache';
  if (roll < 0.78) return 'thermal_anomaly';
  if (roll < 0.9) return 'biological_contact';
  return 'volcanic_rock';
}

export type GenerateDiscoveryOptions = {
  provenance?: DiscoveryProvenance;
};

export function generateExternalDiscovery(
  mission: Mission,
  dive: DiveSession,
  submarine: Submarine,
  crew: CrewMember[],
  now: number,
  options?: GenerateDiscoveryOptions,
): ExternalDiscovery | null {
  if (dive.pendingDiscovery) return null;
  const inGrace = inEarlyGracePeriod(dive, now);
  const provenance: DiscoveryProvenance = options?.provenance ?? 'passive';
  const intent = getCommandIntentModifiers(dive.currentRoute);
  const category = pickCategory(mission, dive, inGrace, dive.currentRoute, intent);
  const tpl = TEMPLATES[category];
  let hazard = calculateDiscoveryRisk(
    {
      id: 'tmp',
      category,
      title: tpl.title,
      description: tpl.description,
      riskBand: tpl.risk,
      rewardHint: tpl.rewardHint,
      scanned: false,
      hazardChanceDisplay: 0.35,
      rewardQualityDisplay: 0.45,
      createdAt: now,
      provenance,
    },
    mission,
    dive,
    submarine,
    crew,
  );
  hazard = Math.min(0.92, Math.max(0.08, hazard * intent.hazardChanceMultiplier));
  const rewardQ = Math.min(0.92, 0.35 + sonarQuality(submarine) * 0.25 + crewResearchBonus(crew));
  return {
    id: createId('disc'),
    category,
    title: tpl.title,
    description: tpl.description,
    riskBand: tpl.risk,
    rewardHint: tpl.rewardHint,
    scanned: false,
    hazardChanceDisplay: hazard,
    rewardQualityDisplay: rewardQ,
    createdAt: now,
    provenance,
  };
}

export type DiscoveryResolveInput = {
  choice: 'ignore' | 'attempt';
  discovery: ExternalDiscovery;
  mission: Mission;
  dive: DiveSession;
  submarine: Submarine;
  crew: CrewMember[];
  now: number;
};

export type DiscoveryResolvePatch = {
  journal: DiscoveryJournalEntry;
  events: GameEvent[];
  rewardIntent: RewardIntent;
  hullDelta: number;
  oxygenDelta: number;
  waterDelta: number;
  rooms?: DiveSession['rooms'];
  supplyLog: string[];
  outcomeTitle: string;
  outcomeSeverity: 'info' | 'warning' | 'danger';
  outcomePreamble: string[];
};

function mergeRepairAdds(
  adds: NonNullable<RewardIntent['repairAdds']>,
  templateId: string,
  quantity: number,
): NonNullable<RewardIntent['repairAdds']> {
  const next = [...adds];
  const row = next.find((a) => a.templateId === templateId);
  if (row) row.quantity += quantity;
  else next.push({ templateId, quantity });
  return next;
}

export function resolveExternalDiscovery(input: DiscoveryResolveInput): DiscoveryResolvePatch {
  const { choice, discovery, mission, dive, submarine, crew, now } = input;
  const intent = getCommandIntentModifiers(dive.currentRoute);
  if (choice === 'ignore') {
    return {
      journal: {
        id: createId('dj'),
        category: discovery.category,
        title: discovery.title,
        choice: 'ignored',
        outcomeSummary: 'Contact dropped — no recovery attempted.',
        hazardTriggered: false,
        specialEventNoted: false,
        source: discovery.provenance,
      },
      events: [
        {
          id: createId('evt'),
          type: 'discovery_ignored',
          message: `Ignored: ${discovery.title}`,
          timestamp: now,
        },
      ],
      rewardIntent: {},
      hullDelta: 0,
      oxygenDelta: 0,
      waterDelta: 0,
      supplyLog: [],
      outcomeTitle: 'Contact ignored',
      outcomeSeverity: 'info',
      outcomePreamble: [
        'Contact ignored. No risk taken.',
        'We are holding the current route and watch schedule.',
      ],
    };
  }

  const hazardChance = discovery.hazardChanceDisplay;
  const hazardRoll = Math.random();
  const successBias =
    moduleLevel(submarine, 'cargo') * 0.012 +
    moduleLevel(submarine, 'hull') * 0.015 +
    crewResearchBonus(crew) * 0.05;
  const hazard = hazardRoll < Math.max(0.08, hazardChance - successBias);

  const rewardIntent: RewardIntent = { repairAdds: [] };
  const supplyLog: string[] = [];
  const events: GameEvent[] = [];
  let rooms = dive.rooms;
  let special = false;

  const depth = depthProgress(dive);
  const inGrace = inEarlyGracePeriod(dive, now);
  const lowMission = mission.risk === 'low';
  const trialBias = experimentalTrialRepairSupplyBias(mission.id);
  const repairRoll = intent.repairSupplyChanceMultiplier * trialBias;

  if (!hazard) {
    const pushRepair = (id: string, q: number) => {
      rewardIntent.repairAdds = mergeRepairAdds(rewardIntent.repairAdds ?? [], id, q);
    };

    if (discovery.category === 'salvage') {
      rewardIntent.scrap = Math.floor(16 + depth * 22 + Math.random() * 14);
      const pPatch = Math.min(0.98, (lowMission || inGrace ? 0.66 : 0.52) * repairRoll);
      const pSeal = Math.min(0.98, (lowMission || inGrace ? 0.48 : 0.36) * repairRoll);
      const pBrace = Math.min(0.98, (lowMission || inGrace ? 0.24 : 0.18) * repairRoll);
      if (Math.random() < pPatch) pushRepair('patch_kit', Math.random() < 0.22 ? 2 : 1);
      if (Math.random() < pSeal) pushRepair('pressure_sealant', 1);
      if (Math.random() < pBrace) pushRepair('brace_frame', 1);
      if (Math.random() < (lowMission || inGrace ? 0.26 : 0.18) * Math.min(1.15, repairRoll)) {
        pushRepair('oxygen_canister', 1);
      }
    } else if (discovery.category === 'research_signal') {
      rewardIntent.research = Math.floor(
        (6 + depth * 12 + Math.random() * 7) * intent.researchRewardMultiplier,
      );
      rewardIntent.samples = Math.random() < 0.55 ? 1 : 0;
      if (Math.random() < 0.35) rewardIntent.scrap = Math.floor(6 + Math.random() * 10);
      if (Math.random() < 0.16 * repairRoll) pushRepair('oxygen_canister', 1);
      if (Math.random() < 0.12 * repairRoll) pushRepair('patch_kit', 1);
    } else if (discovery.category === 'thermal_anomaly') {
      rewardIntent.research = Math.floor(
        (6 + depth * 10 + Math.random() * 6) * intent.researchRewardMultiplier,
      );
      rewardIntent.samples = Math.random() < 0.45 ? 1 : 0;
    } else if (discovery.category === 'treasure_cache') {
      if (Math.random() < 0.52 + mission.treasureChance * 0.35) {
        const pick = {
          ...RUNTIME_TREASURES[Math.floor(Math.random() * RUNTIME_TREASURES.length)],
          id: createId('tr'),
        };
        rewardIntent.treasures = [...(rewardIntent.treasures ?? []), pick];
      } else {
        rewardIntent.scrap = Math.floor(20 + Math.random() * 16);
      }
      rewardIntent.research = Math.floor(3 + Math.random() * 6);
      if (Math.random() < 0.32 * repairRoll) pushRepair('brace_frame', 1);
      if (Math.random() < 0.28 * repairRoll) pushRepair('patch_kit', 1);
      if (Math.random() < 0.12 * repairRoll) pushRepair('pressure_sealant', 1);
    } else if (discovery.category === 'unknown_artifact') {
      rewardIntent.research = Math.floor(6 + Math.random() * 9);
      rewardIntent.artifacts = Math.random() < 0.65 ? 1 : 0;
      if (Math.random() < 0.35) {
        const pick = {
          ...RUNTIME_TREASURES[Math.floor(Math.random() * RUNTIME_TREASURES.length)],
          id: createId('tr'),
        };
        rewardIntent.treasures = [...(rewardIntent.treasures ?? []), pick];
      }
    } else if (discovery.category === 'biological_contact') {
      rewardIntent.research = Math.floor(8 + Math.random() * 10);
      rewardIntent.samples = Math.random() < 0.5 ? 1 : 0;
      if (Math.random() < 0.35) {
        special = true;
        events.push({
          id: createId('evt'),
          type: 'bio_signature',
          message: 'Biological contact yielded rare spectral burst.',
          timestamp: now,
        });
      }
      if (Math.random() < 0.28) {
        const pick = {
          ...RUNTIME_TREASURES[Math.floor(Math.random() * RUNTIME_TREASURES.length)],
          id: createId('tr'),
        };
        rewardIntent.treasures = [...(rewardIntent.treasures ?? []), pick];
      }
    } else if (discovery.category === 'volcanic_rock') {
      rewardIntent.research = Math.floor(9 + Math.random() * 12);
      rewardIntent.scrap = Math.floor(10 + Math.random() * 14);
      rewardIntent.samples = Math.random() < 0.55 ? 1 : 0;
    }

    if (!rewardIntent.repairAdds?.length) delete rewardIntent.repairAdds;

    events.push({
      id: createId('evt'),
      type: 'discovery_recovery',
      message: `Recovery complete — ${discovery.title}`,
      timestamp: now,
    });

    const oxyCost = 1.5 + Math.random() * 2.2;
    const repairPre = repairSupplyOutcomePreamble(rewardIntent);
    const basePreamble = [
      'Recovery successful.',
      `Teams report secured materials from: ${discovery.title}.`,
      `Oxygen used during EVA: ~${oxyCost.toFixed(1)}%.`,
    ];
    return {
      journal: {
        id: createId('dj'),
        category: discovery.category,
        title: discovery.title,
        choice: 'attempted',
        outcomeSummary: 'Recovery secured external returns.',
        hazardTriggered: false,
        specialEventNoted: special,
        source: discovery.provenance,
      },
      events,
      rewardIntent,
      hullDelta: 0,
      oxygenDelta: -oxyCost,
      waterDelta: 0,
      rooms,
      supplyLog,
      outcomeTitle: 'Recovery complete',
      outcomeSeverity: 'info',
      outcomePreamble: [...repairPre, ...(repairPre.length ? [''] : []), ...basePreamble],
    };
  }

  const hull = -(4 + Math.random() * 7 * riskScalar(mission.risk));
  const oxy = -(3 + Math.random() * 5);
  const water = 4 + Math.random() * 6;
  const roomId = randomRoomId(rooms);
  const allowCrit =
    criticalRandomAllowed(dive) &&
    (discovery.category === 'volcanic_rock' ||
      discovery.category === 'thermal_anomaly' ||
      discovery.category === 'biological_contact');
  const wantCrit = allowCrit && Math.random() < 0.35;
  const crack = makePacedCrack(roomId, {
    depthProgress: depth,
    missionProgress: missionProgress(dive),
    inGrace: false,
    allowCriticalRandom: allowCrit,
    forcedSeverity: wantCrit ? 'critical' : undefined,
  });
  rooms = rooms.map((r) =>
    r.id === roomId
      ? {
          ...r,
          cracks: [...r.cracks, crack],
          status: crack.severity === 'critical' ? 'flooding' : 'damaged',
        }
      : r,
  );
  events.push({
    id: createId('evt'),
    type: 'system_failure',
    message: `Recovery attempt went wrong — ${crack.severity} breach in ${roomId}.`,
    timestamp: now,
    roomId,
  });

  const volc =
    discovery.category === 'volcanic_rock' || discovery.category === 'thermal_anomaly';
  return {
    journal: {
      id: createId('dj'),
      category: discovery.category,
      title: discovery.title,
      choice: 'attempted',
      outcomeSummary: 'Recovery hazarded the hull — breach logged.',
      hazardTriggered: true,
      specialEventNoted: false,
      source: discovery.provenance,
    },
    events,
    rewardIntent: {},
    hullDelta: hull,
    oxygenDelta: oxy,
    waterDelta: water,
    rooms,
    supplyLog: [],
    outcomeTitle: 'Recovery hazarded',
    outcomeSeverity: 'danger',
    outcomePreamble: [
      volc
        ? 'Hazard triggered. Volcanic fragments scraped the lower hull.'
        : 'Recovery failed — the contact stressed the pressure skin.',
      `${crack.severity.toUpperCase()} breach opened in ${roomId}.`,
      `Hull stress ~${Math.abs(hull).toFixed(0)}% · oxygen lost ~${Math.abs(oxy).toFixed(1)}% · water intrusion +${water.toFixed(1)}%.`,
      'No salvage secured.',
    ],
  };
}
