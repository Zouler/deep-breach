import { CUT_INS, CUT_INS_BY_ID } from '@/data/cutins';
import type { NarrativeCutIn } from '@/types/cutins';

export { CUT_INS, CUT_INS_BY_ID };

export function getCutInById(id: string): NarrativeCutIn | undefined {
  return CUT_INS_BY_ID[id];
}
