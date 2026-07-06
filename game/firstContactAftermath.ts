import { canAdvanceToEra, REVEAL_LEVEL, type SpineEventId } from '@/game/canon';
import { grantStoryFlag, hasStoryFlag } from '@/game/deadBeaconDecision';
import { applyRobertsUpdate } from '@/game/roberts';
import { withStoryBeat } from '@/game/storyBeats';
import type { GameState } from '@/types';
import type { CommandStance } from '@/game/roberts';

/** P1.4 — analysis step resolved; unlocks anomaly growth preparation. */
export const STORY_FLAG_FIRST_CONTACT_ANALYSIS = 'first_contact_analysis';
/** Preparation flag for Growing Ocean Anomaly stage — not the full spine event. */
export const STORY_FLAG_ANOMALY_MONITORING_PREP = 'anomaly_monitoring_prep';

export type FirstContactAnalysisChoice =
  | 'authorize_research'
  | 'forward_to_command'
  | 'prepare_monitoring';

export const FIRST_CONTACT_ANALYSIS_CHOICES: readonly FirstContactAnalysisChoice[] = [
  'authorize_research',
  'forward_to_command',
  'prepare_monitoring',
] as const;

export interface FirstContactAnalysisOption {
  id: FirstContactAnalysisChoice;
  label: string;
  summary: string;
}

export const FIRST_CONTACT_ANALYSIS_OPTIONS: readonly FirstContactAnalysisOption[] = [
  {
    id: 'authorize_research',
    label: 'Authorize Research analysis',
    summary:
      'Release the restricted dataset to Research for deep correlation work. Command receives a sanitized executive summary only.',
  },
  {
    id: 'forward_to_command',
    label: 'Forward restricted report to Command',
    summary:
      'Transmit the full contact package to DBX Program Command under RESTRICTED classification. Research retains read-only access.',
  },
  {
    id: 'prepare_monitoring',
    label: 'Prepare controlled monitoring protocol',
    summary:
      'Task Sensor and Research to establish passive ocean watch parameters around the DBX-03 sector. Defer formal explanation pending baseline readings.',
  },
] as const;

/** Hard-sci-fi findings from first contact telemetry — contradictory, unexplained. */
export const FIRST_CONTACT_ANALYSIS_FINDINGS: readonly string[] = [
  'Hull strain telemetry disagrees with external pressure models across fourteen sampling windows — correlation coefficient invalid.',
  'Passive sonar logged duplicate DBX-03 authentication headers on bearings 040° and 040° ± 0.3° simultaneously.',
  'Acoustic timestamps show negative latency on three packets — chronometry flagged impossible under known propagation.',
  'Micro-oxidation patterns on Mk I shielding accelerate without identified chemical source; pattern matches prior Dead Beacon exposure.',
  'Command liaison stamped the package RESTRICTED/DBX-07/PHOS — no release schedule published.',
] as const;

const CHOICE_RESOLUTION_COPY: Record<
  FirstContactAnalysisChoice,
  {
    headline: string;
    summary: string;
    stance: CommandStance;
    robertsDelta: { commandReputation?: number; crewTrust?: number; stress?: number; obsession?: number };
  }
> = {
  authorize_research: {
    headline: 'Research analysis authorized — dataset retained aboard',
    summary:
      'Research Lead has primary custody of the contact telemetry. Command received a sanitized executive summary. Passive monitoring parameters are being drafted — the ocean anomaly is logged as active but unexplained.',
    stance: 'cautious',
    robertsDelta: { crewTrust: 2, stress: 1, obsession: 1 },
  },
  forward_to_command: {
    headline: 'Restricted report forwarded — Command review underway',
    summary:
      'DBX Program Command has the full contact package under RESTRICTED/DBX-07/PHOS. Research retains read-only access. Bureaucratic review is scheduled; no operational explanation has been issued.',
    stance: 'procedural',
    robertsDelta: { commandReputation: 2, stress: 2 },
  },
  prepare_monitoring: {
    headline: 'Monitoring protocol prepared — passive watch authorized',
    summary:
      'Sensor and Research are establishing passive watch parameters around the DBX-03 sector. Command accepts controlled monitoring as the prudent next step. The phenomenon is treated as expanding influence — not yet explained.',
    stance: 'cautious',
    robertsDelta: { commandReputation: 1, crewTrust: 1, obsession: 1 },
  },
};

export function isFirstContactAnalysisChoice(value: string): value is FirstContactAnalysisChoice {
  return (FIRST_CONTACT_ANALYSIS_CHOICES as readonly string[]).includes(value);
}

function hasSpineEvent(state: GameState, eventId: SpineEventId): boolean {
  return state.completedSpineEvents.includes(eventId);
}

/** True when first contact is logged but P1.4 analysis has not been resolved. */
export function isFirstContactAnalysisPending(state: GameState): boolean {
  if (hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) return false;
  return hasSpineEvent(state, 'first_anomaly_contact') && hasSpineEvent(state, 'return_to_dbx03_site');
}

export function canResolveFirstContactAnalysis(state: GameState): boolean {
  return isFirstContactAnalysisPending(state);
}

/**
 * Resolve the post-first-contact base analysis step.
 * Grants preparation flags and advances era toward anomaly growth — does NOT mark growing_ocean_anomaly.
 */
export function resolveFirstContactAnalysis(
  state: GameState,
  choice: FirstContactAnalysisChoice,
): GameState {
  if (!canResolveFirstContactAnalysis(state)) return state;

  const copy = CHOICE_RESOLUTION_COPY[choice];
  let next = state;

  next = grantStoryFlag(next, STORY_FLAG_FIRST_CONTACT_ANALYSIS);
  next = grantStoryFlag(next, STORY_FLAG_ANOMALY_MONITORING_PREP);

  if (canAdvanceToEra(next.canonEra, 'anomaly_growth')) {
    next = { ...next, canonEra: 'anomaly_growth' };
  }
  if (next.revealLevel < REVEAL_LEVEL.ANOMALY_GROWTH) {
    next = {
      ...next,
      revealLevel: REVEAL_LEVEL.ANOMALY_GROWTH,
    };
  }

  next = {
    ...next,
    roberts: applyRobertsUpdate(next.roberts, {
      delta: copy.robertsDelta,
      stance: copy.stance,
    }),
  };

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'high',
    title: copy.headline,
    summaryText: copy.summary,
    speakerId: choice === 'authorize_research' ? 'research_lead' : 'xo',
  });

  next = withStoryBeat(next, {
    type: 'xo_command',
    importance: 'medium',
    title: 'Roberts — personal note',
    summaryText:
      'The data does not add up. Command wants a label; Research wants time; the ocean does not care what we call it. I authorized the next step because standing still is not command.',
    speakerId: 'commander',
  });

  return next;
}

/** Status copy for mission-select cards. */
export function firstContactAnalysisActionCopy(state: GameState): string {
  if (hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) return 'Review analysis record';
  if (isFirstContactAnalysisPending(state)) return 'Open command review';
  return 'Locked';
}

export function firstContactAnalysisLockCopy(state: GameState): string {
  if (hasStoryFlag(state, STORY_FLAG_FIRST_CONTACT_ANALYSIS)) {
    return 'First contact analysis complete — monitoring preparation logged.';
  }
  if (isFirstContactAnalysisPending(state)) {
    return 'First contact data requires Command review and analysis authorization.';
  }
  return 'Complete Return to DBX-03 Site before analysis is available.';
}

