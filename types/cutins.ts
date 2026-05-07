import type { CrewAlertAction } from './crewAlerts';

export type CutInType =
  | 'story'
  | 'crew_alert'
  | 'discovery'
  | 'command'
  | 'system'
  | 'milestone';

export type CutInTone = 'normal' | 'warning' | 'critical' | 'success' | 'mystery';

export type CutInPriority = 'low' | 'medium' | 'high';

/** Dismiss: `button` = Continue/Acknowledge only; `tap` = tap panel dismisses after text is complete. */
export type CutInDismissMode = 'tap' | 'button';

/** Safe navigation targets wired in `NarrativeCutInProvider` (legacy). */
export type CutInNavActionId = 'open_repairs' | 'search_salvage' | 'return_to_base' | 'open_scan';

export interface CutInNavAction {
  id: CutInNavActionId;
  label: string;
}

export interface NarrativeCutIn {
  id: string;
  type: CutInType;
  tone: CutInTone;
  speakerId: string;
  speakerName: string;
  speakerTitle?: string;
  /** Optional department line for HUD-style context. */
  department?: string;
  title?: string;
  text: string;
  canRepeat: boolean;
  priority: CutInPriority;
  dismissMode?: CutInDismissMode;
  /** Future portrait binding. */
  portraitKey?: string;
  expressionKey?: string;
  /** Preferred contextual shortcuts (shown after typing completes). */
  actions?: CrewAlertAction[];
  /** @deprecated Prefer `actions`. */
  extraActions?: CutInNavAction[];
}

export type { CrewAlertAction };
