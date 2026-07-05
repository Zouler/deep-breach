import {
  effectiveNavigationSkill,
  effectiveRepairSkill,
  effectiveResearchSkill,
  hasPendingSpecialization,
  incrementCrewDiveCounts,
  isValidSpecializationChoice,
  navigatorHazardSenseBonus,
  scientistSteadyHandsBonus,
  specializationOptionsForRole,
  SPECIALIZATION_UNLOCK_DIVES,
} from '@/game/crewSpecializations';
import { createInitialGameState } from '@/game/initialGame';
import type { CrewMember } from '@/types';

function engineer(overrides: Partial<CrewMember> = {}): CrewMember {
  const base = createInitialGameState().crew.find((c) => c.role === 'engineer')!;
  return { ...base, hired: true, assignedToDive: true, ...overrides };
}

function navigator(overrides: Partial<CrewMember> = {}): CrewMember {
  const base = createInitialGameState().crew.find((c) => c.role === 'navigator')!;
  return { ...base, hired: true, assignedToDive: true, ...overrides };
}

function scientist(overrides: Partial<CrewMember> = {}): CrewMember {
  const base = createInitialGameState().crew.find((c) => c.role === 'scientist')!;
  return { ...base, hired: true, assignedToDive: true, ...overrides };
}

describe('specializationOptionsForRole', () => {
  it('returns exactly two options per role, matching that role', () => {
    for (const role of ['engineer', 'navigator', 'scientist'] as const) {
      const opts = specializationOptionsForRole(role);
      expect(opts).toHaveLength(2);
      expect(opts.every((o) => o.role === role)).toBe(true);
    }
  });
});

describe('hasPendingSpecialization', () => {
  it('is false below the unlock threshold', () => {
    const m = engineer({ divesCompleted: SPECIALIZATION_UNLOCK_DIVES - 1, specializationId: null });
    expect(hasPendingSpecialization(m)).toBe(false);
  });

  it('is true once the threshold is met with no specialization chosen yet', () => {
    const m = engineer({ divesCompleted: SPECIALIZATION_UNLOCK_DIVES, specializationId: null });
    expect(hasPendingSpecialization(m)).toBe(true);
  });

  it('is false once a specialization has already been chosen', () => {
    const m = engineer({
      divesCompleted: SPECIALIZATION_UNLOCK_DIVES + 5,
      specializationId: 'engineer_rapid_repairs',
    });
    expect(hasPendingSpecialization(m)).toBe(false);
  });

  it('is false for an unhired crew member regardless of dive count', () => {
    const m = engineer({ hired: false, divesCompleted: 99, specializationId: null });
    expect(hasPendingSpecialization(m)).toBe(false);
  });
});

describe('isValidSpecializationChoice', () => {
  it('accepts an option matching the role and rejects a mismatched role', () => {
    expect(isValidSpecializationChoice('engineer', 'engineer_rapid_repairs')).toBe(true);
    expect(isValidSpecializationChoice('navigator', 'engineer_rapid_repairs')).toBe(false);
    expect(isValidSpecializationChoice('scientist', 'navigator_hazard_sense')).toBe(false);
  });
});

describe('effective skill multipliers', () => {
  it('boosts repair skill under Rapid Repairs and leaves it unchanged without a specialization', () => {
    const base = engineer({ specializationId: null });
    const specialized = engineer({ specializationId: 'engineer_rapid_repairs' });
    expect(effectiveRepairSkill(base)).toBe(base.repairSkill);
    expect(effectiveRepairSkill(specialized)).toBeGreaterThan(base.repairSkill);
  });

  it('boosts navigation skill under Efficient Routes', () => {
    const base = navigator({ specializationId: null });
    const specialized = navigator({ specializationId: 'navigator_efficient_routes' });
    expect(effectiveNavigationSkill(specialized)).toBeGreaterThan(effectiveNavigationSkill(base));
  });

  it('boosts research skill under Deep Analysis', () => {
    const base = scientist({ specializationId: null });
    const specialized = scientist({ specializationId: 'scientist_deep_analysis' });
    expect(effectiveResearchSkill(specialized)).toBeGreaterThan(effectiveResearchSkill(base));
  });

  it('does not cross-apply a mismatched specialization multiplier', () => {
    // An engineer somehow holding a navigator id (shouldn't happen via the reducer guard,
    // but the pure helper should still only react to fields present on that specialization).
    const m = engineer({ specializationId: 'navigator_efficient_routes' });
    expect(effectiveRepairSkill(m)).toBe(m.repairSkill);
  });
});

describe('navigatorHazardSenseBonus / scientistSteadyHandsBonus', () => {
  it('is zero with no specialized crew assigned', () => {
    expect(navigatorHazardSenseBonus([navigator({ specializationId: null })])).toBe(0);
    expect(scientistSteadyHandsBonus([scientist({ specializationId: null })])).toBe(0);
  });

  it('is positive once the matching specialization is assigned', () => {
    expect(
      navigatorHazardSenseBonus([navigator({ specializationId: 'navigator_hazard_sense' })]),
    ).toBeGreaterThan(0);
    expect(
      scientistSteadyHandsBonus([scientist({ specializationId: 'scientist_steady_hands' })]),
    ).toBeGreaterThan(0);
  });

  it('ignores unassigned or unhired crew', () => {
    const benched = navigator({ specializationId: 'navigator_hazard_sense', assignedToDive: false });
    expect(navigatorHazardSenseBonus([benched])).toBe(0);
  });
});

describe('incrementCrewDiveCounts', () => {
  it('bumps only hired-and-assigned crew members', () => {
    const crew = [
      engineer({ id: 'a', divesCompleted: 0 }),
      navigator({ id: 'b', divesCompleted: 3, assignedToDive: false }),
      scientist({ id: 'c', divesCompleted: 1, hired: false }),
    ];
    const next = incrementCrewDiveCounts(crew);
    expect(next.find((c) => c.id === 'a')!.divesCompleted).toBe(1);
    expect(next.find((c) => c.id === 'b')!.divesCompleted).toBe(3);
    expect(next.find((c) => c.id === 'c')!.divesCompleted).toBe(1);
  });
});
