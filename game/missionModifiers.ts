export interface MissionModifier {
  id: string;
  name: string;
  blurb: string;
  oxygenDrainMultiplier?: number;
  crackRiskMultiplier?: number;
  /** Nudges both ambient events and external discovery contacts together. */
  hazardChanceMultiplier?: number;
}

const COLD_TRENCH: MissionModifier = {
  id: 'cold_trench',
  name: 'Cold Trench',
  blurb: 'Frigid water strains the O₂ plant — oxygen burns faster this trial.',
  oxygenDrainMultiplier: 1.3,
};

const DEBRIS_FIELD: MissionModifier = {
  id: 'debris_field',
  name: 'Debris Field',
  blurb: 'Wreckage litters the route — more contacts to work, more hull risk.',
  crackRiskMultiplier: 1.25,
  hazardChanceMultiplier: 1.35,
};

const SLACK_CURRENT: MissionModifier = {
  id: 'slack_current',
  name: 'Slack Current',
  blurb: 'Unusually calm water eases the descent this trial.',
  crackRiskMultiplier: 0.8,
  hazardChanceMultiplier: 0.85,
};

/**
 * Rotation of conditions offered across repeated attempts at a mission.
 * Index 0 is always `null` (standard conditions) so a player's first-ever
 * attempt at any mission stays at the tuned baseline difficulty.
 */
export const MISSION_MODIFIER_ROTATION: (MissionModifier | null)[] = [
  null,
  COLD_TRENCH,
  DEBRIS_FIELD,
  SLACK_CURRENT,
];

export function modifierForAttempt(attemptsSoFar: number): MissionModifier | null {
  const idx = ((attemptsSoFar % MISSION_MODIFIER_ROTATION.length) + MISSION_MODIFIER_ROTATION.length) %
    MISSION_MODIFIER_ROTATION.length;
  return MISSION_MODIFIER_ROTATION[idx] ?? null;
}

export function getMissionModifierById(id: string | null | undefined): MissionModifier | null {
  if (!id) return null;
  return MISSION_MODIFIER_ROTATION.find((m) => m?.id === id) ?? null;
}

/** True when the modifier makes the trial harder overall (for UI color/tone). */
export function isHarderModifier(modifier: MissionModifier): boolean {
  return (
    (modifier.oxygenDrainMultiplier ?? 1) > 1 ||
    (modifier.crackRiskMultiplier ?? 1) > 1 ||
    (modifier.hazardChanceMultiplier ?? 1) > 1
  );
}
