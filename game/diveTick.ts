import type { CrewMember, DiveSession, Mission, RoomStatus, Submarine } from '@/types';

import { tickAmbientCrewChatter } from '@/game/crewMessages';
import { generateExternalDiscovery } from '@/game/discoveries';
import { makePacedCrack, randomRoomId, tryAmbientDiveEvent } from '@/game/diveEvents';
import { createId } from '@/game/ids';
import { getCommandIntentModifiers } from '@/game/navigationIntent';
import { tickNavigationKinematics } from '@/game/navigationVector';
import { computeOxygenDrainPercent } from '@/game/oxygen';
import {
  canOfferDiscovery,
  canSpawnAmbient,
  canSpawnCrack,
  countCriticalCracks,
  criticalRandomAllowed,
  depthProgress,
  hasUnresolvedHighStress,
  inEarlyGracePeriod,
  missionProgress,
  refreshGapAfterAmbient,
  refreshGapAfterCrack,
  refreshGapAfterDiscoveryOffer,
} from '@/game/pacing';
import { syncRoomStatuses } from '@/game/roomSync';
import {
  autoSealStrength,
  crewRepairBonus,
  hullMitigation,
  riskScalar,
} from '@/game/submarineStats';

export interface DiveTickParams {
  dive: DiveSession;
  mission: Mission;
  submarine: Submarine;
  crew: CrewMember[];
  deltaMs: number;
  now: number;
}

