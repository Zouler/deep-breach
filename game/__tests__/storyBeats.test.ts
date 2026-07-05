import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import { findNewSeriousBreach } from '@/game/storyBeats';
import type { Crack, DiveSession } from '@/types';

function baseDive(): DiveSession {
  const state = createInitialGameState();
  const mission = state.missions[0]!;
  return createDiveSessionForMission(mission, state.submarine, 0, state);
}

function crack(overrides: Partial<Crack> & Pick<Crack, 'id' | 'roomId' | 'severity'>): Crack {
  return { leakRatePerSecond: 0.1, spawnedAt: 0, escalatesAt: null, ...overrides };
}

describe('findNewSeriousBreach', () => {
  it('detects a brand-new moderate or critical crack', () => {
    const prev = baseDive();
    const roomId = prev.rooms[0]!.id;
    const next: DiveSession = {
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'moderate' })] } : r,
      ),
    };

    const breach = findNewSeriousBreach(prev, next);
    expect(breach).toEqual({ roomId, roomName: prev.rooms[0]!.name, severity: 'moderate', crackId: 'c1' });
  });

  it('ignores a brand-new hairline crack', () => {
    const prev = baseDive();
    const roomId = prev.rooms[0]!.id;
    const next: DiveSession = {
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'hairline' })] } : r,
      ),
    };

    expect(findNewSeriousBreach(prev, next)).toBeNull();
  });

  it('detects an existing crack that just escalated from moderate to critical', () => {
    const base = baseDive();
    const roomId = base.rooms[0]!.id;
    const prev: DiveSession = {
      ...base,
      rooms: base.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'moderate' })] } : r,
      ),
    };
    const next: DiveSession = {
      ...base,
      rooms: base.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'critical' })] } : r,
      ),
    };

    const breach = findNewSeriousBreach(prev, next);
    expect(breach).toEqual({ roomId, roomName: base.rooms[0]!.name, severity: 'critical', crackId: 'c1' });
  });

  it('does not re-report a crack that was already critical and stays critical', () => {
    const base = baseDive();
    const roomId = base.rooms[0]!.id;
    const prev: DiveSession = {
      ...base,
      rooms: base.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'critical' })] } : r,
      ),
    };
    const next: DiveSession = {
      ...base,
      rooms: base.rooms.map((r) =>
        r.id === roomId ? { ...r, cracks: [crack({ id: 'c1', roomId, severity: 'critical' })] } : r,
      ),
    };

    expect(findNewSeriousBreach(prev, next)).toBeNull();
  });

  it('returns null when nothing changed', () => {
    const dive = baseDive();
    expect(findNewSeriousBreach(dive, dive)).toBeNull();
  });
});
