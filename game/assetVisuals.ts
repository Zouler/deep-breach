import type { ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';

/** Repair row / button icon (Emergency Brace uses patch kit as temporary stand-in). */
export function repairTemplateIconSource(templateId: string): ImageSourcePropType {
  switch (templateId) {
    case 'patch_kit':
      return GAME_ASSETS.icons.hullPatchKit;
    case 'pressure_sealant':
      return GAME_ASSETS.icons.pressureSealant;
    case 'oxygen_canister':
      return GAME_ASSETS.icons.oxygenCanister;
    case 'brace_frame':
      return GAME_ASSETS.icons.hullPatchKit;
    default:
      return GAME_ASSETS.icons.scrap;
  }
}