export function tickActiveDive(p: DiveTickParams): DiveSession {
  const { dive, mission, submarine, crew, deltaMs, now } = p;
  if (dive.status !== 'active') return dive;

  const dt = deltaMs / 1000;
  const rs = riskScalar(mission.risk);
  const seal = autoSealStrength(submarine);
  const repairBonus = crewRepairBonus(crew);
  const hullMit = hullMitigation(submarine);
  const inGrace = inEarlyGracePeriod(dive, now);
  const route = dive.currentRoute;
  const intent = getCommandIntentModifiers(route);

  let {
    missionElapsedMs,
    currentDepthM,
    oxygenPercent,
    waterLevelPercent,
    hullIntegrityPercent,
    rooms,
    collectedScrap,
    collectedResearch,
    collectedTreasures,
    eventLog,
    lastCrackSpawnAt,
    lastAmbientAt,
    lastDiscoveryOfferAt,
    pendingDiscovery,
    routeTimeMs,
  } = dive;

  missionElapsedMs = Math.min(dive.missionDurationMs, missionElapsedMs + deltaMs);

  const target = dive.targetDepthM;
  const depthBefore = currentDepthM;
  const depthStepRate = (target / dive.missionDurationMs) * intent.depthSpeedMultiplier;
  currentDepthM = Math.min(target, currentDepthM + deltaMs * depthStepRate);
  const depthDeltaM = currentDepthM - depthBefore;

  const routeKey = route;
  routeTimeMs = {
    ...routeTimeMs,
    [routeKey]: (routeTimeMs[routeKey] ?? 0) + deltaMs,
  };

  const totalLeak = rooms.reduce(
    (acc, r) =>
      acc +
      r.cracks.reduce((a, c) => a + Math.max(0, c.leakRatePerSecond - seal * 0.02), 0),
    0,
  );
  waterLevelPercent = Math.min(100, waterLevelPercent + totalLeak * dt * 8 * rs);

  const o2Drain = computeOxygenDrainPercent(deltaMs, {
    mission,
    submarine,
    waterLevelPercent,
    route,
    oxygenIntentMultiplier: intent.oxygenDrainMultiplier,
  });
  oxygenPercent = Math.max(0, oxygenPercent - o2Drain);

  const floodingStress = waterLevelPercent / 100;
  hullIntegrityPercent -=
    (floodingStress * 0.06 + (oxygenPercent < 25 ? 0.04 : 0)) * dt * 60 * rs * (1 - repairBonus * 0.25);

  hullIntegrityPercent -= totalLeak * dt * 0.48 * rs * (1 - hullMit * 0.55);

  const kinematics = tickNavigationKinematics(dive, deltaMs, depthDeltaM, intent);

  let nextDive: DiveSession = {
    ...dive,
    missionElapsedMs,
    currentDepthM,
    oxygenPercent,
    waterLevelPercent,
    hullIntegrityPercent,
    rooms,
    collectedScrap,
    collectedResearch,
    collectedTreasures,
    eventLog,
    lastCrackSpawnAt,
    lastAmbientAt,
    lastDiscoveryOfferAt,
    pendingDiscovery,
    routeTimeMs,
    ...kinematics,
  };

  const stressHigh = hasUnresolvedHighStress(nextDive);
  const dProg = depthProgress(nextDive);
  const mProg = missionProgress(nextDive);

  if (!pendingDiscovery && canSpawnCrack(nextDive, mission, now)) {
    const graceFactor = inGrace ? 0.1 : 1;
    const stressFactor = stressHigh && countCriticalCracks(nextDive) > 0 ? 0.18 : 1;
    const crackChance =
      0.00042 *
      deltaMs *
      rs *
      graceFactor *
      stressFactor *
      intent.crackRiskMultiplier;
    if (Math.random() < crackChance) {
      const rid = randomRoomId(nextDive.rooms);
      const allowCrit = criticalRandomAllowed(nextDive) && !inGrace;
      const crack = makePacedCrack(rid, {
        depthProgress: dProg,
        missionProgress: mProg,
        inGrace,
        allowCriticalRandom: allowCrit,
        crackEscalationMultiplier: intent.crackEscalationMultiplier,
      });
      const nextRooms = nextDive.rooms.map((r) =>
        r.id === rid
          ? {
              ...r,
              cracks: [...r.cracks, crack],
              status: (crack.severity === 'critical' ? 'flooding' : 'damaged') as RoomStatus,
            }
          : r,
      );
      nextDive = {
        ...nextDive,
        rooms: nextRooms,
        eventLog: [
          ...nextDive.eventLog,
          {
            id: createId('evt'),
            type: 'system_failure',
            message: `Structural alert — ${crack.severity} crack in ${rid}.`,
            timestamp: now,
            roomId: rid,
          },
        ],
        lastCrackSpawnAt: now,
      };
      nextDive = refreshGapAfterCrack(nextDive, mission);
    }
  }

  if (!nextDive.pendingDiscovery && canSpawnAmbient(nextDive, mission, now)) {
    const ambientChance =
      0.00055 *
      deltaMs *
      (inGrace ? 0.65 : 1) *
      (stressHigh ? 0.55 : 1) *
      intent.ambientChanceMultiplier *
      intent.hazardChanceMultiplier;
    if (Math.random() < ambientChance) {
      const evt = tryAmbientDiveEvent(mission, randomRoomId(nextDive.rooms), now, {
        inGrace,
        stressHigh,
      });
      if (evt) {
        nextDive = {
          ...nextDive,
          eventLog: [...nextDive.eventLog, evt],
          lastAmbientAt: now,
        };
        nextDive = refreshGapAfterAmbient(nextDive, mission);
      }
    }
  }

  if (!nextDive.pendingDiscovery && canOfferDiscovery(nextDive, mission, now)) {
    const lowMissionBoost = mission.risk === 'low' ? 1.28 : 1;
    const discChance =
      0.001 *
      deltaMs *
      (inGrace ? 0.55 : 1) *
      (1 + rs * 0.1) *
      intent.discoveryChanceMultiplier *
      lowMissionBoost;
    if (Math.random() < discChance) {
      const disc = generateExternalDiscovery(mission, nextDive, submarine, crew, now, {
        provenance: 'passive',
      });
      if (disc) {
        nextDive = {
          ...nextDive,
          pendingDiscovery: disc,
          lastDiscoveryOfferAt: now,
          eventLog: [
            ...nextDive.eventLog,
            {
              id: createId('evt'),
              type: 'external_discovery',
              message: `${disc.title} — decision required.`,
              timestamp: now,
            },
          ],
        };
        nextDive = refreshGapAfterDiscoveryOffer(nextDive, mission);
      }
    }
  }

  nextDive = tickAmbientCrewChatter(nextDive, crew, now);

  const syncedRooms = syncRoomStatuses(nextDive.rooms);
  let hull = Math.max(0, Math.min(100, nextDive.hullIntegrityPercent));

  let status: DiveSession['status'] = dive.status;
  if (hull <= 0) status = 'failed';
  else if (nextDive.currentDepthM >= target * 0.995 || nextDive.missionElapsedMs >= dive.missionDurationMs)
    status = 'success';

  return {
    ...nextDive,
    rooms: syncedRooms,
    hullIntegrityPercent: hull,
    status,
  };
}
