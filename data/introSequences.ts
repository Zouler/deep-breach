import type { IntroSceneDefinition } from '@/types/story';

export const ACT1_INTRO_EYEBROW = 'ACT 1 · EXPERIMENTAL TRIALS';

/** Act 1 cinematic intro — copy + art keys; UI is IntroSequence screen. */
export const ACT1_COMMAND_INTRO_SCENES: IntroSceneDefinition[] = [
  {
    id: 'farewell',
    title: 'Family Farewell',
    eyebrow: ACT1_INTRO_EYEBROW,
    imageId: 'familyFarewell',
    narrative:
      'Phillip Roberts left home before dawn.\nThe assignment had already been signed.\nThe cost of command would be understood later.',
    safeZone: 'family_farewell',
  },
  {
    id: 'arrival',
    title: 'Arrival at the Facility',
    eyebrow: ACT1_INTRO_EYEBROW,
    imageId: 'facilityArrival',
    narrative:
      'DBX-07 waited beneath the lights of the experimental dock.\nThe program had consumed prototypes, budgets, and lives.',
    safeZone: 'facility_arrival',
  },
  {
    id: 'crew',
    title: 'Crew Formation',
    eyebrow: ACT1_INTRO_EYEBROW,
    imageId: 'crewFormation',
    narrative:
      'The crew stood ready outside the hull.\nSome had served on previous DBX platforms.\nAll of them were watching the new commander.',
    safeZone: 'crew_formation',
  },
  {
    id: 'boarding',
    title: 'Boarding DBX-07',
    eyebrow: ACT1_INTRO_EYEBROW,
    imageId: 'boardingDbx07',
    narrative:
      'From this point on, DBX-07 would no longer answer only to the program.\nIt would answer to Roberts.',
    safeZone: 'boarding_hatch',
  },
  {
    id: 'command',
    title: 'Command Chair',
    eyebrow: ACT1_INTRO_EYEBROW,
    imageId: 'commandChair',
    narrative:
      "Commander Phillip Roberts assumed command of DBX-07 'Deep Breach'.\nExperimental Trials would begin immediately.",
    safeZone: 'command_bridge',
    panelBackdropOpacity: 0.78,
  },
];
