import type { CrewMember, CrewMessage, DiveRoute, DiveSession } from '@/types';
import type { CrewLeadMessageSpeakerId } from '@/types/crew';

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
    ...(msg.department ? { department: msg.department } : {}),
    ...(msg.actions?.length ? { actions: msg.actions } : {}),
  };
  const next = [...(dive.crewMessages ?? []), entry];
  return {
    ...dive,
    crewMessages: next.slice(-MAX_MESSAGES),
  };
}

function voiceEngineering(crew: CrewMember[]): CrewLeadMessageSpeakerId {
  return assignedCrew(crew).some((c) => c.role === 'engineer') ? 'chief_engineer' : 'system';
}

function voiceNavigation(crew: CrewMember[]): CrewLeadMessageSpeakerId {
  return assignedCrew(crew).some((c) => c.role === 'navigator') ? 'navigation_officer' : 'system';
}

function voiceSensors(crew: CrewMember[]): CrewLeadMessageSpeakerId {
  return assignedCrew(crew).some((c) => c.role === 'scientist') ? 'sensor_officer' : 'system';
}

function voiceLogistics(crew: CrewMember[]): CrewLeadMessageSpeakerId {
  return assignedCrew(crew).length > 0 ? 'logistics_officer' : 'system';
}

export function crewMessageForRouteChange(
  dive: DiveSession,
  crew: CrewMember[],
  route: DiveRoute,
): DiveSession {
  const lines: Record<
    DiveRoute,
    { speaker: CrewLeadMessageSpeakerId; text: string; severity: CrewMessage['severity'] }
  > = {
    push_deeper: {
      speaker: voiceNavigation(crew),
      text: 'Pushing descent rate. Hull margins will narrow.',
      severity: 'warning',
    },
    search_salvage: {
      speaker: voiceLogistics(crew),
      text: 'Slowing descent. Recovery crews are watching for salvage contacts.',
      severity: 'info',
    },
    follow_signal: {
      speaker: voiceSensors(crew),
      text: 'Adjusting course to track the signal source.',
      severity: 'info',
    },
    avoid_hazards: {
      speaker: voiceNavigation(crew),
      text: 'Safer route plotted. We’ll lose time, but reduce exposure.',
      severity: 'info',
    },
    stabilize_systems: {
      speaker: voiceEngineering(crew),
      text: 'Slowing operations. Repair crews can keep systems stable.',
      severity: 'info',
    },
  };
  const line = lines[route];
  return pushCrewMessage(dive, line);
}

export function crewMessageForScan(dive: DiveSession, crew: CrewMember[], found: boolean): DiveSession {
  if (found) {
    return pushCrewMessage(dive, {
      speaker: voiceSensors(crew),
      text: 'Scanner sweep complete. One external contact detected.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: voiceSensors(crew),
    text: 'No contacts on current sweep.',
    severity: 'info',
  });
}

export function crewMessageForEmergencyOxygen(dive: DiveSession, crew: CrewMember[]): DiveSession {
  return pushCrewMessage(dive, {
    speaker: voiceEngineering(crew),
    text: 'Emergency oxygen routed to the stack — reserves bumped.',
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
      speaker: voiceNavigation(crew),
      text: 'Contact dropped — standing by on your current route.',
      severity: 'info',
    });
  }
  if (patch.journal.hazardTriggered) {
    return pushCrewMessage(dive, {
      speaker: voiceEngineering(crew),
      text: 'That recovery attempt stressed the hull — engineering is on it.',
      severity: 'danger',
    });
  }
  return pushCrewMessage(dive, {
    speaker: voiceLogistics(crew),
    text: 'Recovered materials secured in expedition cargo.',
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
      speaker: voiceEngineering(crew),
      text: 'Pressure sealant took hold — leak stabilized for now.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: voiceEngineering(crew),
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

/** After external recovery adds hull repair items to expedition cargo. */
export function crewMessageForRepairSuppliesRecovered(dive: DiveSession, crew: CrewMember[]): DiveSession {
  if (dive.status !== 'active') return dive;
  const speaker = voiceLogistics(crew);
  const useChief = Math.random() < 0.35;
  return pushCrewMessage(dive, {
    speaker: useChief ? voiceEngineering(crew) : speaker,
    text: useChief
      ? 'That kit will keep us alive if the hull opens again — log it to expedition cargo.'
      : 'Recovered emergency repair stock secured in expedition cargo.',
    severity: 'info',
  });
}

export function maybeReactiveCrewMessage(
  dive: DiveSession,
  crew: CrewMember[],
  _now: number,
): DiveSession {
  if (dive.status !== 'active') return dive;
  const o2 = dive.oxygenPercent;
  const hull = dive.hullIntegrityPercent;
  const cracks = dive.rooms.reduce((n, r) => n + r.cracks.length, 0);

  if (o2 < 28) {
    return pushCrewMessage(dive, {
      speaker: voiceEngineering(crew),
      text: 'Oxygen reserves are falling faster than I like — recommend stabilizing operations.',
      severity: 'warning',
    });
  }
  if (hull < 38) {
    return pushCrewMessage(dive, {
      speaker: voiceEngineering(crew),
      text: 'Hull stress is climbing — my crews need time on repairs before we push luck.',
      severity: 'warning',
    });
  }
  if (cracks > 0 && dive.rooms.some((r) => r.cracks.some((c) => c.severity !== 'hairline'))) {
    return pushCrewMessage(dive, {
      speaker: voiceEngineering(crew),
      text: 'Working leaks in the stack — repair crews are moving to the worst compartments.',
      severity: 'warning',
    });
  }
  if (dive.pendingDiscovery) {
    return pushCrewMessage(dive, {
      speaker: voiceSensors(crew),
      text: 'Contact signature is unstable — recommend a dedicated scan before recovery.',
      severity: 'info',
    });
  }
  return pushCrewMessage(dive, {
    speaker: voiceNavigation(crew),
    text: 'Drift nominal — navigation team standing by for your next intent.',
    severity: 'info',
  });
}
