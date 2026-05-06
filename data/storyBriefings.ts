import { SUBMARINE_IDENTITY } from '@/data/submarine';
import type { CommanderProfile } from '@/types/story';

export const DEFAULT_COMMANDER: CommanderProfile = {
  name: SUBMARINE_IDENTITY.commanderName,
  title: 'Commander',
  careerStage: 'experimental_commander',
  currentActId: 'experimental_trials',
  visualAgeStage: 'early_career',
};

export const ASSIGNMENT_BRIEFING_TITLE = 'Assignment Briefing';

const id = SUBMARINE_IDENTITY;

/** Formal memorandum fields (assignment + optional review screen). */
export const ASSIGNMENT_MEMO = {
  headerKicker: 'Experimental Trials · Act 1',
  documentTitle: 'Assignment Order',
  fromLabel: 'FROM',
  fromValue: 'Admiral, DBX Program Command',
  toLabel: 'TO',
  toValue: `Commander ${id.commanderName}`,
  subjectLabel: 'SUBJECT',
  subjectValue: `Assignment to ${id.displayName}`,
  programLabel: 'PROGRAM',
  programValue: id.programName,
  signoff: 'By order of DBX Program Command',
  classification: 'Clearance: Experimental Command Authority',
} as const;

export const ASSIGNMENT_BRIEFING_BODY = `Commander ${id.commanderName},

You have been assigned command of ${id.designation} '${id.callsign}', the latest candidate in the ${id.programName}.

Previous DBX vessels provided valuable data. Some survived. Some did not.

Your objective is to complete the final pressure, recovery, scanner, oxygen and command delegation trials required for operational certification.

Command authority is yours. The crew will follow your orders.`;

/** Compact trial tips for the dive HUD (mission id → lines). */
export const DIVE_TRIAL_TIPS: Record<string, string[]> = {
  shallow_descent: [
    'Pressure Trial active. Monitor hull response as depth increases.',
    'Oxygen and water ingress are under evaluation — use Emergency Oxygen only when necessary.',
    'Repair tools are being evaluated under live pressure conditions.',
  ],
  wreck_survey: [
    'Recovery drill: exercise expedition cargo and staged supply handling.',
    'Scanner calibration authorized. Use Scan Area to detect external contacts.',
    'External contacts may deposit materials for analysis back at base.',
  ],
  signal_below: [
    'Signal calibration trial: unknown contacts and crew response under stress.',
    'Use Scan Area to classify contacts before recovery when possible.',
    'Command Delegation test available once vessel stability is confirmed.',
  ],
};

export function diveTrialTipsForMission(missionId: string): string[] {
  return DIVE_TRIAL_TIPS[missionId] ?? [
    'Experimental trial in progress. Monitor hull, oxygen, and compartment breaches.',
    'Use Scan Area per trial protocol when the sweep is off cooldown.',
  ];
}

/** Short labels for facility screens and trial debrief (keep copy out of components). */
export const NARRATIVE_UI = {
  base: {
    title: 'DBX program · surface test facility',
    subtitle: `${id.displayName} · ${id.className}`,
    storageCardTitle: 'Base Storage (surface)',
    commanderLine: (name: string, title: string) =>
      `${title} ${name} · Act 1: Experimental Trials · ${id.designation}`,
  },
  repairDock: {
    title: 'Repair Dock',
    subtitle: `${id.displayName} · prototype maintenance bay`,
    blurb: `Run repairs, restock supplies, and prepare ${id.designation} for the next trial.`,
  },
  baseStorage: {
    title: 'Base Storage',
    subtitle:
      'Recovered materials and test samples are stored for analysis and refit.',
  },
  missionSelect: {
    title: 'Trial schedule',
    subtitle: `${id.programName} · depth trials and system validation`,
    debriefPending: 'Trial debrief pending — open Trial Report.',
  },
  trialReport: {
    docTitle: 'Trial Report',
    noReport: 'No trial report available.',
    completed: 'Trial completed',
    failed: 'Trial failed',
    aborted: 'Trial aborted',
    vesselLine: id.displayName,
    sections: {
      pressure: 'Pressure performance',
      hull: 'Hull damage',
      materials: 'Recovered materials',
      systemsValidated: 'Systems validated',
      transfer: 'Cargo transferred to Base Storage',
      contacts: 'External contacts',
      log: 'Trial log',
    },
  },
};
