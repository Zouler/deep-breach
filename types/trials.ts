export type TrialStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'failed_retry_available';

export type TrialLastOutcome = 'completed' | 'failed' | 'aborted';

export interface TrialProgress {
  /** Mission id (e.g. `shallow_descent`). */
  trialId: string;
  status: TrialStatus;
  completedAt?: number;
  bestDepthReachedM?: number;
  attempts: number;
  lastOutcome?: TrialLastOutcome;
  /** First-clear bundle for this trial (pressure trial only in v1). */
  rewardsClaimed?: boolean;
}

/** Shown on Mission Result for certification / unlock copy. */
export interface TrialDebriefAttachment {
  certificationLine?: string;
  firstClearRewards?: {
    scrap: number;
    researchData: number;
    hullPatchKits: number;
    pressureSealant: number;
  };
  unlockedTrialName?: string;
}
