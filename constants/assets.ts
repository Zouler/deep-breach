import type { ImageSourcePropType } from 'react-native';

/**
 * Central registry for gameplay visuals (Expo / Metro-friendly static requires).
 * Missing or bad images are handled at render time via SafeIcon (onError).
 *
 * Note: assets/ui/dive-hud/*.png are Phase B HUD chrome — not bundled here until wired.
 * @see docs/visual/phase-b-deferred.md
 */
import baseRepairDockBg from '@/assets/images/base-repair-dock-bg.png';
import diveScreenBg from '@/assets/images/dive-screen-bg.png';
import splashTitleBg from '@/assets/images/splash-title-bg.png';
import logoDeepBreach from '@/assets/images/logo-deep-breach.png';
import logoDeepBreachIcon from '@/assets/images/logo-deep-breach-icon.png';

import iconArtifact from '@/assets/icons/icon-artifact.png';
import iconCrack from '@/assets/icons/icon-crack.png';
import iconHullPatchKit from '@/assets/icons/icon-hull-patch-kit.png';
import iconOxygenCanister from '@/assets/icons/icon-oxygen-canister.png';
import iconPressureSealant from '@/assets/icons/icon-pressure-sealant.png';
import iconResearchData from '@/assets/icons/icon-research-data.png';
import iconScanArea from '@/assets/icons/icon-scan-area.png';
import iconScrap from '@/assets/icons/icon-scrap.png';

export const GAME_ASSETS = {
  splashTitleBg: splashTitleBg as ImageSourcePropType,
  diveScreenBg: diveScreenBg as ImageSourcePropType,
  baseRepairDockBg: baseRepairDockBg as ImageSourcePropType,
  logoDeepBreach: logoDeepBreach as ImageSourcePropType,
  logoDeepBreachIcon: logoDeepBreachIcon as ImageSourcePropType,
  icons: {
    scrap: iconScrap as ImageSourcePropType,
    researchData: iconResearchData as ImageSourcePropType,
    hullPatchKit: iconHullPatchKit as ImageSourcePropType,
    pressureSealant: iconPressureSealant as ImageSourcePropType,
    oxygenCanister: iconOxygenCanister as ImageSourcePropType,
    artifact: iconArtifact as ImageSourcePropType,
    scanArea: iconScanArea as ImageSourcePropType,
    crack: iconCrack as ImageSourcePropType,
  },
} as const;
