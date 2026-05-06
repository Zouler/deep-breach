import type { CrewMember, CrewMessage, DiveRoute, DiveSession } from '@/types';

import { createId } from '@/game/ids';
import { assignedCrew } from '@/game/submarineStats';

const MAX_MESSAGES = 14;

export function pushCrewMessage(
  dive: DiveSession,
  msg: Omit<CrewMessage, 'id' | 'timestamp'> & { timestamp?: number },
): DiveSession {
  const entry: CrewMessage = {
    id: createId('cm'),
    speaker: msg.speaker,
    text: msg.text,
    severity: msg.severity,
    timestamp: msg.timestamp ?? Date.now(),
  };
  const next = [...(dive.crewMessages ?? []), entry];
  return {
    ...dive,
    crewMessages: next.slice(-MAX_MESSAGES),
  };
}

function pickSpeaker(
  crew: CrewMember[],
  role: 'engineer' | 'navigator' | 'scientist',
): CrewMessage['speaker'] {
  const a = assignedCrew(crew).find((c) => c.role === role);
  if (a) {
    if (role === 'engineer') return 'Engineer';
    if (role === 'navigator') return 'Navigator';
    return 'Scientist';
  }
  return 'System';
}

export function crewMessageForRouteChange(
  dive: DiveSession,
  crew: CrewMember[],
  route: DiveRoute,
): DiveSession {
  const lines: Record<DiveRoute, { speaker: CrewMessage['speaker']; text: string; severity: CrewMessage['severity'] }> =
    {
      push_deeper: {
        speaker: pickSpeaker(crew, 'navigator'),
        text: 'Taking a fast descent corridor — expect heavier pressure cycles.',
        severity: 'warning',
      },
      search_salvage: {
        speaker: pickSpeaker(crew, 'navigator'),
        text: 'Plotting a debris weave — slower depth, more contacts likely.',
        severity: 'info',
      },
      follow_signal: {
        speaker: pickSpeaker(crew, 'scientist'),
        text: 'Locking passive trackers on that anomaly — following your signal order.',
        severity: 'info',
      },
      avoid_hazards: {
        speaker: pickSpeaker(crew, 'navigator'),
        text: 'Routing wide around unstable terrain — safer, fewer outside pings.',
        severity: 'info',
      },
      stabilize_systems: {
        speaker: pickSpeaker(crew, 'engineer'),
        text: 'Slowing descent to stabilize stacks — oxygen and leaks should ease.',
        severity: 'info',
      },
    };
  const line = lines[route];
  return pushCrewMessage(dive, line);
}

export function crewMessageForScan(dive: DiveSession, crew: CrewMember[], found: boolean): DiveSession {
  if (found) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'scientist'),
      text: 'Contact resolved on active sweep — awaiting your call, Captain.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: pickSpeaker(crew, 'scientist'),
    text: 'Active sweep clean — no firm contact this pass.',
    severity: 'info',
  });
}

export function crewMessageForEmergencyOxygen(dive: DiveSession, crew: CrewMember[]): DiveSession {
  return pushCrewMessage(dive, {
    speaker: pickSpeaker(crew, 'engineer'),
    text: 'Emergency oxygen bled into the stack — reserves bumped.',
    severity: 'info',
  });
}

export function crewMessageForDiscoveryResolution(
  dive: DiveSession,
  crew: CrewMember[],
  patch: {
    journal: { choice: 'ignored' | 'attempted'; hazardTriggered: boolean };
  },
): DiveSession {
  if (patch.journal.choice === 'ignored') {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'navigator'),
      text: 'Contact ignored — standing by on your current route.',
      severity: 'info',
    });
  }
  if (patch.journal.hazardTriggered) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'engineer'),
      text: 'Bad news, Captain — that recovery attempt stressed the hull.',
      severity: 'danger',
    });
  }
  return pushCrewMessage(dive, {
    speaker: pickSpeaker(crew, 'engineer'),
    text: 'Recovery confirmed — I stowed supplies in expedition cargo.',
    severity: 'info',
  });
}

export function crewMessageForRepair(
  dive: DiveSession,
  crew: CrewMember[],
  ok: boolean,
): DiveSession {
  if (ok) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'engineer'),
      text: 'Patch took — compartment reading cleaner.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: pickSpeaker(crew, 'engineer'),
    text: 'Field patch slipped — pressure won that cycle.',
    severity: 'warning',
  });
}

/** Periodic reactive chatter tied to dive state (throttled by caller). */
export function tickAmbientCrewChatter(
  dive: DiveSession,
  crew: CrewMember[],
  now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  if (now - dive.lastReactiveCrewAt < 26_000) return dive;
  if (Math.random() > 0.38) return { ...dive, lastReactiveCrewAt: now };
  const next = maybeReactiveCrewMessage(dive, crew, now);
  return { ...next, lastReactiveCrewAt: now };
}

export function maybeReactiveCrewMessage(
  dive: DiveSession,
  crew: CrewMember[],
  now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  const o2 = dive.oxygenPercent;
  const hull = dive.hullIntegrityPercent;
  const cracks = dive.rooms.reduce((n, r) => n + r.cracks.length, 0);

  if (o2 < 28) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'engineer'),
      text: 'Oxygen reserves are dropping faster than I like — consider stabilizing.',
      severity: 'warning',
    });
  }
  if (hull < 38) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'engineer'),
      text: 'Hull stress is climbing — recommend repairs before we push luck.',
      severity: 'warning',
    });
  }
  if (cracks > 0 && dive.rooms.some((r) => r.cracks.some((c) => c.severity !== 'hairline'))) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'engineer'),
      text: 'We have working leaks — bilge is responding.',
      severity: 'warning',
    });
  }
  if (dive.pendingDiscovery) {
    return pushCrewMessage(dive, {
      speaker: pickSpeaker(crew, 'scientist'),
      text: 'Outside contact needs a captain’s decision on recovery.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: pickSpeaker(crew, 'navigator'),
    text: 'Drift nominal — standing by on your next navigation order.',
    severity: 'info',
  });
}
