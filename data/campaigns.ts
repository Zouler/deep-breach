import { SUBMARINE_IDENTITY } from '@/data/submarine';
import type { CampaignDef } from '@/types/story';

/** Act / campaign catalog. Only Experimental Trials is active in MVP. */
export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'experimental_trials',
    name: 'Experimental Trials',
    subtitle: 'Prototype command certification',
    description:
      `${SUBMARINE_IDENTITY.displayName}: complete final pressure, recovery, scan, oxygen and command delegation trials for operational certification under the ${SUBMARINE_IDENTITY.programName}.`,
    status: 'active',
  },
  {
    id: 'research_operations',
    name: 'Research Operations',
    subtitle: 'Future campaign',
    description: 'Classified research deployments beyond the trial program.',
    status: 'locked',
  },
  {
    id: 'classified_waters',
    name: 'Classified Waters',
    subtitle: 'Future campaign',
    description: 'Covert operations in contested or restricted waters.',
    status: 'locked',
  },
  {
    id: 'naval_conflict',
    name: 'Naval Conflict',
    subtitle: 'Future campaign',
    description: 'Operational service under wartime tasking.',
    status: 'locked',
  },
  {
    id: 'strategic_submarine',
    name: 'Strategic Submarine',
    subtitle: 'Future campaign',
    description: 'Long-range deterrence and strategic patrol narratives.',
    status: 'locked',
  },
  {
    id: 'global_crisis',
    name: 'Global Crisis',
    subtitle: 'Future campaign',
    description: 'World-scale emergency and fleet-wide response.',
    status: 'locked',
  },
  {
    id: 'extinction_protocol',
    name: 'Extinction Protocol',
    subtitle: 'Future campaign',
    description: 'Final contingency — story reserved.',
    status: 'locked',
  },
];

export function getCampaignById(id: string): CampaignDef | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
