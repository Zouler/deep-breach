import { INTERNAL_CREW_EVENTS, INTERNAL_CREW_EVENTS_BY_ID } from '@/data/internalCrewEvents';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';
import type {
  CrewConditionState,
  InternalCrewEvent,
  InternalCrewEventEffects,
} from '@/types/internalCrewEvents';
import { defaultCrewConditionState } from '@/types/internalCrewEvents';

function clampCore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampMod(n: number): number {
  return Math.max(-25, Math.min(25, Math.round(n)));
}

export function applyCrewConditionEffects(
  cs: CrewConditionState,
  e?: InternalCrewEventEffects,
): CrewConditionState {
  if (!e) return cs;
  return {
    ...cs,
    morale: clampCore(cs.morale + (e.moraleDelta ?? 0)),
    stress: clampCore(cs.stress + (e.stressDelta ?? 0)),
    discipline: clampCore(cs.discipline + (e.disciplineDelta ?? 0)),
    readiness: clampCore(cs.readiness + (e.readinessDelta ?? 0)),
    repairEfficiencyMod: clampMod(cs.repairEfficiencyMod + (e.repairEfficiencyDelta ?? 0)),
    researchEfficiencyMod: clampMod(cs.researchEfficiencyMod + (e.researchEfficiencyDelta ?? 0)),
    logisticsEfficiencyMod: clampMod(cs.logisticsEfficiencyMod + (e.logisticsEfficiencyDelta ?? 0)),
  };
}

function act1Started(state: GameState): boolean {
  return Boolean(state.story.assignmentBriefingAccepted || state.story.introSequenceCompleted);
}

function eligibleEvents(state: GameState): InternalCrewEvent[] {
  const resolved = new Set(state.resolvedInternalCrewEventIds ?? []);
  const completed = state.completedTrialReturnsCount ?? 0;
  const onActiveDive = state.dive?.status === 'active';
  return INTERNAL_CREW_EVENTS.filter((ev) => {
    if (onActiveDive && ev.allowedDuringDive !== true) return false;
    if (!onActiveDive && ev.allowedAtBase === false) return false;
    const minM = ev.minMissionsCompleted ?? 0;
    if (completed < minM) return false;
    if (!ev.canRepeat && resolved.has(ev.id)) return false;
    return true;
  });
}

function pickRandomEvent(state: GameState): InternalCrewEvent | null {
  const pool = eligibleEvents(state);
  if (!pool.length) return null;
  const stress = state.crewState?.stress ?? 20;
  const morale = state.crewState?.morale ?? 70;
  const weights = pool.map((ev) => {
    let w = 1;
    if (ev.tone === 'negative' || ev.tone === 'urgent') {
      w += stress > 52 ? 0.35 : 0;
      w += morale < 48 ? 0.25 : 0;
    }
    if (ev.tone === 'positive') {
      w += morale > 62 ? 0.2 : 0;
      w += stress < 28 ? 0.15 : 0;
    }
    return w;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1] ?? null;
}

/** Call after a completed trial surface return (outcome recorded), before UI. */
export function maybeQueueInternalCrewEvent(state: GameState): GameState {
  if (state.pendingInternalCrewEventId) return state;
  if (!act1Started(state)) return state;
  const completed = state.completedTrialReturnsCount ?? 0;
  if (completed < 2) return state;

  const threshold = state.internalCrewNextEventAtReturns ?? 4;
  const returnsSince = (state.internalCrewReturnsSinceLastEvent ?? 0) + 1;
  let next: GameState = {
    ...state,
    internalCrewReturnsSinceLastEvent: returnsSince,
  };

  if (returnsSince < threshold) return next;

  const stress = next.crewState?.stress ?? 20;
  const morale = next.crewState?.morale ?? 70;
  let chance = 0.48;
  if (stress > 55) chance += 0.07;
  if (morale < 45) chance += 0.07;

  const newThreshold = 3 + Math.floor(Math.random() * 3);

  if (Math.random() > chance) {
    return {
      ...next,
      internalCrewReturnsSinceLastEvent: 0,
      internalCrewNextEventAtReturns: newThreshold,
    };
  }

  const picked = pickRandomEvent(next);
  if (!picked) {
    return {
      ...next,
      internalCrewReturnsSinceLastEvent: 0,
      internalCrewNextEventAtReturns: newThreshold,
    };
  }

  return {
    ...next,
    pendingInternalCrewEventId: picked.id,
    internalCrewReturnsSinceLastEvent: 0,
    internalCrewNextEventAtReturns: newThreshold,
  };
}

export function resolveInternalCrewEventChoice(
  state: GameState,
  eventId: string,
  optionId: string,
): GameState {
  if (state.pendingInternalCrewEventId !== eventId) return state;
  const ev = INTERNAL_CREW_EVENTS_BY_ID[eventId];
  if (!ev) {
    return { ...state, pendingInternalCrewEventId: null };
  }
  const opt = ev.options.find((o) => o.id === optionId);
  if (!opt) return state;

  const crewState = applyCrewConditionEffects(state.crewState ?? defaultCrewConditionState(), opt.effects);
  let resolved = [...(state.resolvedInternalCrewEventIds ?? [])];
  if (!ev.canRepeat && !resolved.includes(eventId)) {
    resolved = [...resolved, eventId];
  }

  let next: GameState = {
    ...state,
    pendingInternalCrewEventId: null,
    crewState,
    resolvedInternalCrewEventIds: resolved,
    lastInternalCrewEventAt: Date.now(),
  };

  next = withStoryBeat(next, {
    type: 'internal_crew_event',
    importance: ev.importance,
    title: ev.title,
    summaryText: opt.storyBeatSummary,
    speakerId: ev.speakerId,
  });

  return next;
}
