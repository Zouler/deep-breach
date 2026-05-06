import type { ImageSourcePropType } from 'react-native';

import introBoardingDbx07 from '@/assets/story/intro/intro-boarding-dbx07.png';
import introCommandChair from '@/assets/story/intro/intro-command-chair.png';
import introCrewFormation from '@/assets/story/intro/intro-crew-formation.png';
import introFacilityArrival from '@/assets/story/intro/intro-facility-arrival.png';
import introFamilyFarewell from '@/assets/story/intro/intro-family-farewell.png';
import splashTitleBg from '@/assets/images/splash-title-bg.png';
import type { IntroStoryAssetId } from '@/types/story';

/**
 * Act 1 intro full-screen panels (Metro static requires).
 * If a key is ever missing at runtime, `getIntroStoryImage` falls back to splash art.
 */
export const INTRO_STORY_ASSETS: Record<IntroStoryAssetId, ImageSourcePropType> = {
  familyFarewell: introFamilyFarewell,
  facilityArrival: introFacilityArrival,
  crewFormation: introCrewFormation,
  boardingDbx07: introBoardingDbx07,
  commandChair: introCommandChair,
};

export function getIntroStoryImage(id: IntroStoryAssetId | undefined | null): ImageSourcePropType {
  if (!id) return splashTitleBg;
  const src = INTRO_STORY_ASSETS[id];
  return src ?? splashTitleBg;
}
