import { enqueueCutIn } from '@/game/cutInQueue';
import { pushCrewMessage } from '@/game/crewMessages';
import { getRepairStockStatus } from '@/game/repairResourceStatus';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { DiveSession, GameState } from '@/types';

const MIN_GAP_MS = 22_000;
const CRITICAL_REPEAT_MS = 125_000;

const CE_MSG_EMPTY_NO_BREACH =
  'Commander, repair stock is depleted. We can continue, but any new breach will be a serious risk.';

const CE_MSG_CRITICAL =
  "Commander, we're out of repair stock. We can't seal this breach without salvage or a return to base.";

function stockCriticalActions(): CrewAlertAction[] {
  return [
    {
      id: 'search_salvage_stock',
      label: 'Search for Salvage',
      type: 'set_command_intent',
      payload: { commandIntent: 'search_salvage' },
      style: 'primary',
    },
    {
      id: 'stabilize_stock',
      label: 'Stabilize Systems',
      type: 'set_command_intent',
      payload: { commandIntent: 'stabilize_systems' },
      style: 'secondary',
    },
    {
      id: 'return_stock',
      label: 'Return to Base',
      type: 'return_to_base',
      style: 'danger',
    },
  ];
}

function stockEmptyNoBreachActions(): CrewAlertAction[] {
  return [
    {
      id: 'search_salvage_empty',
      label: 'Search for Salvage',
      type: 'set_command_intent',
      payload: { commandIntent: 'search_salvage' },
      style: 'primary',
    },
    {
      id: 'stabilize_empty',
      label: 'Stabilize Systems',
      type: 'set_command_intent',
      payload: { commandIntent: 'stabilize_systems' },
      style: 'secondary',
    },
  ];
}

/**
 * Chief Engineer + optional `first_no_repair_supplies` cut-in when hull repair stock is gone.
 */
export function withRepairStockCrewAwareness(
  state: GameState,
  prevDive: DiveSession,
  nextDive: DiveSession,
  now: number,
  opts?: { suppressCriticalEmptyCrewLine?: boolean },
): GameState {
  if (nextDive.status !== 'active') {
    return { ...state, dive: nextDive };
  }

  const prevS = getRepairStockStatus(prevDive);
  const nextS = getRepairStockStatus(nextDive);
  let dive = nextDive;
  let out: GameState = { ...state, dive };

  if (nextS === 'healthy' || nextS === 'low') {
    return { ...out, dive: { ...dive, lastRepairStockBriefStatus: nextS } };
  }

  const lastAt = dive.lastRepairStockCrewWarningAt ?? 0;
  const timeOkShort = now - lastAt >= MIN_GAP_MS;
  const timeOkCriticalRepeat = now - lastAt >= CRITICAL_REPEAT_MS;

  let shouldSpeak = false;
  if (nextS === 'critical_empty') {
    if (prevS !== 'critical_empty') shouldSpeak = true;
    else if (timeOkCriticalRepeat) shouldSpeak = true;
  } else if (nextS === 'empty') {
    if (prevS !== 'empty' && prevS !== 'critical_empty' && timeOkShort) shouldSpeak = true;
  }

  const criticalTransition = nextS === 'critical_empty' && prevS !== 'critical_empty';
  if (opts?.suppressCriticalEmptyCrewLine && criticalTransition) {
    dive = {
      ...dive,
      lastRepairStockCrewWarningAt: now,
      lastRepairStockBriefStatus: nextS,
    };
    out = { ...out, dive };
    out = enqueueCutIn(out, 'first_no_repair_supplies');
    return out;
  }

  if (!shouldSpeak) {
    return { ...out, dive: { ...dive, lastRepairStockBriefStatus: nextS } };
  }

  const text = nextS === 'critical_empty' ? CE_MSG_CRITICAL : CE_MSG_EMPTY_NO_BREACH;
  const actions =
    nextS === 'critical_empty' ? stockCriticalActions() : stockEmptyNoBreachActions();
  dive = pushCrewMessage(dive, {
    speaker: 'chief_engineer',
    department: 'Engineering',
    text,
    severity: nextS === 'critical_empty' ? 'danger' : 'warning',
    actions,
  });
  dive = {
    ...dive,
    lastRepairStockCrewWarningAt: now,
    lastRepairStockBriefStatus: nextS,
  };
  out = { ...out, dive };

  if (nextS === 'critical_empty' && prevS !== 'critical_empty') {
    out = enqueueCutIn(out, 'first_no_repair_supplies');
    dive = out.dive ?? dive;
    out = { ...out, dive };
  }

  return out;
}
