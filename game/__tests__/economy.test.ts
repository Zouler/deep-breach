import { missionCompletionBonusScrap, treasureSalvageValueScrap } from '@/game/economy';
import type { Treasure } from '@/types';

describe('missionCompletionBonusScrap', () => {
  it('scales with risk tier and is strictly increasing', () => {
    const low = missionCompletionBonusScrap('low');
    const medium = missionCompletionBonusScrap('medium');
    const mediumHigh = missionCompletionBonusScrap('medium-high');
    const high = missionCompletionBonusScrap('high');

    expect(low).toBe(25);
    expect(medium).toBe(50);
    expect(mediumHigh).toBe(75);
    expect(high).toBe(100);
    expect(low).toBeLessThan(medium);
    expect(medium).toBeLessThan(mediumHigh);
    expect(mediumHigh).toBeLessThan(high);
  });
});

describe('treasureSalvageValueScrap', () => {
  it('pays more for rare treasures than common ones', () => {
    const common: Treasure = { id: 't1', name: 'Trinket', description: 'A small trinket.', rarity: 'common' };
    const rare: Treasure = { id: 't2', name: 'Relic', description: 'An old relic.', rarity: 'rare' };

    expect(treasureSalvageValueScrap(common)).toBe(25);
    expect(treasureSalvageValueScrap(rare)).toBe(75);
    expect(treasureSalvageValueScrap(rare)).toBeGreaterThan(treasureSalvageValueScrap(common));
  });
});
