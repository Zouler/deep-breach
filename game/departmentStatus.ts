import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import { computeCargoUsed, oxygenCanisterCount } from '@/game/cargo';
import { buildSonarContacts } from '@/game/sonarContacts';
import { getRepairStockStatus } from '@/game/repairResourceStatus';
import { cargoCapacityUnits } from '@/game/submarineStats';
import { hasUnresolvedHighStress } from '@/game/pacing';
import type { DepartmentLeadId, DepartmentStatus } from '@/types/departmentBriefings';
import type { GameState, Mission } from '@/types';

function leadName(id: DepartmentLeadId): string {
  return CREW_LEADS_BY_ID[id]?.displayName ?? id;
}

function stable(leadId: DepartmentLeadId, shortReport: string): DepartmentStatus {
  return { leadId, tone: 'stable', badgeLabel: 'STABLE', shortReport };
}
function warning(leadId: DepartmentLeadId, shortReport: string): DepartmentStatus {
  return { leadId, tone: 'warning', badgeLabel: 'WARNING', shortReport };
}
function critical(leadId: DepartmentLeadId, shortReport: string): DepartmentStatus {
  return { leadId, tone: 'critical', badgeLabel: 'CRITICAL', shortReport };
}

function diveLeakSummary(state: GameState): { cracks: number; critical: boolean; roomName?: string } {
  const d = state.dive;
  if (!d || d.status !== 'active') return { cracks: 0, critical: false };
  let cracks = 0;
  let criticalLeak = false;
  let worstRoom: { name: string; score: number } | null = null;
  for (const r of d.rooms) {
    for (const c of r.cracks) {
      cracks += 1;
      if (c.severity === 'critical') criticalLeak = true;
      const score = c.severity === 'critical' ? 2 : c.severity === 'moderate' ? 1 : 0;
      if (score > 0 && (!worstRoom || score > worstRoom.score)) worstRoom = { name: r.name, score };
    }
  }
  return { cracks, critical: criticalLeak, roomName: worstRoom?.name };
}

function cargoSummary(state: GameState): { used: number; cap: number } {
  const d = state.dive;
  const cap = cargoCapacityUnits(state.submarine);
  const used = d && d.status === 'active' ? computeCargoUsed(d) : 0;
  return { used, cap };
}

export const COMMAND_BRIEFING_LEADS: DepartmentLeadId[] = [
  'xo',
  'chief_engineer',
  'navigation_officer',
  'sensor_officer',
  'research_lead',
  'logistics_officer',
  'system',
];

