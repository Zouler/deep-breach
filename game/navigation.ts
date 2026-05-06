import type { DiveRoute } from '@/types';

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

/** Multiplier on depth meters gained per mission clock tick (cumulative depth rate). */
export function depthRateMultiplier(route: DiveRoute): number {
  switch (route) {
    case 'push_deeper':
      return 1.22;
    case 'search_salvage':
      return 0.78;
    case 'follow_signal':
      return 0.9;
    case 'avoid_hazards':
      return 0.82;
    case 'stabilize_systems':
      return 0.62;
    default:
      return 1;
  }
}

/** Multiplies passive oxygen drain (higher = more drain). */
export function oxygenDrainRouteMultiplier(route: DiveRoute): number {
  switch (route) {
    case 'push_deeper':
      return 1.18;
    case 'search_salvage':
      return 1.05;
    case 'follow_signal':
      return 1.02;
    case 'avoid_hazards':
      return 0.92;
    case 'stabilize_systems':
      return 0.68;
    default:
      return 1;
  }
}

/** Multiplies random crack spawn roll chance. */
export function crackSpawnRouteMultiplier(route: DiveRoute): number {
  switch (route) {
    case 'push_deeper':
      return 1.35;
    case 'search_salvage':
      return 1.12;
    case 'follow_signal':
      return 1.05;
    case 'avoid_hazards':
      return 0.62;
    case 'stabilize_systems':
      return 0.55;
    default:
      return 1;
  }
}

/** Multiplies passive external-discovery offer probability. */
export function passiveDiscoveryRouteMultiplier(route: DiveRoute): number {
  switch (route) {
    case 'push_deeper':
      return 1.05;
    case 'search_salvage':
      return 1.35;
    case 'follow_signal':
      return 1.28;
    case 'avoid_hazards':
      return 0.55;
    case 'stabilize_systems':
      return 0.45;
    default:
      return 1;
  }
}

/** Ambient narrative event roll multiplier. */
export function ambientRouteMultiplier(route: DiveRoute): number {
  switch (route) {
    case 'stabilize_systems':
      return 0.7;
    case 'avoid_hazards':
      return 0.85;
    case 'push_deeper':
      return 1.15;
    default:
      return 1;
  }
}

export const ROUTE_OPTIONS: {
  id: DiveRoute;
  label: string;
  blurb: string;
}[] = [
  {
    id: 'push_deeper',
    label: 'Push Deeper',
    blurb: 'Descend faster toward the contract depth. More pressure stress.',
  },
  {
    id: 'search_salvage',
    label: 'Search for Salvage',
    blurb: 'Weave debris lanes. Better salvage odds, slower depth.',
  },
  {
    id: 'follow_signal',
    label: 'Follow Signal',
    blurb: 'Track odd returns — research, artifacts, unknown contacts.',
  },
  {
    id: 'avoid_hazards',
    label: 'Avoid Hazards',
    blurb: 'Wider berth around unstable terrain. Fewer contacts.',
  },
  {
    id: 'stabilize_systems',
    label: 'Stabilize Systems',
    blurb: 'Slow descent, ease leaks and oxygen load.',
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
