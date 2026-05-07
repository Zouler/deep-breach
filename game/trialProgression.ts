import {
  EXPERIMENTAL_TRIAL_MISSION_IDS,
  EXPERIMENTAL_TRIAL_SET,
  nextTrialMissionId,
} from '@/data/experimentalTrials';
import { getFirstClearBundle, applyFirstClearRewardsToBase } from '@/game/trialRewards';
import { enqueueCutIn } from '@/game/cutInQueue';
import { withStoryBeat } from '@/game/storyBeats';
import type { DiveSession, GameState, Mission, MissionOutcome } from '@/types';
import type { TrialDebriefAttachment, TrialProgress } from '@/types/trials';

function findMission(state: GameState, id: string): Mission | undefined {
  return state.missions.find((m) => m.id === id);
}

function defaultStatusForNewEntry(missionId: string, state: GameState): TrialProgress['status'] {
  if (!EXPERIMENTAL_TRIAL_SET.has(missionId)) return 'available';
  const idx = EXPERIMENTAL_TRIAL_MISSION_IDS.indexOf(missionId as (typeof EXPERIMENTAL_TRIAL_MISSION_IDS)[number]);
  if (idx === 0) return 'available';
  const prevId = EXPERIMENTAL_TRIAL_MISSION_IDS[idx - 1]!;
  const prev = state.trialProgressByMissionId?.[prevId];
  if (prev?.status === 'completed') return 'available';
  return 'locked';
}

export function getStoredTrialProgress(state: GameState, missionId: string): TrialProgress {
  const existing = state.trialProgressByMissionId?.[missionId];
  if (existing) return existing;
  return {
    trialId: missionId,
    status: defaultStatusForNewEntry(missionId, state),
    attempts: 0,
  };
}

export function getEffectiveTrialStatus(state: GameState, missionId: string): TrialProgress['status'] {
  if (!EXPERIMENTAL_TRIAL_SET.has(missionId)) return 'available';
  if (state.dive?.status === 'active' && state.dive.missionId === missionId) return 'in_progress';
  return getStoredTrialProgress(state, missionId).status;
}

export function canStartExperimentalTrial(state: GameState, missionId: string): boolean {
  if (!EXPERIMENTAL_TRIAL_SET.has(missionId)) return true;
  return getEffectiveTrialStatus(state, missionId) !== 'locked';
}

export function upsertTrialProgress(state: GameState, progress: TrialProgress): GameState {
  return {
    ...state,
    trialProgressByMissionId: {
      ...(state.trialProgressByMissionId ?? {}),
      [progress.trialId]: progress,
    },
  };
}

/** Call when dispatching START_MISSION for an experimental trial. */
export function onStartExperimentalTrial(state: GameState, missionId: string): GameState {
  if (!EXPERIMENTAL_TRIAL_SET.has(missionId)) return state;
  const tp = getStoredTrialProgress(state, missionId);
  return upsertTrialProgress(state, {
    ...tp,
    trialId: missionId,
    attempts: tp.attempts + 1,
    status: 'in_progress',
  });
}

export function applyExperimentalTrialActiveAbort(state: GameState, dive: DiveSession): GameState {
  if (!EXPERIMENTAL_TRIAL_SET.has(dive.missionId)) return state;
  const tp = getStoredTrialProgress(state, dive.missionId);
  const depth = Math.round(dive.currentDepthM);
  const revertToCompleted = Boolean(tp.completedAt);
  return upsertTrialProgress(state, {
    ...tp,
    trialId: dive.missionId,
    status: revertToCompleted ? 'completed' : 'failed_retry_available',
    lastOutcome: 'aborted',
    bestDepthReachedM: Math.max(tp.bestDepthReachedM ?? 0, depth),
  });
}

function patchOutcomeTrialDebrief(
  state: GameState,
  debrief: TrialDebriefAttachment | null,
): GameState {
  if (!debrief || !state.lastMissionOutcome) return state;
  const o: MissionOutcome = { ...state.lastMissionOutcome, trialDebrief: debrief };
  return { ...state, lastMissionOutcome: o };
}

/**
 * Apply trial progression after a terminal dive outcome is recorded and `lastMissionOutcome` exists.
 */
