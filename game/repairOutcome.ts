import type { Crack, CrewMember, RepairItem, Submarine } from '@/types';

import { canRepairWithItem } from '@/game/repairLogic';
import {
  autoSealStrength,
  engineerRepairBonus,
  hullMitigation,
} from '@/game/submarineStats';

export type RepairContext = {
  submarine: Submarine;
  crew: CrewMember[];
};

export type RepairResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

function severityStrain(severity: Crack['severity']): number {
  if (severity === 'critical') return 0.2;
  if (severity === 'moderate') return 0.11;
  return 0.05;
}

export function computeRepairSuccessChance(
  crack: Crack,
  item: RepairItem,
  ctx: RepairContext,
): number {
  const pow = (item.power ?? 2) / 4.8;
  const eng = engineerRepairBonus(ctx.crew);
  const seal = autoSealStrength(ctx.submarine);
  const hull = hullMitigation(ctx.submarine);
  const strain = severityStrain(crack.severity);
  return Math.min(0.93, Math.max(0.16, 0.38 + pow + eng + seal * 0.32 + hull * 0.22 - strain));
}

/** Deterministic gate before a random attempt (single roll lives in the reducer). */
export function validateRepairPreconditions(crack: Crack, item: RepairItem): RepairResult {
  if (item.quantity <= 0) {
    return { ok: false, reason: 'No charges remaining for this kit.' };
  }
  if (!canRepairWithItem(crack, item)) {
    return {
      ok: false,
      reason: 'This repair kit cannot fully engage that fracture class.',
    };
  }
  return { ok: true, message: 'Ready to attempt field repair.' };
}

/**
 * Preview for UI / tooling only. Success is resolved with a single roll in the reducer
 * using {@link computeRepairSuccessChance}.
 */
export function calculateRepairResult(
  crack: Crack,
  item: RepairItem,
  ctx: RepairContext,
): { pre: RepairResult; successChance: number } {
  const pre = validateRepairPreconditions(crack, item);
  const successChance = pre.ok ? computeRepairSuccessChance(crack, item, ctx) : 0;
  return { pre, successChance };
}

export function repairSuccessMessage(crack: Crack): string {
  if (crack.severity === 'critical') {
    return 'Pressure relieved — fracture stepped down to moderate.';
  }
  if (crack.severity === 'moderate') {
    return 'Seal engaged — fracture narrowed to hairline.';
  }
  return 'Hairline sealed — compartment integrity restored.';
}
