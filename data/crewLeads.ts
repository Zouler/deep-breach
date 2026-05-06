import type { CrewLead, CrewLeadMessageSpeakerId } from '@/types/crew';

export const CREW_LEADS: CrewLead[] = [
  {
    id: 'xo',
    displayName: 'XO',
    fullTitle: 'Executive Officer',
    department: 'Command',
    shortRole:
      'Second-in-command. Command delegation, crew readiness, discipline, and continuity when the captain is away.',
    tone: 'command',
    portraitKey: 'xo',
  },
  {
    id: 'chief_engineer',
    displayName: 'Chief Engineer',
    fullTitle: 'Chief Engineer',
    department: 'Engineering',
    shortRole:
      'Leads engineering crews. Hull integrity, pressure leaks, repairs, oxygen systems, engine bay, and prototype maintenance.',
    tone: 'technical',
    portraitKey: 'chief_engineer',
  },
  {
    id: 'navigation_officer',
    displayName: 'Navigation Officer',
    fullTitle: 'Navigation Officer',
    department: 'Navigation',
    shortRole:
      'Leads the navigation team. Depth, route, movement vector, hazards, safe paths, and command intent execution.',
    tone: 'operational',
    portraitKey: 'navigation_officer',
  },
  {
    id: 'sensor_officer',
    displayName: 'Sensor Officer',
    fullTitle: 'Sensor Officer',
    department: 'Sensors',
    shortRole:
      'Leads sonar and scanner operators. Scan area, external contacts, pings, contact detection, tactical readings.',
    tone: 'technical',
    portraitKey: 'sensor_officer',
  },
  {
    id: 'research_lead',
    displayName: 'Research Lead',
    fullTitle: 'Research Lead',
    department: 'Research',
    shortRole:
      'Leads the science team. Samples, artifacts, unknown signals, anomalies, analysis, and DBX trial data.',
    tone: 'scientific',
    portraitKey: 'research_lead',
  },
  {
    id: 'logistics_officer',
    displayName: 'Logistics Officer',
    fullTitle: 'Logistics Officer',
    department: 'Logistics',
    shortRole:
      'Leads cargo and supplies. Inventory, expedition cargo, salvage storage, repair stock, recovered materials, base storage.',
    tone: 'logistics',
    portraitKey: 'logistics_officer',
  },
  {
    id: 'program_command',
    displayName: 'DBX Program Command',
    fullTitle: 'DBX Program Command',
    department: 'External Command',
    shortRole:
      'Official program voice for trial certification, assignment orders, act progression, and formal reports.',
    tone: 'command',
    portraitKey: 'program_command',
  },
  {
    id: 'system',
    displayName: 'DBX-07 System',
    fullTitle: 'DBX-07 System',
    department: 'Vessel Systems',
    shortRole: 'Automated alerts, diagnostics, warnings, sensor confirmations, and technical readouts.',
    tone: 'system',
  },
];

export const CREW_LEADS_BY_ID = CREW_LEADS.reduce(
  (acc, lead) => {
    acc[lead.id as CrewLeadMessageSpeakerId] = lead;
    return acc;
  },
  {} as Record<CrewLeadMessageSpeakerId, CrewLead>,
);
