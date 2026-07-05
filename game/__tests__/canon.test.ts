import {
  CANON_ERA_ORDER,
  clampRevealLevelForEra,
  canAdvanceToEra,
  canReveal,
  DEFAULT_CANON_ERA,
  DEFAULT_REVEAL_LEVEL,
  ERA_REVEAL_CAPS,
  getEraRevealCap,
  isEraUnlocked,
  isValidSpineEventForEra,
  REVEAL_LEVEL,
} from '@/game/canon';
import { createInitialGameState } from '@/game/initialGame';
import { reduceGame } from '@/game/gameReducer';

describe('canon helpers', () => {
  it('orders eras and unlock checks', () => {
    expect(isEraUnlocked('dead_beacon', 'experimental_trials')).toBe(true);
    expect(isEraUnlocked('experimental_trials', 'dead_beacon')).toBe(false);
    expect(CANON_ERA_ORDER.indexOf('war')).toBeGreaterThan(CANON_ERA_ORDER.indexOf('dead_beacon'));
  });

  it('caps reveal level per era', () => {
    expect(getEraRevealCap('experimental_trials')).toBe(REVEAL_LEVEL.NONE);
    expect(getEraRevealCap('dead_beacon')).toBe(REVEAL_LEVEL.ANOMALY_CONFIRMED);
    expect(clampRevealLevelForEra('dead_beacon', REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH)).toBe(
      REVEAL_LEVEL.ANOMALY_CONFIRMED,
    );
  });

  it('canReveal respects era cap and current reveal progress', () => {
    expect(canReveal('dead_beacon', REVEAL_LEVEL.ANOMALY_CONFIRMED, REVEAL_LEVEL.IMPOSSIBLE_SIGNAL)).toBe(
      true,
    );
    expect(
      canReveal('dead_beacon', REVEAL_LEVEL.ANOMALY_CONFIRMED, REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH),
    ).toBe(false);
    expect(canReveal('dead_beacon', REVEAL_LEVEL.NONE, REVEAL_LEVEL.IMPOSSIBLE_SIGNAL)).toBe(false);
  });

  it('allows only sequential era advancement', () => {
    expect(canAdvanceToEra('experimental_trials', 'dead_beacon')).toBe(true);
    expect(canAdvanceToEra('experimental_trials', 'war')).toBe(false);
    expect(canAdvanceToEra('dead_beacon', 'experimental_trials')).toBe(false);
  });

  it('validates spine events against current era', () => {
    expect(isValidSpineEventForEra('operation_dead_beacon', 'dead_beacon')).toBe(true);
    expect(isValidSpineEventForEra('intergalactic_war', 'experimental_trials')).toBe(false);
  });

  it('documents era reveal caps for early-game alien gate', () => {
    expect(ERA_REVEAL_CAPS.experimental_trials).toBeLessThan(REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH);
    expect(ERA_REVEAL_CAPS.dead_beacon).toBeLessThan(REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH);
  });
});

describe('canon reducer actions', () => {
  function base() {
    return createInitialGameState();
  }

  it('initializes new game canon defaults', () => {
    const state = base();
    expect(state.canonEra).toBe(DEFAULT_CANON_ERA);
    expect(state.revealLevel).toBe(DEFAULT_REVEAL_LEVEL);
    expect(state.completedSpineEvents).toEqual([]);
  });

  it('cannot skip era forward', () => {
    const next = reduceGame(base(), { type: 'ADVANCE_CANON_ERA', nextEra: 'war' });
    expect(next.canonEra).toBe('experimental_trials');
  });

  it('advances era one step and reclamps reveal level', () => {
    let state = reduceGame(base(), { type: 'ADVANCE_CANON_ERA', nextEra: 'dead_beacon' });
    expect(state.canonEra).toBe('dead_beacon');

    state = reduceGame(state, {
      type: 'SET_REVEAL_LEVEL',
      revealLevel: REVEAL_LEVEL.ANOMALY_CONFIRMED,
    });
    expect(state.revealLevel).toBe(REVEAL_LEVEL.ANOMALY_CONFIRMED);

    state = reduceGame(state, { type: 'ADVANCE_CANON_ERA', nextEra: 'anomaly_growth' });
    expect(state.canonEra).toBe('anomaly_growth');
    expect(state.revealLevel).toBe(REVEAL_LEVEL.ANOMALY_CONFIRMED);
  });

  it('clamps reveal level to era cap on SET_REVEAL_LEVEL', () => {
    let state = reduceGame(base(), { type: 'ADVANCE_CANON_ERA', nextEra: 'dead_beacon' });
    state = reduceGame(state, {
      type: 'SET_REVEAL_LEVEL',
      revealLevel: REVEAL_LEVEL.EXTRATERRESTRIAL_TRUTH,
    });
    expect(state.revealLevel).toBe(REVEAL_LEVEL.ANOMALY_CONFIRMED);
  });

  it('deduplicates completed spine events', () => {
    const first = reduceGame(base(), {
      type: 'COMPLETE_SPINE_EVENT',
      eventId: 'experimental_trials_complete',
    });
    expect(first.completedSpineEvents).toEqual(['experimental_trials_complete']);

    const second = reduceGame(first, {
      type: 'COMPLETE_SPINE_EVENT',
      eventId: 'experimental_trials_complete',
    });
    expect(second.completedSpineEvents).toEqual(['experimental_trials_complete']);
  });

  it('rejects spine events outside current era', () => {
    const next = reduceGame(base(), {
      type: 'COMPLETE_SPINE_EVENT',
      eventId: 'operation_dead_beacon',
    });
    expect(next.completedSpineEvents).toEqual([]);
  });
});