export function computeDepartmentStatuses(state: GameState, mission: Mission | null): DepartmentStatus[] {
  const dive = state.dive;
  const atBase = !dive || dive.status !== 'active';
  const crew = state.crewState;
  const leak = diveLeakSummary(state);
  const repairStock = dive && dive.status === 'active' ? getRepairStockStatus(dive) : null;
  const cargo = cargoSummary(state);
  const pending = dive?.status === 'active' ? dive.pendingDiscovery : null;
  const sonar = dive?.status === 'active' ? buildSonarContacts({ dive, mission, route: dive.currentRoute }) : [];
  const ambientHazard = sonar.some((c) => (c.type === 'hazard' || c.type === 'terrain') && c.source === 'ambient');
  const ambientSignal = sonar.some((c) => c.type === 'signal' && c.source === 'ambient');
  const highStress = dive?.status === 'active' ? hasUnresolvedHighStress(dive) : false;

  const out: DepartmentStatus[] = [];

  // XO
  if (crew.readiness < 22 || crew.discipline < 22) {
    out.push(critical('xo', 'Crew readiness is degraded. Internal stability is at risk.'));
  } else if (state.pendingInternalCrewEventId || crew.stress > 72) {
    out.push(warning('xo', state.pendingInternalCrewEventId ? 'Unresolved internal crew event pending.' : 'Crew stress is elevated.'));
  } else {
    out.push(stable('xo', 'Crew readiness is within operational range.'));
  }

  // Chief Engineer
  if (dive?.status === 'active') {
    if (leak.critical || dive.waterLevelPercent > 60 || dive.hullIntegrityPercent < 22) {
      out.push(critical('chief_engineer', leak.roomName ? `Critical damage state. Worst compartment: ${leak.roomName}.` : 'Critical damage state detected.'));
    } else if (repairStock === 'critical_empty') {
      out.push(critical('chief_engineer', 'Active breach with no repair stock available.'));
    } else if (leak.cracks > 0 || dive.hullIntegrityPercent < 55 || repairStock === 'low' || repairStock === 'empty') {
      out.push(warning('chief_engineer', leak.cracks > 0 ? 'Active leak(s) in the compartment stack.' : 'Hull margins are thinning.'));
    } else {
      out.push(stable('chief_engineer', 'Hull integrity stable. No active breaches reported.'));
    }
  } else {
    const hull = Math.round(state.submarine.hullIntegrityPercent);
    if (hull < 45) out.push(warning('chief_engineer', `Hull at ${hull}%. Recommend Repair Dock before next trial.`));
    else out.push(stable('chief_engineer', 'Boat ready for maintenance checks and trial prep.'));
  }

  // Navigation Officer
  if (dive?.status === 'active') {
    if (highStress && (dive.oxygenPercent < 25 || dive.hullIntegrityPercent < 35)) {
      out.push(critical('navigation_officer', 'Margins tightening under current vector. Consider stabilization or return.'));
    } else if (dive.currentRoute === 'push_deeper' && (dive.hullIntegrityPercent < 55 || dive.oxygenPercent < 40)) {
      out.push(warning('navigation_officer', 'Pushing deeper with reduced margins.'));
    } else if (ambientHazard && dive.currentRoute !== 'avoid_hazards') {
      out.push(warning('navigation_officer', 'Terrain / hazard contacts on forward plot.'));
    } else {
      out.push(stable('navigation_officer', `Vector nominal under ${dive.currentRoute.replace('_', ' ')}.`));
    }
  } else {
    out.push(stable('navigation_officer', 'Standing by to plot the next certification trial.'));
  }

  // Sensor Officer
  if (dive?.status === 'active') {
    if (pending && pending.riskBand === 'high') {
      out.push(critical('sensor_officer', 'High-risk external contact active on array.'));
    } else if (pending) {
      out.push(warning('sensor_officer', 'External contact pending. Recommend scan confirmation.'));
    } else if (ambientSignal) {
      out.push(warning('sensor_officer', 'Signal contact off our current path.'));
    } else {
      out.push(stable('sensor_officer', 'No active contacts on current sweep.'));
    }
  } else {
    out.push(stable('sensor_officer', 'Arrays calibrated. Scanner readiness nominal.'));
  }

  // Research Lead
  if (dive?.status === 'active') {
    if (pending && pending.category === 'unknown_artifact' && pending.riskBand !== 'low') {
      out.push(warning('research_lead', 'Unusual signature pending classification.'));
    } else {
      out.push(stable('research_lead', 'No urgent analysis flags. Standing by.'));
    }
  } else {
    const bs = state.baseStorage;
    if (bs.artifacts > 0 || bs.samples > 0) {
      out.push(warning('research_lead', `Analysis queue: artifacts ${bs.artifacts}, samples ${bs.samples}.`));
    } else {
      out.push(stable('research_lead', 'No pending analysis items in storage.'));
    }
  }

  // Logistics Officer
  if (dive?.status === 'active') {
    const cap = cargo.cap;
    const used = cargo.used;
    const nearFull = cap > 0 && used >= Math.max(1, cap - 3);
    const full = cap > 0 && used >= cap;
    if (full) {
      out.push(critical('logistics_officer', `Cargo at capacity (${used}/${cap}). Recoveries may be lost.`));
    } else if (nearFull) {
      out.push(warning('logistics_officer', `Cargo near capacity (${used}/${cap}).`));
    } else if (repairStock === 'empty' || repairStock === 'critical_empty') {
      out.push(warning('logistics_officer', 'Repair stock is depleted; salvage focus recommended.'));
    } else {
      out.push(stable('logistics_officer', `Cargo ${used}/${cap}. Supplies within expected range.`));
    }
  } else {
    out.push(stable('logistics_officer', 'Base storage inventories available on request.'));
  }

  // DBX-07 System
  if (dive?.status === 'active') {
    const issues: string[] = [];
    if (dive.hullIntegrityPercent < 35) issues.push('hull');
    if (dive.oxygenPercent < 30) issues.push('oxygen');
    if (dive.waterLevelPercent > 50) issues.push('flooding');
    if (cargo.cap > 0 && cargo.used >= cargo.cap) issues.push('cargo');
    const canO2 = oxygenCanisterCount(dive) > 0 || dive.emergencyOxygenChargesRemaining > 0;
    if (!canO2 && dive.oxygenPercent < 32) issues.push('no reserve O₂');

    if (issues.length >= 2 || leak.critical) {
      out.push(critical('system', `Diagnostics: critical state vectors (${issues.join(', ')}).`));
    } else if (issues.length) {
      out.push(warning('system', `Diagnostics: advisory flags (${issues.join(', ')}).`));
    } else {
      out.push(stable('system', 'Diagnostics complete. Core systems nominal.'));
    }
  } else {
    out.push(stable('system', `Facility posture. ${leadName('system')} standing by.`));
  }

  return out;
}

