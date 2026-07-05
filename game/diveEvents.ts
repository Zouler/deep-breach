import type { Crack, DiveSession, GameEvent, Mission, RiskLevel } from '@/types';

import { createId } from '@/game/ids';
import { canRoomBeTargetedByDiveEvent, getRoomDefinition, type RoomContext } from '@/game/rooms';
import { CRACK_ESCALATION_MS_BY_RISK } from '@/game/pacing';
import { riskScalar } from '@/game/submarineStats';

export function randomRoomId(rooms: DiveSession['rooms'], ctx?: RoomContext): string {
  let pool = rooms;
  if (ctx) {
    pool = rooms.filter((r) => canRoomBeTargetedByDiveEvent(r.id, ctx));
  } else {
    pool = rooms.filter((r) => getRoomDefinition(r.id)?.canTakeDamage !== false);
  }
  if (pool.length === 0) {
    return rooms[0]?.id ?? 'command_center';
  }
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}

export type PacedCrackContext = {
  depthProgress: number;
  missionProgress: number;
  inGrace: boolean;
  allowCriticalRandom: boolean;
  /** True when tied to pressure spike / high-risk recovery. */
  forcedSeverity?: Crack['severity'];
  /** <1 softens severity rolls (stabilize / avoid); >1 worsens. */
  crackEscalationMultiplier?: number;
  /** Contract risk tier and current tick time, used to schedule escalation. */
  risk: RiskLevel;
  now: number;
};

/** Only unaddressed 'moderate' cracks escalate (to 'critical'); hairline and critical do not. */
function escalationDeadline(severity: Crack['severity'], risk: RiskLevel, now: number): number | null {
  if (severity !== 'moderate') return null;
  return now + CRACK_ESCALATION_MS_BY_RISK[risk];
}

function crackWithTimings(
  roomId: string,
  severity: Crack['severity'],
  leak: number,
  ctx: PacedCrackContext,
): Crack {
  return {
    id: createId('crack'),
    roomId,
    severity,
    leakRatePerSecond: leak,
    spawnedAt: ctx.now,
    escalatesAt: escalationDeadline(severity, ctx.risk, ctx.now),
  };
}

export function makePacedCrack(roomId: string, ctx: PacedCrackContext): Crack {
  if (ctx.forcedSeverity) {
    const sev = ctx.forcedSeverity;
    const leak = sev === 'critical' ? 0.22 : sev === 'moderate' ? 0.12 : 0.04;
    return crackWithTimings(roomId, sev, leak, ctx);
  }

  const esc = ctx.crackEscalationMultiplier ?? 1;
  const soften = 0.5 + 0.5 * Math.min(1.4, Math.max(0.35, esc));
  let roll = Math.min(0.999, Math.random() * soften);
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
    return crackWithTimings(roomId, severity, leak, ctx);
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

  return crackWithTimings(roomId, severity, leak, ctx);
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
