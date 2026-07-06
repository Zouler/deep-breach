import type { ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';
import type { DepartmentLeadId } from '@/types/departmentBriefings';

/** Maps department lead ids to P1 portrait assets. */
export function portraitForDepartmentLead(
  leadId: DepartmentLeadId,
): ImageSourcePropType | undefined {
  switch (leadId) {
    case 'xo':
      return GAME_ASSETS.portraits.xoNeutral;
    case 'chief_engineer':
      return GAME_ASSETS.portraits.engineerNeutral;
    case 'navigation_officer':
      return GAME_ASSETS.portraits.navigatorNeutral;
    case 'research_lead':
      return GAME_ASSETS.portraits.scientistNeutral;
    default:
      return undefined;
  }
}

/** Maps crew lead speaker ids from story briefings. */
export function portraitForSpeakerId(speakerId: string): ImageSourcePropType | undefined {
  switch (speakerId) {
    case 'xo':
      return GAME_ASSETS.portraits.xoNeutral;
    case 'chief_engineer':
      return GAME_ASSETS.portraits.engineerNeutral;
    case 'navigation_officer':
      return GAME_ASSETS.portraits.navigatorNeutral;
    case 'research_lead':
      return GAME_ASSETS.portraits.scientistNeutral;
    case 'commander':
    case 'roberts':
    case 'program_command':
      return GAME_ASSETS.portraits.robertsNeutral;
    default:
      return undefined;
  }
}

/** Maps hireable crew roster roles. */
export function portraitForCrewRole(role: string): ImageSourcePropType | undefined {
  switch (role) {
    case 'engineer':
      return GAME_ASSETS.portraits.engineerNeutral;
    case 'navigator':
      return GAME_ASSETS.portraits.navigatorNeutral;
    case 'scientist':
      return GAME_ASSETS.portraits.scientistNeutral;
    default:
      return undefined;
  }
}

export function robertsPortrait(): ImageSourcePropType {
  return GAME_ASSETS.portraits.robertsNeutral;
}