export function applyExperimentalTrialResolution(
  state: GameState,
  mission: Mission,
  dive: DiveSession,
): GameState {
  if (!EXPERIMENTAL_TRIAL_SET.has(mission.id)) return state;

  const success = dive.status === 'success';
  const trialAborted = Boolean(
    dive.offlineEmergencyExtraction || state.pendingOfflineReport?.emergencyExtraction,
  );
  const failed = dive.status === 'failed';

  let next = state;
  const tp = getStoredTrialProgress(next, mission.id);
  const depth = Math.round(dive.currentDepthM);
  let debrief: TrialDebriefAttachment | null = null;

  if (success) {
    const firstClear = getFirstClearBundle(mission.id);
    const grant = Boolean(firstClear && !tp.rewardsClaimed);
    if (grant) {
      next = applyFirstClearRewardsToBase(next, mission.id);
    }

    const now = Date.now();
    const nextProg: TrialProgress = {
      ...tp,
      trialId: mission.id,
      status: 'completed',
      completedAt: now,
      bestDepthReachedM: Math.max(tp.bestDepthReachedM ?? 0, depth),
      lastOutcome: 'completed',
      rewardsClaimed: grant ? true : tp.rewardsClaimed,
    };
    next = upsertTrialProgress(next, nextProg);

    debrief = {};

    let unlockedTrialName: string | undefined;
    const nextId = nextTrialMissionId(mission.id);
    if (nextId) {
      const beforeUnlock = getStoredTrialProgress(state, nextId);
      const unlockedTp = getStoredTrialProgress(next, nextId);
      const unlockedMission = findMission(next, nextId);
      next = upsertTrialProgress(next, {
        ...unlockedTp,
        trialId: nextId,
        status: unlockedTp.status === 'completed' ? 'completed' : 'available',
      });
      if (unlockedMission && beforeUnlock.status === 'locked') {
        unlockedTrialName = unlockedMission.name;
        next = withStoryBeat(next, {
          type: 'trial_progress',
          importance: 'medium',
          title: 'Trial authorization',
          summaryText: `${unlockedMission.name} is now authorized.`,
          speakerId: 'program_command',
          missionId: nextId,
          diveStartedAt: dive.startedAt,
        });
      }
    }

    if (mission.id === 'shallow_descent') {
      debrief.certificationLine = grant
        ? 'Pressure Trial I complete. DBX-07 remains within operational tolerance.'
        : 'Pressure Trial I complete. DBX-07 remains within operational tolerance. First-clear rewards were issued on your initial certification run.';
    } else {
      debrief.certificationLine = 'DBX Certification progress updated.';
    }

    if (unlockedTrialName) {
      debrief.unlockedTrialName = unlockedTrialName;
    }

    if (grant && firstClear) {
      debrief.firstClearRewards = { ...firstClear };
      if (mission.id === 'shallow_descent') {
        next = withStoryBeat(next, {
          type: 'trial_progress',
          importance: 'high',
          title: 'Pressure Trial I — certification',
          summaryText:
            'DBX-07 completed Pressure Trial I under Commander Roberts. Hull response remained within operational tolerance.',
          speakerId: 'program_command',
          missionId: mission.id,
          diveStartedAt: dive.startedAt,
        });
        next = enqueueCutIn(next, 'first_trial_completed');
      }
    }
  } else if (trialAborted) {
    const revertToCompleted = Boolean(tp.completedAt);
    next = upsertTrialProgress(next, {
      ...tp,
      trialId: mission.id,
      status: revertToCompleted ? 'completed' : 'failed_retry_available',
      lastOutcome: 'aborted',
      bestDepthReachedM: Math.max(tp.bestDepthReachedM ?? 0, depth),
    });
  } else if (failed) {
    const revertToCompleted = Boolean(tp.completedAt);
    next = upsertTrialProgress(next, {
      ...tp,
      trialId: mission.id,
      status: revertToCompleted ? 'completed' : 'failed_retry_available',
      lastOutcome: 'failed',
      bestDepthReachedM: Math.max(tp.bestDepthReachedM ?? 0, depth),
    });
  }

  return patchOutcomeTrialDebrief(next, debrief);
}

export function experimentalTrialsCompletedCount(state: GameState): number {
  return EXPERIMENTAL_TRIAL_MISSION_IDS.filter(
    (id) => state.trialProgressByMissionId?.[id]?.status === 'completed',
  ).length;
}
