import type { ImageSourcePropType } from 'react-native';

/**
 * Central registry for gameplay visuals (Expo / Metro-friendly static requires).
 * Missing or bad images are handled at render time via SafeIcon (onError).
 *
 * @see docs/visual/phase-b-asset-production-pack.md
 */
import baseRepairDockBg from '@/assets/images/base-repair-dock-bg.png';
import diveScreenBg from '@/assets/images/dive-screen-bg.png';
import splashTitleBg from '@/assets/images/splash-title-bg.png';
import logoDeepBreach from '@/assets/images/logo-deep-breach.png';
import logoDeepBreachIcon from '@/assets/images/logo-deep-breach-icon.png';

import commandHubBackground from '@/assets/images/backgrounds/bg-command-hub.webp';
import briefingRoomBackground from '@/assets/images/backgrounds/bg-briefing-room.webp';
import captainsLogBackground from '@/assets/images/backgrounds/bg-captains-log.webp';
import scanlineNoiseOverlay from '@/assets/images/overlays/overlay-scanline-noise.png';

import bridgeRoomBackground from '@/assets/images/rooms/bg-room-bridge.webp';
import engineRoomBackground from '@/assets/images/rooms/bg-room-engine.webp';
import labRoomBackground from '@/assets/images/rooms/bg-room-lab.webp';
import cargoRoomBackground from '@/assets/images/rooms/bg-room-cargo.webp';

import portraitRobertsNeutral from '@/assets/images/portraits/portrait-roberts-neutral.webp';
import portraitXoNeutral from '@/assets/images/portraits/portrait-xo-neutral.webp';
import portraitEngineerNeutral from '@/assets/images/portraits/portrait-engineer-neutral.webp';
import portraitNavigatorNeutral from '@/assets/images/portraits/portrait-navigator-neutral.webp';
import portraitScientistNeutral from '@/assets/images/portraits/portrait-scientist-neutral.webp';

import stampClassified from '@/assets/stamps/stamp-classified.webp';
import stampCleared from '@/assets/stamps/stamp-cleared.webp';
import stampVesselLost from '@/assets/stamps/stamp-vessel-lost.webp';

import iconArtifact from '@/assets/icons/items-optimized/icon-artifact.png';
import iconCrack from '@/assets/icons/items-optimized/icon-crack.png';
import iconHullPatchKit from '@/assets/icons/items-optimized/icon-hull-patch-kit.png';
import iconOxygenCanister from '@/assets/icons/items-optimized/icon-oxygen-canister.png';
import iconPressureSealant from '@/assets/icons/items-optimized/icon-pressure-sealant.png';
import iconResearchData from '@/assets/icons/items-optimized/icon-research-data.png';
import iconScanArea from '@/assets/icons/items-optimized/icon-scan-area.png';
import iconScrap from '@/assets/icons/items-optimized/icon-scrap.png';

export type CommandIconKey = 'dock' | 'missions' | 'crew' | 'inventory' | 'upgrades' | 'log';

export const GAME_ASSETS = {
  splashTitleBg: splashTitleBg as ImageSourcePropType,
  diveScreenBg: diveScreenBg as ImageSourcePropType,
  baseRepairDockBg: baseRepairDockBg as ImageSourcePropType,
  commandHubBackground: commandHubBackground as ImageSourcePropType,
  briefingRoomBackground: briefingRoomBackground as ImageSourcePropType,
  captainsLogBackground: captainsLogBackground as ImageSourcePropType,
  scanlineNoiseOverlay: scanlineNoiseOverlay as ImageSourcePropType,
  bridgeRoomBackground: bridgeRoomBackground as ImageSourcePropType,
  engineRoomBackground: engineRoomBackground as ImageSourcePropType,
  labRoomBackground: labRoomBackground as ImageSourcePropType,
  cargoRoomBackground: cargoRoomBackground as ImageSourcePropType,
  portraits: {
    robertsNeutral: portraitRobertsNeutral as ImageSourcePropType,
    xoNeutral: portraitXoNeutral as ImageSourcePropType,
    engineerNeutral: portraitEngineerNeutral as ImageSourcePropType,
    navigatorNeutral: portraitNavigatorNeutral as ImageSourcePropType,
    scientistNeutral: portraitScientistNeutral as ImageSourcePropType,
  },
  commandIcons: {
    dock: 'dock',
    missions: 'missions',
    crew: 'crew',
    inventory: 'inventory',
    upgrades: 'upgrades',
    log: 'log',
  } as const satisfies Record<CommandIconKey, CommandIconKey>,
  stamps: {
    classified: stampClassified as ImageSourcePropType,
    cleared: stampCleared as ImageSourcePropType,
    vesselLost: stampVesselLost as ImageSourcePropType,
  },
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
