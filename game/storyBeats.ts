import type { GameState, StoryBeat } from '@/types';

import { createId } from '@/game/ids';

const MAX_STORY_BEATS = 96;

export function withStoryBeat(
  state: GameState,
  beat: Omit<StoryBeat, 'id' | 'timestamp'> & { timestamp?: number },
): GameState {
  const entry: StoryBeat = {
    id: createId('beat'),
    timestamp: beat.timestamp ?? Date.now(),
    missionId: beat.missionId,
    diveStartedAt: beat.diveStartedAt,
    type: beat.type,
    importance: beat.importance,
    title: beat.title,
    summaryText: beat.summaryText,
    speakerId: beat.speakerId,
  };
  const next = [...(state.storyBeats ?? []), entry].slice(-MAX_STORY_BEATS);
  return { ...state, storyBeats: next };
}

export function findNewSeriousBreach(
  prev: NonNullable<GameState['dive']>,
  next: NonNullable<GameState['dive']>,
): {
  roomId: string;
  roomName: string;
  severity: 'moderate' | 'critical';
  crackId: string;
} | null {
  const prevIds = new Set(prev.rooms.flatMap((r) => r.cracks.map((c) => c.id)));
  for (const r of next.rooms) {
    for (const c of r.cracks) {
      if (!prevIds.has(c.id) && (c.severity === 'moderate' || c.severity === 'critical')) {
        return {
          roomId: r.id,
          roomName: r.name,
          severity: c.severity,
          crackId: c.id,
        };
      }
    }
  }
  return null;
}
