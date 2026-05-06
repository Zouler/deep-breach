import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import {
  CREW_LEAD_MESSAGE_SPEAKER_IDS,
  type CrewLeadMessageSpeakerId,
} from '@/types/crew';

const LEGACY_SPEAKER_TO_LEAD: Record<string, CrewLeadMessageSpeakerId> = {
  Engineer: 'chief_engineer',
  Navigator: 'navigation_officer',
  Scientist: 'research_lead',
  System: 'system',
};

function isCrewLeadMessageSpeakerId(s: string): s is CrewLeadMessageSpeakerId {
  return (CREW_LEAD_MESSAGE_SPEAKER_IDS as readonly string[]).includes(s);
}

/** Map persisted or runtime speaker tokens to a canonical lead id. */
export function resolveCrewMessageSpeakerToLeadId(raw: unknown): CrewLeadMessageSpeakerId {
  if (typeof raw !== 'string' || raw.length === 0) return 'system';
  if (isCrewLeadMessageSpeakerId(raw)) return raw;
  return LEGACY_SPEAKER_TO_LEAD[raw] ?? 'system';
}

/** Compact label for HUD alert lines (e.g. "Chief Engineer"). */
export function formatCrewMessageDisplayName(raw: unknown): string {
  const id = resolveCrewMessageSpeakerToLeadId(raw);
  return CREW_LEADS_BY_ID[id]?.displayName ?? CREW_LEADS_BY_ID.system.displayName;
}

/** Richer prefix when space allows ("Chief Engineer · Engineering"). */
export function formatCrewMessageExpandedPrefix(raw: unknown): string {
  const id = resolveCrewMessageSpeakerToLeadId(raw);
  const lead = CREW_LEADS_BY_ID[id] ?? CREW_LEADS_BY_ID.system;
  return `${lead.displayName} · ${lead.department}`;
}
