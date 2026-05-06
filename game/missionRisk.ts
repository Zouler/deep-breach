import type { Mission } from '@/types';

import { riskScalar } from '@/game/submarineStats';

/** 0–100 style scalar for UI and offline weighting (not duplicated in UI math). */
export function calculateMissionRisk(mission: Mission): number {
  return Math.round(riskScalar(mission.risk) * 55);
}
