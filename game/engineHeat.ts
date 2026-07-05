import type { CrewMember, Mission } from '@/types';

import { getCrewSpecialization } from '@/game/crewSpecializations';
import { assignedCrew, engineerRepairBonus, riskScalar } from '@/game/submarineStats';

/**
 * Engine Bay's dedicated hazard: a heat meter, distinct from the generic
 * crack/leak system. It rises passively, is mitigated by an assigned
 * engineer, and must be actively vented — proving compartments can carry
 * mechanics other than "another crack to patch."
 */
export const ENGINE_HEAT_RISE_PCT_PER_SEC = 0.55;
export const ENGINE_HEAT_WARNING_PCT = 60;
export const ENGINE_HEAT_CRITICAL_PCT = 85;
export const ENGINE_HEAT_VENT_COOLDOWN_MS = 26_000;
export const ENGINE_HEAT_VENT_AMOUNT = 42;

function engineerHeatDisciplineBonus(crew: CrewMember[]): number {
  const engineers = assignedCrew(crew).filter((c) => c.role === 'engineer');
  return engineers.reduce((acc, m) => {
    const spec = getCrewSpecialization(m.specializationId);
    return acc + (spec?.engineHeatMitigationBonus ?? 0);
  }, 0);
}

export function computeEngineHeatRisePercent(
  deltaMs: number,
  ctx: { mission: Mission; crew: CrewMember[] },
): number {
  if (deltaMs <= 0) return 0;
  const dtSec = deltaMs / 1000;
  const rs = riskScalar(ctx.mission.risk);
  const mitigation = Math.max(
    0.25,
    1 - engineerRepairBonus(ctx.crew) - engineerHeatDisciplineBonus(ctx.crew),
  );
  return ENGINE_HEAT_RISE_PCT_PER_SEC * dtSec * rs * mitigation;
}

export function canVentEngineHeat(lastVentAt: number, now: number): boolean {
  return now - lastVentAt >= ENGINE_HEAT_VENT_COOLDOWN_MS;
}
