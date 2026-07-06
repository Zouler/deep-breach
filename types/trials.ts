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

/** Shown on Mission Result for operational story recon missions. */
export interface StoryDebriefAttachment {
  headline: string;
  summaryLine: string;
  reconComplete: boolean;
  /** Set after P1.2 data disposition decision is resolved. */
  dataDecisionResolved?: boolean;
  dataDecisionHeadline?: string;
  dataDecisionSummary?: string;
  /** True when recon succeeded but data disposition is still pending. */
  pendingDataDecision?: boolean;
  /** P1.3 — first anomaly contact objectives met on return dive. */
  firstContactComplete?: boolean;
  /** P1.6 — growing ocean passive monitoring objectives met. */
  monitoringComplete?: boolean;
}
