import { useEffect, useRef, useState } from 'react';

import type { DiveSession } from '@/types';

export type DiveFlashKind = 'none' | 'hull' | 'oxygen' | 'water' | 'crack' | 'event';

function crackCount(d: DiveSession): number {
  return d.rooms.reduce((n, r) => n + r.cracks.length, 0);
}

/**
 * Lightweight UI-only deltas for the active dive (no gameplay side effects).
 */
export function useDiveFeedback(dive: DiveSession | null): DiveFlashKind {
  const [kind, setKind] = useState<DiveFlashKind>('none');
  const prev = useRef<DiveSession | null>(null);

  useEffect(() => {
    if (!dive) {
      prev.current = null;
      return;
    }

    const p = prev.current;
    prev.current = dive;

    if (!p) return;

    let next: DiveFlashKind = 'none';
    if (dive.eventLog.length > p.eventLog.length) {
      next = 'event';
    } else if (crackCount(dive) > crackCount(p)) {
      next = 'crack';
    } else if (dive.hullIntegrityPercent < p.hullIntegrityPercent - 0.35) {
      next = 'hull';
    } else if (dive.oxygenPercent < p.oxygenPercent - 0.35) {
      next = 'oxygen';
    } else if (dive.waterLevelPercent > p.waterLevelPercent + 0.35) {
      next = 'water';
    }

    if (next === 'none') return;

    setKind(next);
    const t = setTimeout(() => setKind('none'), 520);
    return () => clearTimeout(t);
  }, [dive]);

  return kind;
}
