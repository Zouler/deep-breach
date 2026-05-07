import type { Mission } from '@/types';

/** Ordered Experimental Trials (mission ids match `data/missions.ts`). */
export const EXPERIMENTAL_TRIAL_MISSION_IDS = [
  'shallow_descent',
  'wreck_survey',
  'signal_below',
] as const;

export type ExperimentalTrialMissionId = (typeof EXPERIMENTAL_TRIAL_MISSION_IDS)[number];

export const EXPERIMENTAL_TRIAL_SET: Set<string> = new Set(EXPERIMENTAL_TRIAL_MISSION_IDS);

export interface FirstClearRewardBundle {
  scrap: number;
  researchData: number;
  hullPatchKits: number;
  pressureSealant: number;
}

/** First-clear grants per trial (v1: Pressure Trial I only). */
export const FIRST_CLEAR_REWARDS: Partial<Record<ExperimentalTrialMissionId, FirstClearRewardBundle>> = {
  shallow_descent: {
    scrap: 50,
    researchData: 15,
    hullPatchKits: 1,
    pressureSealant: 1,
  },
};

export function previousTrialMissionId(missionId: string): string | null {
  const idx = EXPERIMENTAL_TRIAL_MISSION_IDS.indexOf(missionId as ExperimentalTrialMissionId);
  if (idx <= 0) return null;
  return EXPERIMENTAL_TRIAL_MISSION_IDS[idx - 1] ?? null;
}

export function nextTrialMissionId(missionId: string): string | null {
  const idx = EXPERIMENTAL_TRIAL_MISSION_IDS.indexOf(missionId as ExperimentalTrialMissionId);
  if (idx < 0 || idx >= EXPERIMENTAL_TRIAL_MISSION_IDS.length - 1) return null;
  return EXPERIMENTAL_TRIAL_MISSION_IDS[idx + 1] ?? null;
}

export function unlockRequirementCopy(missionId: string, missions: Mission[]): string | null {
  const prevId = previousTrialMissionId(missionId);
  if (!prevId) return null;
  const m = missions.find((x) => x.id === prevId);
  return `Complete ${m?.name ?? 'the previous trial'} to unlock.`;
}

export function firstClearRewardPreview(): string {
  return 'First-clear rewards: Scrap, Research Data, Hull Patch Kit, Pressure Sealant (Pressure Trial I).';
}
