import { computeCargoUsed, oxygenCanisterCount } from '@/game/cargo';
import { pushCrewMessage } from '@/game/crewMessages';
import { buildSonarContacts } from '@/game/sonarContacts';
import { cargoCapacityUnits } from '@/game/submarineStats';
import { getRepairStockStatus } from '@/game/repairResourceStatus';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { DiveSession, GameState, Mission } from '@/types';

const OXY_WARN_PCT = 32;
const OXY_CRIT_PCT = 22;
const OXY_ACTIONABLE_COOLDOWN_MS = 55_000;
const CARGO_ACTIONABLE_COOLDOWN_MS = 70_000;
const SONAR_HAZARD_COOLDOWN_MS = 95_000;
const SONAR_SIGNAL_COOLDOWN_MS = 95_000;

export type SeriousBreachInfo = {
  roomId: string;
  roomName: string;
  severity: 'moderate' | 'critical';
  crackId: string;
};

function oxygenBand(pct: number): 'ok' | 'warn' | 'crit' {
  if (pct < OXY_CRIT_PCT) return 'crit';
  if (pct < OXY_WARN_PCT) return 'warn';
  return 'ok';
}

function stabilizeAction(): CrewAlertAction {
  return {
    id: 'stabilize_systems',
    label: 'Stabilize Systems',
    type: 'set_command_intent',
    payload: { commandIntent: 'stabilize_systems' },
    style: 'secondary',
  };
}

function searchSalvageAction(): CrewAlertAction {
  return {
    id: 'search_salvage',
    label: 'Search for Salvage',
    type: 'set_command_intent',
    payload: { commandIntent: 'search_salvage' },
    style: 'primary',
  };
}

function returnToBaseAction(): CrewAlertAction {
  return {
    id: 'return_to_base',
    label: 'Return to Base',
    type: 'return_to_base',
    style: 'danger',
  };
}

function openRoomRepairsAction(roomId: string, label?: string): CrewAlertAction {
  return {
    id: `open_room_${roomId}`,
    label: label ?? 'Open Compartment Repairs',
    type: 'open_room',
    payload: { roomId },
    style: 'primary',
  };
}

export function emitSeriousBreachActionableMessage(dive: DiveSession, breach: SeriousBreachInfo): DiveSession {
  if (dive.status !== 'active') return dive;
  const signature = `${breach.crackId}:${breach.severity}`;
  if (dive.lastActionableBreachSignature === signature) return dive;

  const stock = getRepairStockStatus(dive);
  const outOfHullKits = stock === 'empty' || stock === 'critical_empty';
  const sevLabel = breach.severity === 'critical' ? 'Critical leak' : 'Moderate leak';

  let text: string;
  let actions: CrewAlertAction[];

  if (outOfHullKits) {
    text =
      "Commander, we're out of repair stock. We can't seal this breach without salvage or a return to base.";
    actions = [searchSalvageAction(), stabilizeAction(), returnToBaseAction()];
  } else {
    text = `${sevLabel} in ${breach.roomName}. Repair crews need your authorization.`;
    actions = [
      openRoomRepairsAction(breach.roomId, `Open ${breach.roomName} Repairs`),
      stabilizeAction(),
    ];
  }

  let next = pushCrewMessage(dive, {
    speaker: 'chief_engineer',
    department: 'Engineering',
    text,
    severity: breach.severity === 'critical' || outOfHullKits ? 'danger' : 'warning',
    actions,
  });
  next = { ...next, lastActionableBreachSignature: signature };
  return next;
}

export function emitLowOxygenActionableMessageIfNeeded(
  prev: DiveSession,
  dive: DiveSession,
  now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  const prevBand = oxygenBand(prev.oxygenPercent);
  const nextBand = oxygenBand(dive.oxygenPercent);
  const crossed =
    (prevBand === 'ok' && (nextBand === 'warn' || nextBand === 'crit')) ||
    (prevBand === 'warn' && nextBand === 'crit');
  if (!crossed) return dive;

  const lastAt = dive.lastLowOxygenActionableAt ?? 0;
  if (now - lastAt < OXY_ACTIONABLE_COOLDOWN_MS) return dive;

  const reserve = dive.emergencyOxygenChargesRemaining > 0;
  const canBoost = oxygenCanisterCount(dive) > 0 || reserve;

  const actions: CrewAlertAction[] = [];
  if (canBoost) {
    actions.push({
      id: 'use_emergency_o2',
      label: 'Use Emergency Oxygen',
      type: 'use_emergency_oxygen',
      style: 'primary',
    });
  }
  actions.push(stabilizeAction());
  actions.push(returnToBaseAction());

  const text = canBoost
    ? 'Oxygen reserves below safe margin.'
    : 'Emergency oxygen reserve unavailable. Oxygen reserves below safe margin.';

  let next = pushCrewMessage(dive, {
    speaker: 'system',
    department: 'Vessel Systems',
    text,
    severity: nextBand === 'crit' ? 'danger' : 'warning',
    actions,
  });
  next = {
    ...next,
    lastLowOxygenActionableAt: now,
    lastLowOxygenActionableBand: nextBand === 'crit' ? 'crit' : 'warn',
  };
  return next;
}

