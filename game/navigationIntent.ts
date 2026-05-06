import type { DiveRoute } from '@/types';

/**
 * Multipliers for how the crew executes the captain's command intent.
 * Baselines are neutral at 1.0; values are applied in dive tick / discovery resolution.
 */
export type CommandIntentModifiers = {
  depthSpeedMultiplier: number;
  horizontalSpeedMultiplier: number;
  oxygenDrainMultiplier: number;
  crackRiskMultiplier: number;
  /** <1 biases new cracks toward lighter severity; >1 worsens outcomes. */
  crackEscalationMultiplier: number;
  /** Passive contacts + active scan find chance scaling. */
  discoveryChanceMultiplier: number;
  hazardChanceMultiplier: number;
  ambientChanceMultiplier: number;
  salvageCategoryWeightMultiplier: number;
  signalCategoryWeightMultiplier: number;
  repairSupplyChanceMultiplier: number;
  researchRewardMultiplier: number;
};

const COMMAND_INTENT_MODIFIERS: Record<DiveRoute, CommandIntentModifiers> = {
  push_deeper: {
    depthSpeedMultiplier: 1.35,
    horizontalSpeedMultiplier: 0.75,
    oxygenDrainMultiplier: 1.1,
    crackRiskMultiplier: 1.2,
    crackEscalationMultiplier: 1.12,
    discoveryChanceMultiplier: 0.9,
    hazardChanceMultiplier: 1.15,
    ambientChanceMultiplier: 1.12,
    salvageCategoryWeightMultiplier: 1,
    signalCategoryWeightMultiplier: 1,
    repairSupplyChanceMultiplier: 1,
    researchRewardMultiplier: 1,
  },
  search_salvage: {
    depthSpeedMultiplier: 0.8,
    horizontalSpeedMultiplier: 1.2,
    oxygenDrainMultiplier: 1.05,
    crackRiskMultiplier: 1.05,
    crackEscalationMultiplier: 1,
    discoveryChanceMultiplier: 1.3,
    hazardChanceMultiplier: 1.08,
    ambientChanceMultiplier: 1.05,
    salvageCategoryWeightMultiplier: 1.45,
    signalCategoryWeightMultiplier: 1,
    repairSupplyChanceMultiplier: 1.25,
    researchRewardMultiplier: 1,
  },
  follow_signal: {
    depthSpeedMultiplier: 0.9,
    horizontalSpeedMultiplier: 1.1,
    oxygenDrainMultiplier: 1.05,
    crackRiskMultiplier: 1.05,
    crackEscalationMultiplier: 1.05,
    discoveryChanceMultiplier: 1.25,
    hazardChanceMultiplier: 1.15,
    ambientChanceMultiplier: 1.08,
    salvageCategoryWeightMultiplier: 1,
    signalCategoryWeightMultiplier: 1.45,
    repairSupplyChanceMultiplier: 1,
    researchRewardMultiplier: 1.25,
  },
  avoid_hazards: {
    depthSpeedMultiplier: 0.7,
    horizontalSpeedMultiplier: 0.85,
    oxygenDrainMultiplier: 0.95,
    crackRiskMultiplier: 0.65,
    crackEscalationMultiplier: 0.75,
    discoveryChanceMultiplier: 0.85,
    hazardChanceMultiplier: 0.7,
    ambientChanceMultiplier: 0.75,
    salvageCategoryWeightMultiplier: 1,
    signalCategoryWeightMultiplier: 1,
    repairSupplyChanceMultiplier: 1,
    researchRewardMultiplier: 1,
  },
  stabilize_systems: {
    depthSpeedMultiplier: 0.5,
    horizontalSpeedMultiplier: 0.4,
    oxygenDrainMultiplier: 0.85,
    crackRiskMultiplier: 0.6,
    crackEscalationMultiplier: 0.6,
    discoveryChanceMultiplier: 0.6,
    hazardChanceMultiplier: 0.75,
    ambientChanceMultiplier: 0.7,
    salvageCategoryWeightMultiplier: 1,
    signalCategoryWeightMultiplier: 1,
    repairSupplyChanceMultiplier: 1,
    researchRewardMultiplier: 1,
  },
};

export function getCommandIntentModifiers(route: DiveRoute): CommandIntentModifiers {
  return COMMAND_INTENT_MODIFIERS[route] ?? COMMAND_INTENT_MODIFIERS.push_deeper;
}
