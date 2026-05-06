import type { DiveRoute } from '@/types';

import { getCommandIntentModifiers } from '@/game/navigationIntent';

export const DEFAULT_DIVE_ROUTE: DiveRoute = 'push_deeper';

export function emptyRouteTimeMs(): Record<DiveRoute, number> {
  return {
    push_deeper: 0,
    search_salvage: 0,
    follow_signal: 0,
    avoid_hazards: 0,
    stabilize_systems: 0,
  };
}

/** @deprecated prefer getCommandIntentModifiers(route).depthSpeedMultiplier */
export function depthRateMultiplier(route: DiveRoute): number {
  return getCommandIntentModifiers(route).depthSpeedMultiplier;
}

/** @deprecated prefer getCommandIntentModifiers(route).oxygenDrainMultiplier */
export function oxygenDrainRouteMultiplier(route: DiveRoute): number {
  return getCommandIntentModifiers(route).oxygenDrainMultiplier;
}

/** @deprecated prefer getCommandIntentModifiers(route).crackRiskMultiplier */
export function crackSpawnRouteMultiplier(route: DiveRoute): number {
  return getCommandIntentModifiers(route).crackRiskMultiplier;
}

/** @deprecated prefer getCommandIntentModifiers(route).discoveryChanceMultiplier */
export function passiveDiscoveryRouteMultiplier(route: DiveRoute): number {
  return getCommandIntentModifiers(route).discoveryChanceMultiplier;
}

/** @deprecated prefer getCommandIntentModifiers(route).ambientChanceMultiplier */
export function ambientRouteMultiplier(route: DiveRoute): number {
  return getCommandIntentModifiers(route).ambientChanceMultiplier;
}

export const ROUTE_OPTIONS: {
  id: DiveRoute;
  label: string;
  blurb: string;
  /** Short effect summary for intent picker */
  effectLine: string;
}[] = [
  {
    id: 'push_deeper',
    label: 'Push Deeper',
    blurb: 'Order a fast pressure descent — navigation executes on your intent.',
    effectLine: 'Fast descent · higher pressure stress',
  },
  {
    id: 'search_salvage',
    label: 'Search for Salvage',
    blurb: 'Slow the vertical leg and sweep debris lanes for recoveries.',
    effectLine: 'Slower descent · better material contacts',
  },
  {
    id: 'follow_signal',
    label: 'Follow Signal',
    blurb: 'Bias sensors toward anomalies and unknown returns.',
    effectLine: 'Tracks anomalies · higher unknown risk',
  },
  {
    id: 'avoid_hazards',
    label: 'Avoid Hazards',
    blurb: 'Plot a wider, evasive corridor — fewer hazards, slower progress.',
    effectLine: 'Safer route · fewer rewards',
  },
  {
    id: 'stabilize_systems',
    label: 'Stabilize Systems',
    blurb: 'Minimize motion so engineering crews can hold the plant stable.',
    effectLine: 'Slow movement · lower system stress',
  },
];

export function dominantRoute(routeTimeMs: Record<DiveRoute, number>): DiveRoute {
  let best: DiveRoute = DEFAULT_DIVE_ROUTE;
  let max = -1;
  (Object.keys(routeTimeMs) as DiveRoute[]).forEach((k) => {
    const v = routeTimeMs[k] ?? 0;
    if (v > max) {
      max = v;
      best = k;
    }
  });
  return best;
}
