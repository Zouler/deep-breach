import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import { computeCargoUsed, oxygenCanisterCount } from '@/game/cargo';
import { filterCrewAlertActionsForState } from '@/game/crewAlertActions';
import { getRepairStockStatus } from '@/game/repairResourceStatus';
import { canPerformAreaScan } from '@/game/scanArea';
import { cargoCapacityUnits } from '@/game/submarineStats';
import type { DepartmentBriefing, DepartmentLeadId } from '@/types/departmentBriefings';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { GameState, Mission } from '@/types';

function leadLabel(id: DepartmentLeadId): string {
  const lead = CREW_LEADS_BY_ID[id];
  return lead ? `${lead.displayName} · ${lead.department}` : id;
}

function paragraph(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

function openRepairsIfLeak(state: GameState): CrewAlertAction | null {
  const d = state.dive;
  if (!d || d.status !== 'active') return null;
  const room = d.rooms.find((r) => r.cracks.some((c) => c.severity === 'critical')) ?? d.rooms.find((r) => r.cracks.length > 0);
  if (!room) return null;
  return { id: `open_room_${room.id}`, label: `Open ${room.name} Repairs`, type: 'open_room', payload: { roomId: room.id }, style: 'primary' };
}

function stabilizeIntent(): CrewAlertAction {
  return {
    id: 'stabilize',
    label: 'Stabilize Systems',
    type: 'set_command_intent',
    payload: { commandIntent: 'stabilize_systems' },
    style: 'secondary',
  };
}

function searchSalvageIntent(): CrewAlertAction {
  return {
    id: 'search_salvage',
    label: 'Search for Salvage',
    type: 'set_command_intent',
    payload: { commandIntent: 'search_salvage' },
    style: 'secondary',
  };
}

function openTacSonar(): CrewAlertAction {
  return { id: 'open_sonar', label: 'Open Tac Sonar', type: 'open_sonar', style: 'primary' };
}

function openNavMap(): CrewAlertAction {
  return { id: 'open_map', label: 'Open Nav Map', type: 'open_map', style: 'primary' };
}

function openInventory(label = 'Open Inventory'): CrewAlertAction {
  return { id: 'open_inventory', label, type: 'open_inventory', style: 'primary' };
}

function changeIntent(): CrewAlertAction {
  return { id: 'change_intent', label: 'Change Command Intent', type: 'change_command_intent', style: 'secondary' };
}

function returnToBase(): CrewAlertAction {
  return { id: 'return', label: 'Return to Base', type: 'return_to_base', style: 'danger' };
}

function emergencyOxygenAction(): CrewAlertAction {
  return { id: 'use_o2', label: 'Use Emergency Oxygen', type: 'use_emergency_oxygen', style: 'primary' };
}

function openRepairDock(): CrewAlertAction {
  return { id: 'open_rd', label: 'Open Repair Dock', type: 'open_repair_dock', style: 'primary' };
}

function openBaseStorage(): CrewAlertAction {
  return {
    id: 'open_storage',
    label: 'Open Base Storage',
    type: 'open_cargo',
    style: 'primary',
    payload: { targetRoute: '/base-storage' },
  };
}

function captainLog(): CrewAlertAction {
  return {
    id: 'open_log',
    label: 'Open Captain’s Log',
    type: 'open_map',
    style: 'secondary',
    payload: { targetRoute: '/captains-log' },
  };
}

export function buildDepartmentBriefing(
  state: GameState,
  mission: Mission | null,
  leadId: DepartmentLeadId,
  now: number,
): DepartmentBriefing {
  const dive = state.dive;
  const atDive = Boolean(dive && dive.status === 'active');
  const lead = CREW_LEADS_BY_ID[leadId];
  const title = lead ? `${lead.displayName} · ${lead.department}` : leadLabel(leadId);
  const paragraphs: string[] = [];
  let recommendation: string | undefined;
  const actions: CrewAlertAction[] = [];

  if (leadId === 'xo') {
    paragraphs.push(
      paragraph(
        `Commander ${state.commander.name}, crew condition is`,
        state.crewState.readiness < 30 ? 'strained.' : 'acceptable.',
      ),
    );
    paragraphs.push(
      paragraph(
        `Morale ${Math.round(state.crewState.morale)} · Stress ${Math.round(state.crewState.stress)} · Discipline ${Math.round(state.crewState.discipline)} · Readiness ${Math.round(state.crewState.readiness)}.`,
      ),
    );
    if (state.pendingInternalCrewEventId) {
      paragraphs.push('There is an unresolved internal matter awaiting your decision at base.');
      recommendation = 'Resolve the crew event before the next trial to keep readiness stable.';
    } else if (state.crewState.stress > 70) {
      recommendation = 'Keep operations stable and avoid unnecessary strain until stress settles.';
    } else {
      recommendation = atDive
        ? 'If the vessel remains stable, XO Command delegation is available when you step away.'
        : 'Crew is standing by. Select the next trial when ready.';
    }
    actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'primary' });
    actions.push(captainLog());
  }

  if (leadId === 'chief_engineer') {
    if (atDive && dive) {
      const stock = getRepairStockStatus(dive);
      const criticalRoom =
        dive.rooms.find((r) => r.cracks.some((c) => c.severity === 'critical')) ??
        dive.rooms.find((r) => r.cracks.some((c) => c.severity === 'moderate')) ??
        null;
      const cracks = dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
      paragraphs.push(
        paragraph(
          `Hull integrity ${Math.round(dive.hullIntegrityPercent)}% · Water ${Math.round(dive.waterLevelPercent)}% · Oxygen ${Math.round(dive.oxygenPercent)}%.`,
        ),
      );
      paragraphs.push(
        cracks > 0
          ? criticalRoom
            ? `Active leaks detected. Worst compartment: ${criticalRoom.name}.`
            : 'Active leaks detected across compartments.'
          : 'No active breaches across compartments.',
      );
      paragraphs.push(`Repair stock status: ${stock.replace('_', ' ')}.`);

      const open = openRepairsIfLeak(state);
      if (open) actions.push(open);
      actions.push(stabilizeIntent());
      if (stock === 'empty' || stock === 'critical_empty') actions.push(searchSalvageIntent());
      actions.push(returnToBase());

      recommendation =
        cracks > 0
          ? 'Authorize repairs on the worst compartment and stabilize the plant before pushing depth.'
          : stock === 'low'
            ? 'Repair stock is below comfort margin — salvage focus is recommended before deeper pressure bands.'
            : 'Engineering crews are stable. Maintain current intent unless margins tighten.';
    } else {
      const hull = Math.round(state.submarine.hullIntegrityPercent);
      paragraphs.push(`Hull integrity at dock: ${hull}%.`);
      paragraphs.push('Systems are in facility posture. Engineering crews are ready for maintenance operations.');
      recommendation =
        hull < 55 ? 'Recommend Repair Dock maintenance before the next trial.' : 'Boat is ready for the next trial. Keep stock levels healthy.';
      actions.push(openRepairDock());
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
    }
  }

  if (leadId === 'navigation_officer') {
    if (atDive && dive) {
      paragraphs.push(
        paragraph(
          `Current intent: ${dive.currentRoute.replaceAll('_', ' ')}.`,
          `Depth ${Math.round(dive.currentDepthM)}m · Range ${(dive.horizontalDistanceKm ?? 0).toFixed(1)} km.`,
        ),
      );
      paragraphs.push(
        paragraph(
          `Vector: ${dive.verticalMovementState.replaceAll('_', ' ')} · ${dive.horizontalMovementState.replaceAll('_', ' ')}.`,
        ),
      );
      recommendation =
        dive.currentRoute === 'push_deeper'
          ? 'Pressure margins will narrow. Consider stabilizing if hull or oxygen bands fall.'
          : 'Navigation is executing intent. Adjust command intent if priorities change.';
      actions.push(changeIntent());
      actions.push(openNavMap());
      actions.push(stabilizeIntent());
    } else {
      paragraphs.push('Navigation team is standing by with facility plotting tools.');
      recommendation = 'Select a trial from the schedule and I will plot the descent vector.';
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'primary' });
    }
  }

  if (leadId === 'sensor_officer') {
    if (atDive && dive) {
      const pending = dive.pendingDiscovery;
      if (pending) {
        paragraphs.push(`Active contact: ${pending.title}. Risk band ${pending.riskBand.toUpperCase()}.`);
        recommendation = 'Recommend scan confirmation before committing to recovery.';
      } else {
        paragraphs.push('No active contacts on current sweep.');
        recommendation = 'Run Scan Area when cooldown allows to confirm the lane.';
      }
      actions.push(openTacSonar());
      if (pending) actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
      const canScan = mission ? canPerformAreaScan(dive, now) : false;
      if (canScan) {
        // We intentionally do not add a “trigger scan” action type yet (prompt: only safe existing actions).
        paragraphs.push('Scan is ready; execute from the Tactical Actions panel when you are ready.');
      }
    } else {
      paragraphs.push('Passive array calibration nominal. Scanner readiness depends on sonar module and crew staffing.');
      recommendation = 'Once underway, use Scan Area to confirm contacts before recovery.';
      actions.push(openTacSonar());
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
    }
  }

  if (leadId === 'research_lead') {
    if (atDive && dive) {
      if (dive.pendingDiscovery) {
        paragraphs.push('Research is monitoring an external contact for classification.');
        recommendation = 'Recommend scan confirmation; recoveries can introduce hull stress.';
      } else {
        paragraphs.push('No urgent classification tasks in progress.');
        recommendation = 'Bring back samples or artifacts for analysis when available.';
      }
      actions.push(openTacSonar());
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
    } else {
      const bs = state.baseStorage;
      paragraphs.push(`Stored for analysis: Artifacts ${bs.artifacts} · Samples ${bs.samples}.`);
      recommendation =
        bs.artifacts + bs.samples > 0
          ? 'Recommend reviewing storage and running analysis routines before next deep trial.'
          : 'No pending analysis items. Standing by for recovered specimens.';
      actions.push(openBaseStorage());
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
    }
  }

  if (leadId === 'logistics_officer') {
    if (atDive && dive) {
      const used = computeCargoUsed(dive);
      const cap = cargoCapacityUnits(state.submarine);
      paragraphs.push(`Expedition cargo: ${used}/${cap}.`);
      const stock = getRepairStockStatus(dive);
      paragraphs.push(`Repair stock (expedition hull kits): ${stock.replace('_', ' ')}.`);
      recommendation =
        used >= cap
          ? 'Cargo is full. Return to base or make space before attempting more recoveries.'
          : stock === 'empty' || stock === 'critical_empty'
            ? 'Repair stock is depleted. Salvage-focused intent is recommended.'
            : 'Cargo space remains available. Maintain supply margins as pressure increases.';
      actions.push(openInventory('Open Cargo'));
      actions.push(searchSalvageIntent());
      actions.push(returnToBase());
    } else {
      paragraphs.push('Base storage manifests are available; repair and oxygen supplies can be staged before a trial.');
      recommendation = 'Review Base Storage and Repair Dock restock before deeper certification trials.';
      actions.push(openBaseStorage());
      actions.push(openRepairDock());
    }
  }

  if (leadId === 'system') {
    if (atDive && dive) {
      paragraphs.push('Diagnostic sweep complete.');
      paragraphs.push(
        paragraph(
          `Hull ${Math.round(dive.hullIntegrityPercent)}% · Oxygen ${Math.round(dive.oxygenPercent)}% · Water ${Math.round(dive.waterLevelPercent)}%.`,
        ),
      );
      const canUseO2 = oxygenCanisterCount(dive) > 0 || dive.emergencyOxygenChargesRemaining > 0;
      recommendation = canUseO2
        ? 'If oxygen margins fall below safe bands, emergency oxygen routing is available.'
        : 'Emergency oxygen reserve unavailable. Return to base if oxygen margins degrade.';
      if (canUseO2) actions.push(emergencyOxygenAction());
      actions.push(stabilizeIntent());
      actions.push(returnToBase());
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'secondary' });
    } else {
      paragraphs.push('Facility diagnostic complete. Core systems remain within operational tolerance.');
      recommendation = 'No immediate action required. Proceed when ready.';
      actions.push({ id: 'ack', label: 'Acknowledge', type: 'acknowledge', style: 'primary' });
    }
  }

  const filtered = filterCrewAlertActionsForState(state, actions);
  return {
    leadId,
    title,
    paragraphs,
    recommendation,
    actions: filtered.length ? filtered : undefined,
  };
}

