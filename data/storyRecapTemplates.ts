import type { Mission, OfflineReport } from '@/types';

/** Static Act 1 framing for Captain's Log. */
export const STORY_SO_FAR_TEMPLATE =
  "Commander Phillip Roberts has taken command of DBX-07 'Deep Breach' under the Experimental Trials program. Previous DBX prototypes provided valuable data. Some survived. Some did not. DBX-07 is now undergoing pressure, recovery, scanner, oxygen, and command delegation trials for operational certification.";

export function missionStartSummary(missionName: string, commanderName: string): string {
  return `DBX-07 began ${missionName} under ${commanderName}’s authority.`;
}

export function missionCompleteSummary(missionName: string, depthM: number): string {
  return `${missionName} closed within tolerance. Depth band peaked near ${Math.round(depthM)}m before recovery.`;
}

export function missionFailedSummary(missionName: string): string {
  return `Pressure trial ${missionName} ended in failure — hull or survival margins were exceeded.`;
}

export function missionAbortedEarlySummary(missionName: string): string {
  return `DBX-07 broke off ${missionName} early and returned to the facility under the captain’s orders.`;
}

export function emergencyExtractionSummary(mission: Mission | undefined, depthM: number): string {
  const name = mission?.name ?? 'the active trial';
  return `DBX-07 initiated emergency extraction from ${name} after survival margins became unsafe. Last logged depth near ${Math.round(depthM)}m.`;
}

export function breachReportSummary(roomName: string, severity: string): string {
  return `Chief Engineer reported a ${severity} breach in ${roomName}. Repair crews were placed on alert.`;
}

export function repairStabilizedSummary(roomName: string, kitName: string): string {
  return `Repair crews stabilized a leak in ${roomName} using ${kitName}.`;
}

export function discoveryContactSummary(contactTitle: string, scanned: boolean): string {
  if (scanned) {
    return `Sensor crews resolved an external contact — ${contactTitle} — after scan confirmation.`;
  }
  return `Sensor crews detected an external contact during the descent — ${contactTitle}.`;
}

export function salvageRecoverySummary(): string {
  return 'Recovery teams secured meaningful salvage into expedition cargo after captain authorization.';
}

export function artifactRecoverySummary(): string {
  return 'A rare artifact was catalogued and sealed for analysis after recovery.';
}

export function oxygenEmergencySummary(): string {
  return 'Emergency oxygen was deployed to protect the crew stack during a pressure event.';
}

export function xoCommandEnabledSummary(): string {
  return 'XO assumed temporary command under standing orders while the captain was away from the bridge.';
}

export function xoCommandDisabledSummary(): string {
  return 'Captain resumed direct command of the expedition.';
}

export function xoCommandBlockedSummary(): string {
  return 'XO could not accept command delegation until hull, oxygen, and critical leaks stabilized.';
}

export function offlineStandingOrdersSummary(report: OfflineReport, mission: Mission | undefined): string {
  const name = mission?.name ?? 'the active trial';
  const depth = Math.round(report.depthEndM ?? report.depthReachedM);
  const scrap = report.scrapCollected > 0 ? ` Salvage tally increased by ${report.scrapCollected}.` : '';
  const emerg = report.emergencyExtraction ? ' Emergency extraction protocols fired.' : '';
  return `While you were away, DBX-07 continued ${name} under standing orders. The boat advanced to about ${depth}m.${scrap}${emerg}`;
}

export function cargoCapacityWarningSummary(): string {
  return 'Logistics warns expedition cargo is at practical capacity — further recovery may be left behind.';
}
