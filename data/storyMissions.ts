import type { CanonEra, RevealLevel, SpineEventId } from '@/game/canon';
import { REVEAL_LEVEL } from '@/game/canon';
import { OPERATION_DEAD_BEACON_RETURN_MISSION_ID } from '@/data/missions';
import { SUBMARINE_IDENTITY } from '@/data/submarine';

export type MissionCategory = 'experimental_trial' | 'operational_assignment' | 'story_spine';

export interface MissionBriefingLine {
  speakerId: string;
  text: string;
}

export interface MissionBriefing {
  kicker: string;
  title: string;
  subtitle: string;
  body: string[];
  /** Department lead lines shown after the main body. */
  leadLines: MissionBriefingLine[];
  classification?: string;
}

export interface MissionUnlockConditions {
  /** All listed spine events must be complete. */
  requiredSpineEvents?: SpineEventId[];
  /** All experimental trials must be certified. */
  requireAllTrialsComplete?: boolean;
  /** Story flag ids that must be present (P1.2 grants deadBeaconData, hull_reinforcement_mk1). */
  requiredFlags?: string[];
}

export interface MissionRewardStub {
  scrap?: number;
  researchData?: number;
  /** Reward flags granted via P1.2 post-recon data decision. */
  flags?: string[];
}

export interface MissionDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: MissionCategory;
  canonEraRequired: CanonEra;
  revealLevelRequired: RevealLevel;
  /** Primary spine event recorded when this assignment is completed. */
  spineEventId?: SpineEventId;
  /** When set, mission is complete when this story flag is present (P1.4 analysis). */
  completionFlag?: string;
  isSpineMission: boolean;
  /** When true, shown as locked placeholder with no dive gameplay. */
  isPlaceholder?: boolean;
  /** When true, assignment launches a dive via `diveMissionId` instead of briefing-only completion. */
  isDiveMission?: boolean;
  /** Mission id in `state.missions` used when launching this story assignment. */
  diveMissionId?: string;
  /** Spine event fired when the recon dive is launched. */
  launchSpineEventId?: SpineEventId;
  description: string;
  briefing: MissionBriefing;
  objectives: string[];
  restrictions: string[];
  successSummary: string;
  failureSummary: string;
  unlockConditions: MissionUnlockConditions;
  rewards: MissionRewardStub;
  nextUnlocks: string[];
}

const id = SUBMARINE_IDENTITY;

