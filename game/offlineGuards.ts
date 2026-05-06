import type { DiveSession } from '@/types';

const HULL_MIN = 30;
const OXYGEN_MIN = 25;

export type OfflineExplorationReasonCode =
  | 'ok'
  | 'no_active_dive'
  | 'hull_low'
  | 'oxygen_low'
  | 'critical_leak'
  | 'mission_terminal';

export type OfflineExplorationGuard = {
  canEnable: boolean;
  reasonCode: OfflineExplorationReasonCode;
  userMessage: string;
  debugDetails: string;
};

function roomCrackSummary(dive: DiveSession): string {
  const parts = dive.rooms.map((r) => `${r.name}:${r.cracks.length}`);
  return parts.join(', ');
}

export function getOfflineExplorationGuard(dive: DiveSession | null): OfflineExplorationGuard {
  if (!dive) {
    return {
      canEnable: false,
      reasonCode: 'no_active_dive',
      userMessage: 'Start an active dive before enabling offline exploration.',
      debugDetails: 'dive=null',
    };
  }

  const status = dive.status;
  const hull = dive.hullIntegrityPercent;
  const oxy = dive.oxygenPercent;
  const criticalCount = dive.rooms.reduce(
    (n, r) => n + r.cracks.filter((c) => c.severity === 'critical').length,
    0,
  );

  const debugDetails = [
    `status=${status}`,
    `hull=${hull.toFixed(1)}`,
    `oxygen=${oxy.toFixed(1)}`,
    `criticalCracks=${criticalCount}`,
    `rooms=${roomCrackSummary(dive)}`,
  ].join(' · ');

  if (status !== 'active') {
    return {
      canEnable: false,
      reasonCode: 'mission_terminal',
      userMessage: 'This mission is already completed or failed.',
      debugDetails,
    };
  }
  if (hull < HULL_MIN) {
    return {
      canEnable: false,
      reasonCode: 'hull_low',
      userMessage: 'Hull integrity is too low. Repair the submarine above 30%.',
      debugDetails,
    };
  }
  if (oxy < OXYGEN_MIN) {
    return {
      canEnable: false,
      reasonCode: 'oxygen_low',
      userMessage: 'Oxygen is too low. Restore oxygen above 25%.',
      debugDetails,
    };
  }
  if (criticalCount > 0) {
    return {
      canEnable: false,
      reasonCode: 'critical_leak',
      userMessage: 'Repair critical leaks before enabling offline exploration.',
      debugDetails,
    };
  }

  return {
    canEnable: true,
    reasonCode: 'ok',
    userMessage: 'Offline exploration available when stable.',
    debugDetails,
  };
}

export function canEnableOfflineExploration(dive: DiveSession): boolean {
  return getOfflineExplorationGuard(dive).canEnable;
}

/** @deprecated prefer getOfflineExplorationGuard */
export function offlineExplorationBlockMessage(dive: DiveSession | null): string | null {
  const g = getOfflineExplorationGuard(dive);
  return g.canEnable ? null : g.userMessage;
}
