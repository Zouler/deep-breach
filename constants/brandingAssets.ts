import type { ImageSourcePropType } from 'react-native';

import { GAME_ASSETS } from '@/constants/assets';

/** Studio intro + shared branding: `assets/branding/barracuda-games-logo.png` */
import barracudaGamesLogo from '../assets/branding/barracuda-games-logo.png';
import bundledIcon from '../assets/images/icon.png';
import logoDeepBreach from '../assets/images/logo-deep-breach.png';

/**
 * Branding: start screen mark is `logo-deep-breach.png` (RGBA; exterior matte is transparent).
 * App store / launcher icon stays on the default bundled icon unless you change it in app.json.
 */
export const BRANDING_ASSETS = {
  logo: logoDeepBreach as ImageSourcePropType,
  appIcon: bundledIcon as ImageSourcePropType,
  barracudaGamesLogo: barracudaGamesLogo as ImageSourcePropType,
  splashTitleBackground: GAME_ASSETS.splashTitleBg,
} as const;