export function emitCargoFullActionableMessageIfNeeded(
  prev: DiveSession,
  dive: DiveSession,
  submarine: GameState['submarine'],
  now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  const cap = cargoCapacityUnits(submarine);
  const prevU = computeCargoUsed(prev);
  const nextU = computeCargoUsed(dive);
  const nowFull = nextU >= cap;
  const wasFull = prevU >= cap;
  const overflow =
    (dive.cargoLeftBehindNotes?.length ?? 0) > (prev.cargoLeftBehindNotes?.length ?? 0);
  if ((!nowFull || wasFull) && !overflow) return dive;

  const lastAt = dive.lastCargoFullActionableAt ?? 0;
  if (now - lastAt < CARGO_ACTIONABLE_COOLDOWN_MS) return dive;

  const actions: CrewAlertAction[] = [
    {
      id: 'open_cargo',
      label: 'Open Cargo',
      type: 'open_inventory',
      style: 'primary',
    },
    returnToBaseAction(),
  ];

  let next = pushCrewMessage(dive, {
    speaker: 'logistics_officer',
    department: 'Logistics',
    text: 'Cargo bay is at capacity. Additional recoveries may be left behind.',
    severity: 'warning',
    actions,
  });
  next = { ...next, lastCargoFullActionableAt: now };
  return next;
}

export function emitSonarAdvisoriesIfNeeded(
  prev: DiveSession,
  dive: DiveSession,
  mission: Mission | null,
  now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  const contacts = buildSonarContacts({ dive, mission, route: dive.currentRoute });
  let next = dive;

  const hasTerrainHazard = contacts.some(
    (c) => (c.type === 'hazard' || c.type === 'terrain') && c.source === 'ambient',
  );
  if (
    hasTerrainHazard &&
    dive.currentRoute !== 'avoid_hazards' &&
    now - (dive.lastSonarHazardAdvisoryAt ?? 0) >= SONAR_HAZARD_COOLDOWN_MS
  ) {
    next = pushCrewMessage(next, {
      speaker: 'navigation_officer',
      department: 'Navigation',
      text: 'Terrain contact ahead. Coral wall or rock formation detected.',
      severity: 'warning',
      actions: [
        { id: 'open_sonar_hazard', label: 'Open Tac Sonar', type: 'open_sonar', style: 'primary' },
        {
          id: 'avoid',
          label: 'Avoid Hazards',
          type: 'set_command_intent',
          payload: { commandIntent: 'avoid_hazards' },
          style: 'secondary',
        },
        stabilizeAction(),
      ],
    });
    next = { ...next, lastSonarHazardAdvisoryAt: now };
  }

  const hasOffPathSignal = contacts.some((c) => c.type === 'signal' && c.source === 'ambient');
  if (
    hasOffPathSignal &&
    dive.currentRoute !== 'follow_signal' &&
    now - (next.lastSonarSignalAdvisoryAt ?? 0) >= SONAR_SIGNAL_COOLDOWN_MS
  ) {
    next = pushCrewMessage(next, {
      speaker: 'sensor_officer',
      department: 'Sensors',
      text: 'Signal contact off our current path.',
      severity: 'info',
      actions: [
        { id: 'open_sonar_sig', label: 'Open Tac Sonar', type: 'open_sonar', style: 'primary' },
        {
          id: 'follow_signal',
          label: 'Follow Signal',
          type: 'set_command_intent',
          payload: { commandIntent: 'follow_signal' },
          style: 'secondary',
        },
        stabilizeAction(),
      ],
    });
    next = { ...next, lastSonarSignalAdvisoryAt: now };
  }

  return next;
}

export function applyActionableCrewAlertEmissions(
  state: GameState,
  prevDive: DiveSession,
  nextDive: DiveSession,
  mission: Mission | null,
  breach: SeriousBreachInfo | null,
  now: number,
): GameState {
  let dive = nextDive;
  if (breach) {
    dive = emitSeriousBreachActionableMessage(dive, breach);
  }
  dive = emitLowOxygenActionableMessageIfNeeded(prevDive, dive, now);
  dive = emitCargoFullActionableMessageIfNeeded(prevDive, dive, state.submarine, now);
  dive = emitSonarAdvisoriesIfNeeded(prevDive, dive, mission, now);
  return { ...state, dive };
}
