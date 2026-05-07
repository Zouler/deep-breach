import type { InternalCrewEvent } from '@/types/internalCrewEvents';

export const INTERNAL_CREW_EVENTS: InternalCrewEvent[] = [
  {
    id: 'food_contamination',
    title: 'Food Contamination',
    category: 'health',
    tone: 'negative',
    speakerId: 'xo',
    speakerName: 'XO',
    department: 'Command',
    description:
      'Several crew members reported stomach illness after mess rotation. The kitchen inventory may have included spoiled ingredients.',
    canRepeat: false,
    minMissionsCompleted: 0,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'medium',
    options: [
      {
        id: 'quarantine',
        label: 'Quarantine affected crew',
        outcomeText:
          'Affected crew were isolated and treated. Readiness drops temporarily, but the situation is contained.',
        storyBeatSummary:
          'XO reported a mess hall contamination issue. Roberts ordered affected crew isolated and treated.',
        effects: { readinessDelta: -5, stressDelta: -2 },
      },
      {
        id: 'reprimand_kitchen',
        label: 'Reprimand kitchen staff',
        outcomeText: 'A formal warning was issued. Discipline improves, but morale takes a hit.',
        storyBeatSummary:
          'After mess reports, Roberts issued a formal warning to galley staff to restore standards.',
        effects: { disciplineDelta: 4, moraleDelta: -4 },
      },
      {
        id: 'xo_handles',
        label: 'Let XO handle it',
        outcomeText: 'The XO handled the matter quietly and kept the crew operational.',
        storyBeatSummary: 'The XO contained a mess hall illness quietly while keeping the boat operational.',
        effects: { stressDelta: -1 },
      },
    ],
  },
  {
    id: 'crew_quarters_fight',
    title: 'Crew Quarters Fight',
    category: 'discipline',
    tone: 'negative',
    speakerId: 'xo',
    speakerName: 'XO',
    department: 'Command',
    description:
      'Two crew members fought in quarters after a tense shift rotation. No serious injuries, but the crew is watching how command responds.',
    canRepeat: false,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'medium',
    options: [
      {
        id: 'formal_reprimand',
        label: 'Formal reprimand',
        outcomeText: 'The reprimand was logged. Discipline improves, morale dips slightly.',
        storyBeatSummary:
          'After a fight in crew quarters, Roberts issued a formal reprimand to restore discipline.',
        effects: { disciplineDelta: 5, moraleDelta: -3 },
      },
      {
        id: 'separate_shifts',
        label: 'Separate them across shifts',
        outcomeText: 'The crew members were reassigned to different rotations. Tension decreases.',
        storyBeatSummary:
          'Roberts reassigned the involved crew to different rotations to break the tension.',
        effects: { stressDelta: -3 },
      },
      {
        id: 'mediation',
        label: 'Hold mediation',
        outcomeText: 'The XO mediated the conflict. Morale improves slightly.',
        storyBeatSummary: 'Roberts had the XO mediate the quarters dispute; the crew steadied.',
        effects: { moraleDelta: 3, disciplineDelta: -1 },
      },
    ],
  },
  {
    id: 'engineering_commendation',
    title: 'Engineering Commendation',
    category: 'department_performance',
    tone: 'positive',
    speakerId: 'chief_engineer',
    speakerName: 'Chief Engineer',
    department: 'Engineering',
    description:
      'Engineering crews completed a systems inspection ahead of schedule and prevented a minor pressure issue from escalating.',
    canRepeat: false,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'low',
    options: [
      {
        id: 'commend_team',
        label: 'Commend the team',
        outcomeText: 'Engineering morale improves. Repair crews are motivated.',
        storyBeatSummary:
          'Roberts commended Engineering after crews prevented a minor pressure issue from escalating.',
        effects: { moraleDelta: 4, repairEfficiencyDelta: 2 },
      },
      {
        id: 'service_record',
        label: 'Log it in service record',
        outcomeText: 'The achievement was recorded formally. Discipline and readiness improve.',
        storyBeatSummary:
          'Roberts logged Engineering’s inspection success in the service record for the department.',
        effects: { disciplineDelta: 2, readinessDelta: 3 },
      },
      {
        id: 'move_on',
        label: 'Move on',
        outcomeText: 'The crew returns to duty without ceremony.',
        storyBeatSummary: 'Engineering’s strong inspection was noted; the crew returned to routine ops.',
        effects: {},
      },
    ],
  },
  {
    id: 'logistics_inventory_mismatch',
    title: 'Logistics Inventory Mismatch',
    category: 'logistics',
    tone: 'neutral',
    speakerId: 'logistics_officer',
    speakerName: 'Logistics Officer',
    department: 'Logistics',
    description:
      'Cargo records do not match physical inventory. The mismatch is small, but it could become a larger issue under pressure.',
    canRepeat: false,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'low',
    options: [
      {
        id: 'full_audit',
        label: 'Order full audit',
        outcomeText: 'The audit corrected the records, but delayed preparations.',
        storyBeatSummary:
          'Roberts ordered a full logistics audit; records were corrected at the cost of some prep time.',
        effects: { disciplineDelta: 3, readinessDelta: -2 },
      },
      {
        id: 'accept_variance',
        label: 'Accept variance',
        outcomeText: 'The mismatch was accepted as operational noise. Morale is unaffected, but discipline suffers.',
        storyBeatSummary:
          'Roberts accepted a small inventory variance as noise; discipline expectations softened slightly.',
        effects: { disciplineDelta: -3 },
      },
      {
        id: 'logistics_resolves',
        label: 'Let Logistics resolve it',
        outcomeText: 'Logistics corrected the mismatch quietly.',
        storyBeatSummary: 'Logistics corrected a minor inventory mismatch without standing down operations.',
        effects: { logisticsEfficiencyDelta: 1 },
      },
    ],
  },
  {
    id: 'research_breakthrough',
    title: 'Research Team Breakthrough',
    category: 'research',
    tone: 'positive',
    speakerId: 'research_lead',
    speakerName: 'Research Lead',
    department: 'Research',
    description:
      'My team found a pattern in the latest signal data. It is not enough for a conclusion, but it changes the way we read future contacts.',
    canRepeat: false,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'medium',
    options: [
      {
        id: 'prioritize_analysis',
        label: 'Prioritize analysis',
        outcomeText: 'Research focus increases. The team is energized.',
        storyBeatSummary:
          'Roberts prioritized Research’s new signal pattern; the team pushed analysis harder.',
        effects: { researchEfficiencyDelta: 3, moraleDelta: 2 },
      },
      {
        id: 'archive',
        label: 'Archive for later',
        outcomeText: 'The data was preserved for future study.',
        storyBeatSummary: 'Research archived promising signal data for follow-on study.',
        effects: {},
      },
      {
        id: 'formal_report',
        label: 'Request formal report',
        outcomeText: 'The Research team prepares a structured report for command review.',
        storyBeatSummary:
          'Roberts requested a formal Research report on the new contact-reading pattern.',
        effects: { disciplineDelta: 1, researchEfficiencyDelta: 1 },
      },
    ],
  },
  {
    id: 'crew_fatigue',
    title: 'Crew Fatigue',
    category: 'fatigue',
    tone: 'negative',
    speakerId: 'xo',
    speakerName: 'XO',
    department: 'Command',
    description:
      'Shift rotations are wearing thin. The crew can continue, but fatigue is increasing the risk of mistakes.',
    canRepeat: false,
    allowedDuringDive: false,
    allowedAtBase: true,
    importance: 'medium',
    options: [
      {
        id: 'rest_rotation',
        label: 'Order rest rotation',
        outcomeText: 'Readiness dips briefly, but stress decreases.',
        storyBeatSummary:
          'Roberts ordered a rest rotation; readiness dipped slightly while the crew recovered.',
        effects: { readinessDelta: -3, stressDelta: -6 },
      },
      {
        id: 'maintain_pace',
        label: 'Maintain pace',
        outcomeText: 'The crew pushes through. Progress continues, but stress rises.',
        storyBeatSummary:
          'Roberts kept the operational pace; the crew pushed through with rising fatigue stress.',
        effects: { stressDelta: 5, disciplineDelta: 1 },
      },
      {
        id: 'delegate_leads',
        label: 'Delegate to department leads',
        outcomeText: 'Department leads adjust schedules locally.',
        storyBeatSummary:
          'Roberts delegated schedule adjustments to department leads to ease fatigue.',
        effects: { stressDelta: -2, readinessDelta: -1 },
      },
    ],
  },
];

export const INTERNAL_CREW_EVENTS_BY_ID: Record<string, InternalCrewEvent> = Object.fromEntries(
  INTERNAL_CREW_EVENTS.map((e) => [e.id, e]),
);
