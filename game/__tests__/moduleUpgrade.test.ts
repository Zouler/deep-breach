import { upgradeModuleResearchCost, upgradeModuleScrapCost } from '@/game/moduleUpgrade';

describe('upgradeModuleScrapCost', () => {
  it('increases linearly with level', () => {
    expect(upgradeModuleScrapCost(1)).toBe(57);
    expect(upgradeModuleScrapCost(2)).toBe(79);
    expect(upgradeModuleScrapCost(6)).toBe(167);
  });

  it('is strictly increasing across the leveling range', () => {
    for (let level = 1; level < 6; level++) {
      expect(upgradeModuleScrapCost(level + 1)).toBeGreaterThan(upgradeModuleScrapCost(level));
    }
  });
});

describe('upgradeModuleResearchCost', () => {
  it('is roughly 42% of the scrap cost, floored, with a floor of 6', () => {
    const level = 3;
    const expected = Math.max(6, Math.floor(upgradeModuleScrapCost(level) * 0.42));
    expect(upgradeModuleResearchCost(level)).toBe(expected);
  });

  it('never drops below the minimum of 6', () => {
    expect(upgradeModuleResearchCost(0)).toBeGreaterThanOrEqual(6);
  });
});
