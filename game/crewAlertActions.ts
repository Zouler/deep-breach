import type { Router } from 'expo-router';

import { oxygenCanisterCount } from '@/game/cargo';
import { ROUTE_OPTIONS } from '@/game/navigation';
import type { CrewAlertAction, CrewAlertActionType } from '@/types/crewAlerts';
import type { DiveRoute, DiveSession, GameState } from '@/types';

/** Narrow dispatch surface for alert actions (avoids importing the full reducer union). */
export type CrewAlertDispatch =
  | { type: 'SET_DIVE_ROUTE'; route: DiveRoute }
  | { type: 'USE_EMERGENCY_OXYGEN' }
  | { type: 'RETURN_TO_BASE' };

const ROUTE_IDS = new Set<DiveRoute>(ROUTE_OPTIONS.map((r) => r.id));

function isDiveRoute(v: string | undefined): v is DiveRoute {
  return v != null && ROUTE_IDS.has(v as DiveRoute);
}

function worstLeakRoom(dive: DiveSession): { id: string } | null {
  const order: Record<string, number> = { hairline: 0, moderate: 1, critical: 2 };
  let best: { id: string; score: number } | null = null;
  for (const r of dive.rooms) {
    for (const c of r.cracks) {
      const sc = order[c.severity] ?? 0;
      if (!best || sc > best.score) best = { id: r.id, score: sc };
    }
  }
  return best;
}

function isSafeTargetRoute(r: string): boolean {
  // Keep this allowlist tight; we only support navigation to existing safe routes.
  return (
    r === '/base-storage' ||
    r === '/captains-log' ||
    r === '/repair-dock' ||
    r === '/inventory' ||
    r === '/nav-map' ||
    r === '/tactical-sonar' ||
    r === '/dive' ||
    r === '/base' ||
    r === '/mission-result'
  );
}

export type CrewAlertExecutionExtras = {
  /** Dive HUD: opens command intent modal */
  openCommandIntentPicker?: () => void;
};

export type ExecuteCrewAlertActionParams = {
  action: CrewAlertAction;
  state: GameState;
  dispatch: (a: CrewAlertDispatch) => void;
  router: Pick<Router, 'push' | 'replace'>;
  extras?: CrewAlertExecutionExtras;
};

export type CrewAlertExecutionResult =
  | { ok: true }
  | { ok: false; reason: string };

function canUseEmergencyOxygen(dive: DiveSession, submarine: GameState['submarine']): boolean {
  if (dive.status !== 'active') return false;
  return oxygenCanisterCount(dive) > 0 || dive.emergencyOxygenChargesRemaining > 0;
}

/** Advisory: return-to-base shortcut is offered when dive is active (abort is always allowed in MVP). */
export function isReturnToBaseAdvisoryEnabled(dive: DiveSession | null | undefined): boolean {
  return dive?.status === 'active';
}

/**
 * Central executor for crew alert / cut-in actions. Validates current state; no-ops safely when stale.
 */
