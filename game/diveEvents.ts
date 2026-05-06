import type { Crack, DiveSession, GameEvent, Mission } from '@/types';

import { createId } from '@/game/ids';
import { riskScalar } from '@/game/submarineStats';

export function randomRoomId(rooms: DiveSession['rooms']): string {
  return rooms[Math.floor(Math.random() * rooms.length)]?.id ?? 'bridge';
}

export type PacedCrackContext = {
  depthProgress: number;
  missionProgress: number;
  inGrace: boolean;
  allowCriticalRandom: boolean;
  /** True when tied to pressure spike / high-risk recovery. */
  forcedSeverity?: Crack['severity'];
};

export function makePacedCrack(roomId: string, ctx: PacedCrackContext): Crack {
  if (ctx.forcedSeverity) {
    const sev = ctx.forcedSeverity;
    const leak = sev === 'critical' ? 0.22 : sev === 'moderate' ? 0.12 : 0.04;
    return { id: createId('crack'), roomId, severity: sev, leakRatePerSecond: leak };
  }

  const roll = Math.random();
  let severity: Crack['severity'] = 'hairline';
  let leak = 0.04;

  if (ctx.inGrace) {
    if (roll < 0.82) {
      severity = 'hairline';
      leak = 0.035 + Math.random() * 0.02;
    } else {
      severity = 'moderate';
      leak = 0.09;
    }
    return { id: createId('crack'), roomId, severity, leakRatePerSecond: leak };
  }

  const depthBias = 0.25 + ctx.depthProgress * 0.55;
  if (roll < 0.55 * (1 - depthBias * 0.35)) {
    severity = 'hairline';
    leak = 0.04 + Math.random() * 0.03;
  } else if (roll < 0.88 - (ctx.allowCriticalRandom ? 0 : 0.12)) {
    severity = 'moderate';
    leak = 0.11 + Math.random() * 0.03;
  } else if (ctx.allowCriticalRandom) {
    severity = 'critical';
    leak = 0.2 + Math.random() * 0.04;
  } else {
    severity = 'moderate';
    leak = 0.13;
  }

  return { id: createId('crack'), roomId, severity, leakRatePerSecond: leak };
}

/** @deprecated use makePacedCrack */
export function makeCrack(roomId: string): Crack {
  return makePacedCrack(roomId, {
    depthProgress: 0.5,
    missionProgress: 0.5,
    inGrace: false,
    allowCriticalRandom: true,
  });
}

export function tryAmbientDiveEvent(
  mission: Mission,
  roomId: string,
  now: number,
  opts: { inGrace: boolean; stressHigh: boolean },
): GameEvent | null {
  const rs = riskScalar(mission.risk);
  const roll = Math.random();

  if (opts.inGrace) {
    if (roll < 0.0018 * rs) {
      return {
        id: createId('evt'),
        type: 'sonar_contact',
        message: 'Sonar contact detected outside the submarine.',
        timestamp: now,
      };
    }
    if (roll < 0.0024 * rs) {
      return {
        id: createId('evt'),
        type: 'bio_signature',
        message: 'Minor biological movement — passive logging only.',
        timestamp: now,
      };
    }
    return null;
  }

  const stressDampen = opts.stressHigh ? 0.35 : 1;
  if (roll < 0.0011 * rs * stressDampen) {
    return {
      id: createId('evt'),
      type: 'pressure_spike',
      message: 'Pressure spike detected — hull stressing.',
      timestamp: now,
      roomId,
    };
  }
  if (roll < 0.0016 * rs * stressDampen) {
    return {
      id: createId('evt'),
      type: 'sonar_contact',
      message: 'Sonar paint — mass sliding along the pressure hull.',
      timestamp: now,
    };
  }
  if (roll < 0.0019 * rs * stressDampen) {
    return {
      id: createId('evt'),
      type: 'system_failure',
      message: 'Compensators hunting — manual check advised.',
      timestamp: now,
      roomId,
    };
  }
  if (roll < 0.00205 * rs * stressDampen) {
    return {
      id: createId('evt'),
      type: 'wreck_sighting',
      message: 'Wreck silhouette on passive sonar — not engaged.',
      timestamp: now,
    };
  }
  return null;
}

/** Legacy helper — prefer tryAmbientDiveEvent with pacing layer. */
export function generateAmbientDiveEvent(
  mission: Mission,
  roomId: string,
  now: number,
): GameEvent | null {
  return tryAmbientDiveEvent(mission, roomId, now, { inGrace: false, stressHigh: false });
}
