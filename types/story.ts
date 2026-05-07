/** Narrative / campaign identifiers (expand in later acts). */
export type CampaignId =
  | 'experimental_trials'
  | 'research_operations'
  | 'classified_waters'
  | 'naval_conflict'
  | 'strategic_submarine'
  | 'global_crisis'
  | 'extinction_protocol';

export type CareerStage = 'experimental_commander';

/** Commander narrative profile (gameplay-agnostic fields). */
export interface CommanderProfile {
  name: string;
  title: string;
  careerStage: CareerStage;
  currentActId: CampaignId;
  /** Reserved for later story beats (no aging UI in MVP). */
  visualAgeStage?: 'early_career' | 'mid_career' | 'veteran';
}

export interface StoryProgress {
  /** Memo screen dismissed (accept or skip path). */
  assignmentBriefingSeen: boolean;
  /** Player chose Accept Mission (enters intro sequence). */
  assignmentBriefingAccepted: boolean;
  /** Player chose Skip Briefing (bypasses intro sequence). */
  assignmentBriefingSkipped: boolean;
  /** Watched intro through final scene. */
  introSequenceCompleted: boolean;
  /** Skipped intro mid-sequence. */
  introSequenceSkipped: boolean;
}

export type CampaignStatus = 'active' | 'locked' | 'completed';

export interface CampaignDef {
  id: CampaignId;
  name: string;
  subtitle: string;
  description: string;
  status: CampaignStatus;
}

/** Keys for Act 1 full-screen intro panels (`constants/storyAssets`). */
export type IntroStoryAssetId =
  | 'familyFarewell'
  | 'facilityArrival'
  | 'crewFormation'
  | 'boardingDbx07'
  | 'commandChair';

/** Hints for safe composition (lower-third copy); reserved for layout tuning. */
export type IntroSceneSafeZoneHint =
  | 'family_farewell'
  | 'facility_arrival'
  | 'crew_formation'
  | 'boarding_hatch'
  | 'command_bridge';

export interface IntroSceneDefinition {
  id: string;
  title: string;
  eyebrow: string;
  imageId: IntroStoryAssetId;
  narrative: string;
  /** Stronger bottom panel for bright scenes (UI default ~0.68). */
  panelBackdropOpacity?: number;
  safeZone?: IntroSceneSafeZoneHint;
}

/** Narrative recap / Captain's Log entries (not raw event logs). */
export type StoryBeatType =
  | 'mission_start'
  | 'mission_complete'
  | 'mission_failed'
  | 'mission_aborted'
  | 'discovery'
  | 'artifact'
  | 'salvage'
  | 'breach'
  | 'repair'
  | 'oxygen'
  | 'xo_command'
  | 'emergency_extraction'
  | 'trial_progress'
  | 'system'
  | 'internal_crew_event';

export type StoryBeatImportance = 'low' | 'medium' | 'high';

export interface StoryBeat {
  id: string;
  timestamp: number;
  missionId?: string;
  /** Dive session `startedAt` when available, for grouping. */
  diveStartedAt?: number;
  type: StoryBeatType;
  importance: StoryBeatImportance;
  title: string;
  summaryText: string;
  /** Canonical crew lead id (e.g. `xo`) when a department speaks. */
  speakerId?: string;
}

/** Session / recap UI persistence (mobile return flow). */
export interface NarrativeRecapState {
  /** Last time the app went to background (wall clock). */
  lastGlobalBackgroundAt: number | null;
  /** Fingerprint of the last dismissed XO briefing (avoid duplicate recap). */
  lastXOBriefingDismissedFingerprint: string | null;
  lastXOBriefingDismissedAt: number | null;
}
