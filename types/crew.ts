export type CrewLeadTone =
  | 'command'
  | 'technical'
  | 'operational'
  | 'scientific'
  | 'logistics'
  | 'system';

export interface CrewLead {
  id: string;
  displayName: string;
  fullTitle: string;
  department: string;
  shortRole: string;
  tone: CrewLeadTone;
  /** Reserved for future cut-in portraits. */
  portraitKey?: string;
}

/** Canonical speaker tokens stored on new `CrewMessage` entries (snake_case). */
export const CREW_LEAD_MESSAGE_SPEAKER_IDS = [
  'xo',
  'chief_engineer',
  'navigation_officer',
  'sensor_officer',
  'research_lead',
  'logistics_officer',
  'program_command',
  'system',
] as const;

export type CrewLeadMessageSpeakerId = (typeof CREW_LEAD_MESSAGE_SPEAKER_IDS)[number];
