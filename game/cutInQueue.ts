import { CUT_INS_BY_ID } from '@/game/cutInRegistry';
import type { GameState } from '@/types';

/** Priority rank for queue ordering (higher first). */
export function cutInPriorityRank(p: 'low' | 'medium' | 'high'): number {
  if (p === 'high') return 2;
  if (p === 'medium') return 1;
  return 0;
}

/** Append a cut-in id if defined, repeat rules allow, and not already pending. */
export function enqueueCutIn(state: GameState, cutInId: string): GameState {
  const def = CUT_INS_BY_ID[cutInId];
  if (!def) return state;
  if (!def.canRepeat && state.seenCutInIds.includes(cutInId)) return state;
  const pending = [...(state.pendingNarrativeCutInIds ?? [])];
  if (pending.includes(cutInId)) return state;
  return {
    ...state,
    pendingNarrativeCutInIds: [...pending, cutInId],
  };
}

/** Remove from pending; mark seen when non-repeating. */
export function applyCutInDismiss(state: GameState, id: string): GameState {
  if (!state.pendingNarrativeCutInIds.includes(id)) return state;
  const pending = state.pendingNarrativeCutInIds.filter((x) => x !== id);
  const def = CUT_INS_BY_ID[id];
  let seenCutInIds = state.seenCutInIds;
  if (def && !def.canRepeat && !seenCutInIds.includes(id)) {
    seenCutInIds = [...seenCutInIds, id];
  }
  return {
    ...state,
    pendingNarrativeCutInIds: pending,
    seenCutInIds,
  };
}

/** Dedupe and sort by cut-in priority (high first). */
export function mergeCutInQueue(existing: string[], incoming: string[]): string[] {
  const merged = [...new Set([...existing, ...incoming])];
  return merged.sort((a, b) => {
    const da = CUT_INS_BY_ID[a];
    const db = CUT_INS_BY_ID[b];
    return cutInPriorityRank(db?.priority ?? 'low') - cutInPriorityRank(da?.priority ?? 'low');
  });
}
