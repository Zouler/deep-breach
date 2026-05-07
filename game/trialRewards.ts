import type { BaseStorage, GameState } from '@/types';

import {
  EXPERIMENTAL_TRIAL_SET,
  FIRST_CLEAR_REWARDS,
  type ExperimentalTrialMissionId,
  type FirstClearRewardBundle,
} from '@/data/experimentalTrials';
import { addRepairToBaseStorage, withSyncedLegacyEconomy } from '@/game/baseStorage';

export function getFirstClearBundle(missionId: string): FirstClearRewardBundle | null {
  if (!EXPERIMENTAL_TRIAL_SET.has(missionId)) return null;
  return FIRST_CLEAR_REWARDS[missionId as ExperimentalTrialMissionId] ?? null;
}

export function applyFirstClearRewardsToBase(state: GameState, missionId: string): GameState {
  const bundle = getFirstClearBundle(missionId);
  if (!bundle) return state;
  let bs: BaseStorage = { ...state.baseStorage };
  bs = {
    ...bs,
    scrap: bs.scrap + bundle.scrap,
    researchData: bs.researchData + bundle.researchData,
  };
  bs = addRepairToBaseStorage(bs, 'patch_kit', bundle.hullPatchKits);
  bs = addRepairToBaseStorage(bs, 'pressure_sealant', bundle.pressureSealant);
  return withSyncedLegacyEconomy({ ...state, baseStorage: bs });
}