export function executeCrewAlertAction(p: ExecuteCrewAlertActionParams): CrewAlertExecutionResult {
  const { action, state, dispatch, router, extras } = p;
  const dive = state.dive;
  const type: CrewAlertActionType = action.type;

  const ensureActiveDive = (): DiveSession | null => {
    if (!dive || dive.status !== 'active') return null;
    return dive;
  };

  switch (type) {
    case 'acknowledge':
      return { ok: true };
    case 'open_room': {
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      const rid = action.payload?.roomId;
      if (!rid || !d.rooms.some((r) => r.id === rid)) return { ok: false, reason: 'room_missing' };
      router.push(`/room/${rid}` as never);
      return { ok: true };
    }
    case 'open_repairs': {
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      const rid = action.payload?.roomId ?? worstLeakRoom(d)?.id;
      if (!rid) {
        router.push('/dive' as never);
        return { ok: true };
      }
      router.push(`/room/${rid}` as never);
      return { ok: true };
    }
    case 'open_inventory':
    case 'open_cargo': {
      const target = action.payload?.targetRoute;
      if (target && isSafeTargetRoute(target)) {
        router.push(target as never);
        return { ok: true };
      }
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      router.push('/inventory' as never);
      return { ok: true };
    }
    case 'use_emergency_oxygen': {
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      if (!canUseEmergencyOxygen(d, state.submarine)) return { ok: false, reason: 'oxygen_unavailable' };
      dispatch({ type: 'USE_EMERGENCY_OXYGEN' });
      return { ok: true };
    }
    case 'change_command_intent': {
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      extras?.openCommandIntentPicker?.();
      return { ok: true };
    }
    case 'set_command_intent': {
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      const raw = action.payload?.commandIntent;
      if (!isDiveRoute(raw)) return { ok: false, reason: 'invalid_intent' };
      dispatch({ type: 'SET_DIVE_ROUTE', route: raw });
      return { ok: true };
    }
    case 'open_map': {
      const target = action.payload?.targetRoute;
      if (target && isSafeTargetRoute(target)) {
        router.push(target as never);
        return { ok: true };
      }
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      router.push('/nav-map' as never);
      return { ok: true };
    }
    case 'open_sonar': {
      const target = action.payload?.targetRoute;
      if (target && isSafeTargetRoute(target)) {
        router.push(target as never);
        return { ok: true };
      }
      const d = ensureActiveDive();
      if (!d) return { ok: false, reason: 'no_active_dive' };
      router.push('/tactical-sonar' as never);
      return { ok: true };
    }
    case 'return_to_base': {
      if (!isReturnToBaseAdvisoryEnabled(dive)) return { ok: false, reason: 'no_active_dive' };
      dispatch({ type: 'RETURN_TO_BASE' });
      router.replace('/base' as never);
      return { ok: true };
    }
    case 'open_repair_dock': {
      if (dive?.status === 'active') {
        dispatch({ type: 'RETURN_TO_BASE' });
        const target = action.payload?.targetRoute;
        router.replace((target && isSafeTargetRoute(target) ? target : '/repair-dock') as never);
        return { ok: true };
      }
      const target = action.payload?.targetRoute;
      router.push((target && isSafeTargetRoute(target) ? target : '/repair-dock') as never);
      return { ok: true };
    }
    case 'open_mission_report': {
      if (state.lastMissionOutcome) router.replace('/mission-result' as never);
      else router.replace('/base' as never);
      return { ok: true };
    }
    default:
      return { ok: false, reason: 'unknown_action' };
  }
}

/** Filter actions for current state (hide invalid oxygen / room targets). */
export function filterCrewAlertActionsForState(
  state: GameState,
  actions: CrewAlertAction[] | undefined,
): CrewAlertAction[] {
  if (!actions?.length) return [];
  const dive = state.dive;
  const out: CrewAlertAction[] = [];
  for (const a of actions) {
    if (a.type === 'acknowledge') {
      out.push(a);
      continue;
    }
    // Do not surface actions while report/offline flow owns the UI.
    if (state.lastMissionOutcome || state.pendingOfflineReport) {
      // allow only navigation to Captain's Log / base-storage from base flows if explicitly provided
      const safePassive =
        (a.type === 'open_map' || a.type === 'open_sonar' || a.type === 'open_inventory' || a.type === 'open_cargo') &&
        a.payload?.targetRoute &&
        isSafeTargetRoute(a.payload.targetRoute);
      if (!safePassive) continue;
    }
    if (a.type === 'use_emergency_oxygen') {
      if (!dive || dive.status !== 'active') continue;
      if (!canUseEmergencyOxygen(dive, state.submarine)) continue;
    }
    if (a.type === 'open_room' || a.type === 'open_repairs') {
      if (!dive || dive.status !== 'active') continue;
      // if no active cracks at all, hide
      if (!dive.rooms.some((r) => r.cracks.length > 0)) continue;
      if (a.payload?.roomId) {
        const room = dive.rooms.find((r) => r.id === a.payload!.roomId);
        if (!room) continue;
        // if the target room no longer needs attention, hide
        if (room.cracks.length === 0) continue;
      }
    }
    if (a.type === 'set_command_intent' || a.type === 'change_command_intent') {
      if (!dive || dive.status !== 'active') continue;
      if (a.type === 'set_command_intent') {
        const intent = a.payload?.commandIntent;
        if (!isDiveRoute(intent)) continue;
        // Hide redundant intent buttons (already active).
        if (dive.currentRoute === intent) continue;
      }
    }
    if (
      a.type === 'open_inventory' ||
      a.type === 'open_cargo' ||
      a.type === 'open_map' ||
      a.type === 'open_sonar'
    ) {
      const target = a.payload?.targetRoute;
      if (target) {
        if (!isSafeTargetRoute(target)) continue;
      } else {
        if (!dive || dive.status !== 'active') continue;
      }
    }
    if (a.type === 'return_to_base' && !isReturnToBaseAdvisoryEnabled(dive)) continue;
    if (a.type === 'open_mission_report') {
      const diveTerminal = !state.dive || state.dive.status !== 'active';
      if (!state.lastMissionOutcome && !diveTerminal) continue;
    }
    out.push(a);
  }
  return out;
}
