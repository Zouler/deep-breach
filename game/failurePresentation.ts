import type { DiveSession, Mission, MissionOutcome } from '@/types';

export type FailurePresentationType = NonNullable<MissionOutcome['failureType']>;

function inferFailureType(dive: DiveSession): FailurePresentationType {
  // Keep logic simple and future-ready; v1 uses the same overall presentation.
  if (dive.oxygenPercent <= 0) return 'oxygen_depletion';
  if (dive.hullIntegrityPercent <= 0) return 'hull_collapse';
  return 'submarine_lost';
}

export function buildFailurePresentation(args: {
  dive: DiveSession;
  mission: Mission;
  /** True when emergency extraction was involved (survivable). */
  emergencyExtraction: boolean;
  commanderName: string;
}): Pick<
  MissionOutcome,
  | 'catastrophicFailure'
  | 'failureType'
  | 'failureTitle'
  | 'failureSummary'
  | 'commanderStatus'
  | 'vesselStatus'
  | 'crewStatus'
  | 'causeSummary'
  | 'finalDepth'
  | 'finalHull'
  | 'finalOxygen'
> {
  const { dive, commanderName, emergencyExtraction } = args;
  const catastrophicFailure = dive.status === 'failed' && !emergencyExtraction;
  if (!catastrophicFailure) {
    return {
      catastrophicFailure: false,
    };
  }

  const failureType = inferFailureType(dive);
  const depth = Math.round(dive.currentDepthM);
  const hull = Math.round(dive.hullIntegrityPercent);
  const oxy = Math.round(dive.oxygenPercent);

  const causeSummary =
    failureType === 'oxygen_depletion'
      ? 'Oxygen reserves were exhausted before recovery could be completed.'
      : failureType === 'hull_collapse'
        ? 'Hull integrity collapsed under pressure. Contact with DBX-07 was lost.'
        : 'DBX-07 failed to recover from catastrophic structural damage. The vessel was lost beneath operational depth.';

  return {
    catastrophicFailure: true,
    failureType,
    failureTitle: 'DBX-07 Lost',
    failureSummary:
      `DBX-07 “Deep Breach” was lost during the trial. Commander ${commanderName} failed to return from the trial zone.`,
    commanderStatus: `Commander ${commanderName} was declared killed in the line of duty.`,
    vesselStatus: `DBX-07 “Deep Breach” destroyed.`,
    crewStatus: 'Crew status: presumed lost with the vessel.',
    causeSummary,
    finalDepth: depth,
    finalHull: hull,
    finalOxygen: oxy,
  };
}

