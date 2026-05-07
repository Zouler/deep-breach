import type { CrewAlertAction } from '@/types/crewAlerts';
import type { CrewLeadMessageSpeakerId } from '@/types/crew';

export type DepartmentLeadId = Extract<
  CrewLeadMessageSpeakerId,
  | 'xo'
  | 'chief_engineer'
  | 'navigation_officer'
  | 'sensor_officer'
  | 'research_lead'
  | 'logistics_officer'
  | 'system'
>;

export type DepartmentStatusTone = 'stable' | 'warning' | 'critical';

export type DepartmentStatus = {
  leadId: DepartmentLeadId;
  tone: DepartmentStatusTone;
  badgeLabel: string;
  shortReport: string;
};

export type DepartmentBriefing = {
  leadId: DepartmentLeadId;
  title: string;
  paragraphs: string[];
  recommendation?: string;
  actions?: CrewAlertAction[];
};

