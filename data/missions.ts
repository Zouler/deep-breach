import type { Mission } from '@/types';

export const OPERATION_DEAD_BEACON_MISSION_ID = 'operation_dead_beacon';
export const OPERATION_DEAD_BEACON_RETURN_MISSION_ID = 'operation_dead_beacon_return';
export const GROWING_OCEAN_ANOMALY_MISSION_ID = 'growing_ocean_anomaly';

/** Playable operational dives launched from story assignments. */
export const STORY_DIVE_MISSIONS: Mission[] = [
  {
    id: OPERATION_DEAD_BEACON_MISSION_ID,
    name: 'Operation Dead Beacon',
    targetDepthM: 900,
    durationMinutes: 6,
    risk: 'medium',
    expectedRewardsText: 'Environmental readings · limited salvage · recon data',
    scrapRewardRange: [40, 70],
    researchRewardRange: [8, 18],
    treasureChance: 0.08,
    specialEventChance: 0.18,
    trialPurpose:
      'Standoff reconnaissance of the DBX-03 distress signal sector — confirm source, scan wreckage, collect readings, return.',
  },
  {
    id: OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
    name: 'Return to DBX-03 Site',
    targetDepthM: 1200,
    durationMinutes: 7,
    risk: 'medium-high',
    expectedRewardsText: 'Restricted research packets · low salvage · contact telemetry',
    scrapRewardRange: [30, 55],
    researchRewardRange: [14, 32],
    treasureChance: 0.06,
    specialEventChance: 0.24,
    trialPurpose:
      'Controlled return to the DBX-03 loss zone under Hull Reinforcement Mk I — verify the site, gather readings through interference, and withdraw. No recovery authorized.',
  },
  {
    id: GROWING_OCEAN_ANOMALY_MISSION_ID,
    name: 'Growing Ocean Anomaly',
    targetDepthM: 1000,
    durationMinutes: 5,
    risk: 'medium-high',
    expectedRewardsText: 'Restricted research packets · low salvage · monitoring telemetry',
    scrapRewardRange: [18, 40],
    researchRewardRange: [22, 48],
    treasureChance: 0.04,
    specialEventChance: 0.32,
    trialPurpose:
      'Passive monitoring dive — confirm whether DBX-03 interval signatures recur outside the loss zone, collect repeatable readings, and withdraw under restriction.',
  },
];

export const STORY_DIVE_MISSION_IDS = STORY_DIVE_MISSIONS.map((m) => m.id);

export const STORY_DIVE_MISSION_SET: Set<string> = new Set(STORY_DIVE_MISSION_IDS);

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'shallow_descent',
    name: 'Pressure Trial I',
    targetDepthM: 300,
    durationMinutes: 3,
    risk: 'low',
    expectedRewardsText: 'Scrap · small research packets · repair supplies',
    scrapRewardRange: [35, 60],
    researchRewardRange: [1, 4],
    treasureChance: 0,
    specialEventChance: 0.05,
    trialPurpose:
      'Basic pressure validation, oxygen monitoring, hull response, and controlled descent.',
  },
  {
    id: 'wreck_survey',
    name: 'Recovery Drill',
    targetDepthM: 500,
    durationMinutes: 5,
    risk: 'medium',
    expectedRewardsText: 'Scrap · research · possible relic',
    scrapRewardRange: [60, 100],
    researchRewardRange: [4, 12],
    treasureChance: 0.18,
    specialEventChance: 0.1,
    trialPurpose:
      'Test external scanner, retrieval protocols, and expedition cargo handling.',
  },
  {
    id: 'signal_below',
    name: 'Signal Calibration',
    targetDepthM: 800,
    durationMinutes: 7,
    risk: 'medium-high',
    expectedRewardsText: 'Dense research · relics · unknown signals',
    scrapRewardRange: [100, 150],
    researchRewardRange: [10, 28],
    treasureChance: 0.28,
    specialEventChance: 0.22,
    trialPurpose:
      'Calibrate sonar, identify unknown contacts, and evaluate crew response under pressure.',
  },
];
