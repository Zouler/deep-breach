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
