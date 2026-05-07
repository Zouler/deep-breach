import type { DiveSession, DiveStatus, GameState } from '@/types';

/** Shown in Trial Report supply notes when a contact prompt was cleared at mission end. */
export const UNRESOLVED_DISCOVERY_TRANSITION_NOTE =
  'Unresolved external contact lost during mission transition.';

export function isTerminalDiveStatus(status: DiveStatus): boolean {
  return status !== 'active';
}

export function isDiveTerminal(dive: DiveSession): boolean {
  return isTerminalDiveStatus(dive.status);
}

/**
 * Remove active-dive overlays that must not survive mission end (pending contact, outcome card).
 * Optionally records a single debrief note when dropping an unresolved `pendingDiscovery`.
 */
export function stripTransientDiveOverlays(dive: DiveSession): DiveSession {
  let next: DiveSession = dive;
  if (dive.pendingDiscovery) {
    const log = dive.supplyLog ?? [];
    const note = UNRESOLVED_DISCOVERY_TRANSITION_NOTE;
    const supplyLog = log.includes(note) ? log : [...log, note];
    next = { ...next, pendingDiscovery: null, supplyLog };
  }
  if (next.discoveryOutcomeBanner) {
    next = { ...next, discoveryOutcomeBanner: null };
  }
  return next;
}

/** True when narrative cut-in UI should not block result / report screens or a terminal dive shell. */
export function shouldSuppressNarrativeCutIn(state: GameState, routePath: string): boolean {
  const path = routePath.toLowerCase();
  if (path.includes('mission-result') || path.includes('expedition-report')) return true;
  if (state.lastMissionOutcome) return true;
  if (state.pendingOfflineReport) return true;
  if (state.dive && state.dive.status !== 'active') return true;
  return false;
}

export function shouldHideInternalCrewEventModal(state: GameState): boolean {
  return Boolean(state.lastMissionOutcome || state.pendingOfflineReport);
}
