import type { CrewMember, CrewRole, CrewSpecializationId } from '@/types';

/** Dives an assigned crew member must complete before a specialization choice unlocks. */
export const SPECIALIZATION_UNLOCK_DIVES = 2;

export interface CrewSpecialization {
  id: CrewSpecializationId;
  role: CrewRole;
  name: string;
  blurb: string;
  repairSkillMultiplier?: number;
  navigationSkillMultiplier?: number;
  researchSkillMultiplier?: number;
  /** Extra reduction to Engine Bay heat rise while this engineer is assigned. */
  engineHeatMitigationBonus?: number;
  /** Extra reduction to crack/ambient hazard chance while this navigator is assigned. */
  hazardMitigationBonus?: number;
  /** Extra reduction to external-discovery hazard-trigger chance while this scientist is assigned. */
  discoveryHazardMitigationBonus?: number;
}

const SPECIALIZATIONS: Record<CrewSpecializationId, CrewSpecialization> = {
  engineer_rapid_repairs: {
    id: 'engineer_rapid_repairs',
    role: 'engineer',
    name: 'Rapid Repairs',
    blurb: 'Faster, more reliable field repairs on hull breaches.',
    repairSkillMultiplier: 1.4,
  },
  engineer_heat_discipline: {
    id: 'engineer_heat_discipline',
    role: 'engineer',
    name: 'Heat Discipline',
    blurb: 'Keeps the Engine Bay running cooler for longer.',
    engineHeatMitigationBonus: 0.22,
  },
  navigator_efficient_routes: {
    id: 'navigator_efficient_routes',
    role: 'navigator',
    name: 'Efficient Routes',
    blurb: 'Sharper plotting improves scan quality and offline progress.',
    navigationSkillMultiplier: 1.4,
  },
  navigator_hazard_sense: {
    id: 'navigator_hazard_sense',
    role: 'navigator',
    name: 'Hazard Sense',
    blurb: 'Reads the terrain early — fewer structural and ambient surprises.',
    hazardMitigationBonus: 0.18,
  },
  scientist_deep_analysis: {
    id: 'scientist_deep_analysis',
    role: 'scientist',
    name: 'Deep Analysis',
    blurb: 'Extracts more value from every recovery and sample.',
    researchSkillMultiplier: 1.4,
  },
  scientist_steady_hands: {
    id: 'scientist_steady_hands',
    role: 'scientist',
    name: 'Steady Hands',
    blurb: 'Handles unstable contacts more safely during recovery attempts.',
    discoveryHazardMitigationBonus: 0.2,
  },
};

export function specializationOptionsForRole(role: CrewRole): CrewSpecialization[] {
  return Object.values(SPECIALIZATIONS).filter((s) => s.role === role);
}

export function getCrewSpecialization(
  id: CrewSpecializationId | null | undefined,
): CrewSpecialization | null {
  return id ? (SPECIALIZATIONS[id] ?? null) : null;
}

export function hasPendingSpecialization(member: CrewMember): boolean {
  return member.hired && !member.specializationId && member.divesCompleted >= SPECIALIZATION_UNLOCK_DIVES;
}

export function isValidSpecializationChoice(role: CrewRole, id: CrewSpecializationId): boolean {
  return SPECIALIZATIONS[id]?.role === role;
}

export function effectiveRepairSkill(member: CrewMember): number {
  const spec = getCrewSpecialization(member.specializationId);
  return member.repairSkill * (spec?.repairSkillMultiplier ?? 1);
}

export function effectiveNavigationSkill(member: CrewMember): number {
  const spec = getCrewSpecialization(member.specializationId);
  return member.navigationSkill * (spec?.navigationSkillMultiplier ?? 1);
}

export function effectiveResearchSkill(member: CrewMember): number {
  const spec = getCrewSpecialization(member.specializationId);
  return member.researchSkill * (spec?.researchSkillMultiplier ?? 1);
}

/** Sum of Hazard Sense bonuses from assigned navigators (reduces crack/ambient hazard chance). */
export function navigatorHazardSenseBonus(crew: CrewMember[]): number {
  const navs = crew.filter((c) => c.hired && c.assignedToDive && c.role === 'navigator');
  return navs.reduce((acc, m) => {
    const spec = getCrewSpecialization(m.specializationId);
    return acc + (spec?.hazardMitigationBonus ?? 0);
  }, 0);
}

/** Sum of Steady Hands bonuses from assigned scientists (reduces discovery hazard-trigger chance). */
export function scientistSteadyHandsBonus(crew: CrewMember[]): number {
  const scientists = crew.filter((c) => c.hired && c.assignedToDive && c.role === 'scientist');
  return scientists.reduce((acc, m) => {
    const spec = getCrewSpecialization(m.specializationId);
    return acc + (spec?.discoveryHazardMitigationBonus ?? 0);
  }, 0);
}

/** Bumps dive counts for every hired-and-assigned crew member; call once per terminal dive. */
export function incrementCrewDiveCounts(crew: CrewMember[]): CrewMember[] {
  return crew.map((c) =>
    c.hired && c.assignedToDive ? { ...c, divesCompleted: c.divesCompleted + 1 } : c,
  );
}
