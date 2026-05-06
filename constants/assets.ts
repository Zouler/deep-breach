import type { ImageSourcePropType } from 'react-native';

/**
 * Central registry for gameplay visuals (Expo / Metro-friendly static requires).
 * Missing or bad images are handled at render time via SafeIcon (onError).
 */
import baseRepairDockBg from '@/assets/images/base-repair-dock-bg.png';
import diveScreenBg from '@/assets/images/dive-screen-bg.png';
import splashTitleBg from '@/assets/images/splash-title-bg.png';

import iconArtifact from '@/assets/icons/icon-artifact.png';
import iconCrack from '@/assets/icons/icon-crack.png';
import iconHullPatchKit from '@/assets/icons/icon-hull-patch-kit.png';
import iconOxygenCanister from '@/assets/icons/icon-oxygen-canister.png';
import iconPressureSealant from '@/assets/icons/icon-pressure-sealant.png';
import iconResearchData from '@/assets/icons/icon-research-data.png';
import iconScanArea from '@/assets/icons/icon-scan-area.png';
import iconScrap from '@/assets/icons/icon-scrap.png';

import hudAlertFeedStrip from '@/assets/ui/dive-hud/hud-alert-feed-strip.png';
import hudCommandDelegationPanel from '@/assets/ui/dive-hud/hud-command-delegation-panel.png';
import hudCompartmentsPanel from '@/assets/ui/dive-hud/hud-compartments-panel.png';
import hudDiscoveryRoutePanel from '@/assets/ui/dive-hud/hud-discovery-route-panel.png';
import hudEmergencyOxygenPanel from '@/assets/ui/dive-hud/hud-emergency-oxygen-panel.png';
import hudMainStatusPanel from '@/assets/ui/dive-hud/hud-main-status-panel.png';
import hudReturnToBaseButton from '@/assets/ui/dive-hud/hud-return-to-base-button.png';
import hudScanRadarWidget from '@/assets/ui/dive-hud/hud-scan-radar-widget.png';
import hudTacticalActionsPanel from '@/assets/ui/dive-hud/hud-tactical-actions-panel.png';
import hudTopMissionHeader from '@/assets/ui/dive-hud/hud-top-mission-header.png';

export const GAME_ASSETS = {
  splashTitleBg: splashTitleBg as ImageSourcePropType,
  diveScreenBg: diveScreenBg as ImageSourcePropType,
  baseRepairDockBg: baseRepairDockBg as ImageSourcePropType,
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

export const DIVE_HUD_ASSETS = {
  topMissionHeader: hudTopMissionHeader as ImageSourcePropType,
  mainStatusPanel: hudMainStatusPanel as ImageSourcePropType,
  emergencyOxygenPanel: hudEmergencyOxygenPanel as ImageSourcePropType,
  tacticalActionsPanel: hudTacticalActionsPanel as ImageSourcePropType,
  scanRadarWidget: hudScanRadarWidget as ImageSourcePropType,
  discoveryRoutePanel: hudDiscoveryRoutePanel as ImageSourcePropType,
  commandDelegationPanel: hudCommandDelegationPanel as ImageSourcePropType,
  compartmentsPanel: hudCompartmentsPanel as ImageSourcePropType,
  alertFeedStrip: hudAlertFeedStrip as ImageSourcePropType,
  returnToBaseButton: hudReturnToBaseButton as ImageSourcePropType,
} as const;