export const STORY_MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    id: 'operational_integration',
    title: 'Operational Integration',
    subtitle: 'Navy command authority · DBX-07',
    category: 'operational_assignment',
    canonEraRequired: 'experimental_trials',
    revealLevelRequired: REVEAL_LEVEL.NONE,
    spineEventId: 'operational_integration',
    isSpineMission: true,
    description:
      'Formal integration of Commander Roberts and DBX-07 into Navy operational command following experimental certification.',
    briefing: {
      kicker: 'Operational Assignment · Post-Trials',
      title: 'Operational Integration',
      subtitle: 'DBX Program Command · Navy liaison',
      body: [
        `Commander ${id.commanderName},`,
        '',
        `Experimental certification for ${id.displayName} is complete. DBX Program Command has forwarded your trial record to Navy operational authority.`,
        '',
        `Effective immediately, you are integrated as operational commander of ${id.designation} with the callsign "${id.callsign}". Your command authority extends to crew assignment, expedition planning, and mission execution under Navy tasking.`,
        '',
        'This is not a promotion ceremony. It is a transfer of responsibility from prototype evaluation to operational service.',
        '',
        'Stand by for tasking. Command expects readiness within standard turnaround.',
      ],
      leadLines: [
        {
          speakerId: 'xo',
          text: 'Commander, integration paperwork is filed. We are no longer a trial platform on paper — we are operational assets. I recommend we keep the crew on the same readiness cycle until first tasking arrives.',
        },
      ],
      classification: 'Clearance: Operational Command · DBX Program',
    },
    objectives: [
      'Acknowledge Navy operational integration orders.',
      'Confirm crew readiness for operational tasking.',
    ],
    restrictions: ['Non-dive administrative assignment — no expedition launch required.'],
    successSummary:
      'Commander Roberts and DBX-07 are formally integrated into Navy operational command.',
    failureSummary: 'Integration deferred — remain on trial standby until reauthorized.',
    unlockConditions: {
      requireAllTrialsComplete: true,
      requiredSpineEvents: ['experimental_trials_complete'],
    },
    rewards: {
      scrap: 0,
      researchData: 0,
    },
    nextUnlocks: ['operation_dead_beacon'],
  },
  {
    id: 'operation_dead_beacon',
    title: 'Operation Dead Beacon',
    subtitle: 'DBX-03 distress signal · reconnaissance',
    category: 'story_spine',
    canonEraRequired: 'dead_beacon',
    revealLevelRequired: REVEAL_LEVEL.IMPOSSIBLE_SIGNAL,
    spineEventId: 'operation_dead_beacon',
    launchSpineEventId: 'dead_beacon_recon_started',
    isSpineMission: true,
    isDiveMission: true,
    diveMissionId: 'operation_dead_beacon',
    description:
      'Reconnaissance assignment to investigate an impossible distress signal matching DBX-03 authentication codes near its last known loss zone.',
    briefing: {
      kicker: 'Operational Assignment · Priority Recon',
      title: 'Operation Dead Beacon',
      subtitle: 'Impossible signal · DBX-03 last known sector',
      body: [
        `Commander ${id.commanderName},`,
        '',
        'Naval sensor watch has flagged an authenticated distress transmission matching DBX-03 beacon codes. DBX-03 was declared destroyed following its final trial loss report. No active power source or crew should remain.',
        '',
        `${id.designation} is tasked with limited reconnaissance: confirm signal origin, scan wreckage from safe standoff distance, collect environmental and acoustic readings, and return with data.`,
        '',
        'Initial assessment classifies this as low-risk confirmation of a sensor ghost or archival beacon echo. Maintain procedural caution.',
      ],
      leadLines: [
        {
          speakerId: 'xo',
          text: 'Commander, the authentication headers are clean — that is what makes this wrong. DBX-03 should not be talking to us. I recommend we treat this as recon only until Command clarifies what we are hearing.',
        },
        {
          speakerId: 'research_lead',
          text: 'The signal structure matches archived DBX-03 handshake patterns, but the timing field is inconsistent with any known power budget. I cannot explain it with current models — we need close-range environmental readings before drawing conclusions.',
        },
      ],
      classification: 'Clearance: Operational Recon · DBX Program',
    },
    objectives: [
      'Confirm DBX-03 distress signal source and bearing.',
      'Conduct standoff reconnaissance of the primary contact zone.',
      'Collect environmental and acoustic readings for Research analysis.',
      'Return to base with recon data package.',
    ],
    restrictions: [
      'Reconnaissance only — maintain authorized standoff distance.',
      'No hull recovery or crew extraction authorized at this stage.',
    ],
    successSummary:
      'Reconnaissance data returned. Signal source logged for Command and Research review.',
    failureSummary: 'Recon incomplete — signal origin unconfirmed. Command awaiting follow-up tasking.',
    unlockConditions: {
      requiredSpineEvents: ['operational_integration', 'dbx03_signal_received'],
    },
    rewards: {
      scrap: 80,
      researchData: 40,
      flags: ['deadBeaconData'],
    },
    nextUnlocks: ['operation_dead_beacon_return'],
  },
  {
    id: 'operation_dead_beacon_return',
    title: 'Return to DBX-03 Site',
    subtitle: 'Reinforced hull · first contact verification',
    category: 'story_spine',
    canonEraRequired: 'dead_beacon',
    revealLevelRequired: REVEAL_LEVEL.ANOMALY_CONFIRMED,
    spineEventId: 'return_to_dbx03_site',
    isSpineMission: true,
    isDiveMission: true,
    diveMissionId: OPERATION_DEAD_BEACON_RETURN_MISSION_ID,
    description:
      'Controlled return to the DBX-03 loss zone under Hull Reinforcement Mk I to verify the site, gather readings through interference, and withdraw without recovery.',
    briefing: {
      kicker: 'Operational Assignment · First Contact',
      title: 'Return to DBX-03 Site',
      subtitle: 'Hull Reinforcement Mk I · controlled site verification',
      body: [
        `Commander ${id.commanderName},`,
        '',
        'Hull Reinforcement Mk I is installed. DBX Program Command authorizes a controlled return to the DBX-03 loss zone — not for recovery, but to verify the site and collect readings under reinforced shielding.',
        '',
        'Expect elevated sensor interference as you approach the contact zone. Sonar returns may duplicate, pressure models may disagree with hull strain, and telemetry may arrive corrupted or delayed. Your orders are to reach the contact envelope, perform standoff scans after interference begins, gather what Research can use, and surface.',
        '',
        'Do not attempt DBX-03 recovery. Do not pursue unexplained contacts beyond authorized depth. Withdraw on command judgment if interference exceeds tolerance.',
      ],
      leadLines: [
        {
          speakerId: 'xo',
          text: 'Commander, Engineering confirms Mk I reinforcement is active. We are cleared to verify the site — not to solve it. I recommend we treat every sensor contradiction as real until proven otherwise.',
        },
        {
          speakerId: 'research_lead',
          text: 'The contact zone may produce impossible readings. That is the point of this dive — to document what the ocean is doing to our instruments, not to explain it yet.',
        },
      ],
      classification: 'Clearance: First Contact Verification · DBX Program',
    },
    objectives: [
      'Approach the DBX-03 loss zone under reinforced hull.',
      'Enter the contact interference envelope and perform post-interference scans.',
      'Collect controlled readings for Research analysis.',
      'Surface with verified contact telemetry.',
    ],
    restrictions: [
      'Site verification only — no DBX-03 recovery authorized.',
      'Withdraw if interference exceeds operational tolerance.',
    ],
    successSummary:
      'First anomaly contact logged. Site verification data returned under restricted classification.',
    failureSummary: 'Return incomplete — contact zone requirements not met.',
    unlockConditions: {
      requiredSpineEvents: ['operation_dead_beacon', 'hull_reinforcement_mk1'],
      requiredFlags: ['deadBeaconData', 'hull_reinforcement_mk1'],
    },
    rewards: {
      scrap: 55,
      researchData: 40,
    },
    nextUnlocks: ['first_contact_analysis'],
  },
  {
    id: 'first_contact_analysis',
    title: 'First Contact Analysis',
    subtitle: 'Command review · restricted telemetry',
    category: 'story_spine',
    canonEraRequired: 'dead_beacon',
    revealLevelRequired: REVEAL_LEVEL.ANOMALY_CONFIRMED,
    completionFlag: 'first_contact_analysis',
    isSpineMission: true,
    description:
      'Base-side review of contradictory first-contact telemetry from the DBX-03 loss zone. Command and Research await authorization for the next preparation step.',
    briefing: {
      kicker: 'Command Review · Post-First Contact',
      title: 'First Contact Analysis',
      subtitle: 'DBX Program Command · Research liaison',
      body: [
        `Commander ${id.commanderName},`,
        '',
        'DBX-07 has returned from controlled site verification with a restricted contact dataset. The readings confirm an unexplained phenomenon — not a sensor fault, not a recoverable wreck signature, and not explainable under current models.',
        '',
        'Research has compiled five primary findings from the telemetry. Each contradicts adjacent instruments or known physics. Command has not issued a formal classification beyond RESTRICTED/DBX-07/PHOS.',
        '',
        'Your authorization is required before Research, Command, or Sensor can proceed to the next preparation phase. No further dive is authorized at this stage.',
      ],
      leadLines: [
        {
          speakerId: 'research_lead',
          text: 'Commander, I will not call this an anomaly in the official record until we understand the error budget — but the error budget is what failed. The ocean is doing something our models cannot absorb.',
        },
        {
          speakerId: 'xo',
          text: 'Command is treating this as first contact with an unknown physical effect. They want a disposition decision, not speculation. Recommend we authorize one clear next step and keep the crew off rumor channels.',
        },
      ],
      classification: 'Clearance: RESTRICTED/DBX-07/PHOS · First Contact Review',
    },
    objectives: [
      'Review contradictory first-contact sensor findings.',
      'Authorize Research analysis, Command reporting, or monitoring preparation.',
    ],
    restrictions: [
      'No dive authorized — base-side analysis and disposition only.',
      'Full anomaly explanation not available at this stage.',
    ],
    successSummary:
      'First contact analysis authorized. Passive monitoring preparation logged; Growing Ocean Anomaly tasking pending.',
    failureSummary: 'Analysis deferred — first contact data remains in restricted hold.',
    unlockConditions: {
      requiredSpineEvents: ['first_anomaly_contact', 'return_to_dbx03_site'],
    },
    rewards: {
      scrap: 0,
      researchData: 0,
      flags: ['first_contact_analysis', 'anomaly_monitoring_prep'],
    },
    nextUnlocks: ['growing_ocean_anomaly_prep'],
  },
  {
    id: 'growing_ocean_anomaly_prep',
    title: 'Growing Ocean Anomaly',
    subtitle: 'Passive monitoring · expanding footprint',
    category: 'story_spine',
    canonEraRequired: 'anomaly_growth',
    revealLevelRequired: REVEAL_LEVEL.ANOMALY_GROWTH,
    spineEventId: 'growing_ocean_anomaly',
    isSpineMission: true,
    isDiveMission: true,
    diveMissionId: 'growing_ocean_anomaly',
    description:
      'Controlled passive monitoring dive to confirm whether DBX-03 interval signatures recur outside the loss zone and collect repeatable readings under Command restriction.',
    briefing: {
      kicker: 'Operational Assignment · Passive Monitoring',
      title: 'Growing Ocean Anomaly',
      subtitle: 'Ocean watch · repeatable readings required',
      body: [
        `Commander ${id.commanderName},`,
        '',
        'Following first contact analysis, passive watch has logged DBX-03 authentication intervals on bearings that do not intersect the original loss zone. Command authorizes a controlled monitoring dive — not to explain the phenomenon, but to confirm it is recurring and geographically distributed.',
        '',
        'Descend to the monitoring envelope, perform a baseline scan in the target zone, then continue as signal drift begins. Collect post-drift readings and surface. Salvage is secondary; research telemetry is primary.',
        '',
        'Do not pursue unexplained contacts beyond authorized depth. This is observation under restriction — not contact, not recovery, not explanation.',
      ],
      leadLines: [
        {
          speakerId: 'research_lead',
          text: 'The readings repeat with stable checksums and unstable origins. That is enough for Command to treat this as operational — not enough for us to classify it.',
        },
        {
          speakerId: 'xo',
          text: 'Command wants confirmation the footprint is expanding, not a theory. Recommend baseline scan before drift, one monitoring scan after, then withdraw on judgment.',
        },
      ],
      classification: 'Clearance: Passive Monitoring · DBX Program',
    },
    objectives: [
      'Reach the monitoring envelope at authorized depth.',
      'Perform baseline scan in the target zone before signal drift.',
      'Collect post-drift monitoring readings after anomaly activity begins.',
      'Surface with repeatable telemetry under restricted classification.',
    ],
    restrictions: [
      'Passive monitoring only — no pursuit beyond authorized envelope.',
      'No anomaly explanation or recovery authorized at this stage.',
    ],
    successSummary:
      'Passive monitoring complete. Command confirms readings are no longer isolated to the DBX-03 loss zone.',
    failureSummary: 'Monitoring incomplete — drift-window requirements not met.',
    unlockConditions: {
      requiredSpineEvents: ['first_anomaly_contact', 'return_to_dbx03_site'],
      requiredFlags: ['first_contact_analysis', 'anomaly_monitoring_prep'],
    },
    rewards: {
      scrap: 35,
      researchData: 55,
    },
    nextUnlocks: [],
  },
];

export const STORY_MISSION_IDS = STORY_MISSION_DEFINITIONS.map((m) => m.id);

export const STORY_MISSION_BY_ID: Record<string, MissionDefinition> = STORY_MISSION_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<string, MissionDefinition>,
);

/** Scaffold alias ids → canonical `SpineEventId` values. */
export const SPINE_EVENT_ALIASES: Record<string, SpineEventId> = {
  trials_completed: 'experimental_trials_complete',
  roberts_operationally_integrated: 'operational_integration',
  dbx03_signal_received: 'dbx03_signal_received',
  dead_beacon_recon_started: 'dead_beacon_recon_started',
  dead_beacon_anomaly_contact: 'first_anomaly_contact',
  dead_beacon_abort_reported: 'correct_withdrawal',
  hull_reinforcement_mk1_authorized: 'hull_reinforcement_mk1',
};
