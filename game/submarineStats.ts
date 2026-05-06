import type { CrewMember, Submarine, SubmarineModuleType } from '@/types';

export function moduleLevel(sub: Submarine, type: SubmarineModuleType): number {
  return sub.modules.find((m) => m.type === type)?.level ?? 1;
}

export function sonarQuality(sub: Submarine): number {
  return 0.35 + moduleLevel(sub, 'sonar') * 0.12;
}

/** Expedition cargo capacity by Cargo Bay level (MVP curve). */
export function cargoCapacityUnits(sub: Submarine): number {
  const lvl = Math.max(1, moduleLevel(sub, 'cargo'));
  const byLevel: Record<number, number> = {
    1: 20,
    2: 30,
    3: 45,
    4: 60,
    5: 75,
    6: 90,
  };
  return byLevel[lvl] ?? 60 + (lvl - 4) * 15;
}

export function hullMitigation(sub: Submarine): number {
  return 0.08 + moduleLevel(sub, 'hull') * 0.06;
}

export function oxygenEfficiency(sub: Submarine): number {
  return 0.55 + moduleLevel(sub, 'oxygen') * 0.1;
}

export function autoSealStrength(sub: Submarine): number {
  return 0.1 + moduleLevel(sub, 'autoSeal') * 0.08;
}

export function assignedCrew(crew: CrewMember[]): CrewMember[] {
  return crew.filter((c) => c.hired && c.assignedToDive);
}

export function crewRepairBonus(crew: CrewMember[]): number {
  const c = assignedCrew(crew);
  if (!c.length) return 0;
  return c.reduce((acc, m) => acc + m.repairSkill, 0) / c.length * 0.15;
}

/** Stronger weighting when an engineer is on the active dive roster. */
export function engineerRepairBonus(crew: CrewMember[]): number {
  const eng = assignedCrew(crew).filter((c) => c.role === 'engineer');
  if (!eng.length) return 0;
  return Math.max(...eng.map((e) => e.repairSkill)) * 0.22;
}

export function crewNavigationBonus(crew: CrewMember[]): number {
  const c = assignedCrew(crew);
  if (!c.length) return 0;
  return c.reduce((acc, m) => acc + m.navigationSkill, 0) / c.length * 0.12;
}

export function crewResearchBonus(crew: CrewMember[]): number {
  const c = assignedCrew(crew);
  if (!c.length) return 0;
  return c.reduce((acc, m) => acc + m.researchSkill, 0) / c.length * 0.1;
}

export function riskScalar(risk: string): number {
  switch (risk) {
    case 'low':
      return 0.75;
    case 'medium':
      return 1;
    case 'medium-high':
      return 1.25;
    case 'high':
      return 1.45;
    default:
      return 1;
  }
}
