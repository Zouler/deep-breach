import {
  getMissionModifierById,
  isHarderModifier,
  modifierForAttempt,
  MISSION_MODIFIER_ROTATION,
} from '@/game/missionModifiers';

describe('modifierForAttempt', () => {
  it('keeps the very first attempt at standard conditions', () => {
    expect(modifierForAttempt(0)).toBeNull();
  });

  it('cycles deterministically through the rotation', () => {
    const n = MISSION_MODIFIER_ROTATION.length;
    for (let attempt = 0; attempt < n * 3; attempt++) {
      expect(modifierForAttempt(attempt)).toBe(modifierForAttempt(attempt + n));
    }
  });

  it('never returns undefined for any non-negative attempt count', () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      expect(modifierForAttempt(attempt)).not.toBeUndefined();
    }
  });
});

describe('getMissionModifierById', () => {
  it('resolves every id present in the rotation', () => {
    for (const m of MISSION_MODIFIER_ROTATION) {
      if (!m) continue;
      expect(getMissionModifierById(m.id)).toEqual(m);
    }
  });

  it('returns null for unknown or missing ids', () => {
    expect(getMissionModifierById('not_a_real_modifier')).toBeNull();
    expect(getMissionModifierById(null)).toBeNull();
    expect(getMissionModifierById(undefined)).toBeNull();
  });
});

describe('isHarderModifier', () => {
  it('classifies every non-null modifier in the rotation as harder or easier without throwing', () => {
    for (const m of MISSION_MODIFIER_ROTATION) {
      if (!m) continue;
      expect(typeof isHarderModifier(m)).toBe('boolean');
    }
  });
});
