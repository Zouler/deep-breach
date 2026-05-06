import type { GameAction } from '@/game/gameReducer';
import { gameAudio } from '@/game/audioManager';
import { threatForHigherIsBetter, type ThreatLevel } from '@/game/threatLevels';
import type { GameState } from '@/types';

function threatRank(t: ThreatLevel): number {
  switch (t) {
    case 'safe':
      return 0;
    case 'warning':
      return 1;
    case 'danger':
      return 2;
    case 'critical':
      return 3;
    default:
      return 0;
  }
}

function worstResourceThreat(dive: NonNullable<GameState['dive']>): ThreatLevel {
  const h = threatForHigherIsBetter(dive.hullIntegrityPercent);
  const o = threatForHigherIsBetter(dive.oxygenPercent);
  return threatRank(h) >= threatRank(o) ? h : o;
}

function totalCracks(dive: GameState['dive']): number {
  if (!dive) return 0;
  return dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
}

function lastDiveEventType(dive: NonNullable<GameState['dive']>): string | undefined {
  const ev = dive.eventLog[dive.eventLog.length - 1];
  return ev?.type;
}

/**
 * Plays SFX for a reducer transition. Call with the same `(prev, action)` the reducer used.
 * Must be cheap and side-effect only (never throws).
 */
export function reactToGameAudio(
  prev: GameState,
  next: GameState,
  action: GameAction,
): void {
  if (action.type === 'HYDRATE') return;

  const prevDive = prev.dive ?? null;
  const nextDive = next.dive ?? null;

  // Resource stress (hull / oxygen), only while dive active
  if (nextDive?.status === 'active' && prevDive?.status === 'active') {
    const wPrev = worstResourceThreat(prevDive);
    const wNext = worstResourceThreat(nextDive);
    const rPrev = threatRank(wPrev);
    const rNext = threatRank(wNext);

    if (rNext >= 3 && rPrev < 3) {
      gameAudio.tryPlayCriticalAlert();
    } else if (rNext >= 1 && rNext < 3 && rPrev === 0) {
      gameAudio.tryPlayWarningAlert();
    }
  }

  if (nextDive?.status === 'active' && totalCracks(nextDive) > totalCracks(prevDive)) {
    gameAudio.playSfx('crackSmall');
  }

  if (
    nextDive?.status === 'active' &&
    !prevDive?.pendingDiscovery &&
    nextDive.pendingDiscovery
  ) {
    gameAudio.playSfx('discoveryFound');
  }

  if (action.type === 'SCAN_AREA' && nextDive?.status === 'active') {
    const progressed =
      !!prevDive &&
      (nextDive.lastAreaScanAt > prevDive.lastAreaScanAt ||
        nextDive.scansPerformed > prevDive.scansPerformed);
    if (progressed) {
      gameAudio.playSfx('scanStart');
      gameAudio.playSfxDelayed('sonarPing', 140, 0.55);
    }
  }

  if (action.type === 'REPAIR_CRACK' && nextDive?.status === 'active') {
    const last = lastDiveEventType(nextDive);
    if (last === 'repair_failed') gameAudio.playSfx('repairFailed');
    else if (last === 'repair_complete') gameAudio.playSfx('repairSuccess');
  }

  if (action.type === 'USE_EMERGENCY_OXYGEN' && nextDive?.status === 'active') {
    const progressed =
      !prevDive ||
      nextDive.oxygenPercent > prevDive.oxygenPercent ||
      (nextDive.oxygenCanisterUsesThisDive ?? 0) > (prevDive.oxygenCanisterUsesThisDive ?? 0) ||
      nextDive.emergencyOxygenUsesThisDive > prevDive.emergencyOxygenUsesThisDive;
    if (progressed) gameAudio.playSfx('oxygenRestore');
  }

  if (action.type === 'COLLECT_LOOT' && nextDive?.status === 'active' && prevDive) {
    const progressed =
      nextDive.supplyLog.length > prevDive.supplyLog.length &&
      lastDiveEventType(nextDive) === 'loot_secured';
    if (progressed) gameAudio.playSfx('pickupReward');
  }

  if (action.type === 'RESOLVE_PENDING_DISCOVERY' && action.choice === 'attempt' && nextDive) {
    gameAudio.playSfx('pickupReward');
  }
}
