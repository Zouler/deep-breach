import type { GameState } from '@/types';

/** Pressure Trial I — first Experimental Trial mission id. */
export const FIRST_TRIAL_MISSION_ID = 'shallow_descent';

type StoryRoute = '/dive' | '/mission-result';

/**
 * Begin Act 1 first trial: start dive if safe; otherwise route to debrief or schedule with highlight.
 */
export function navigateToFirstTrialFlow(
  replace: (href: StoryRoute) => void,
  dispatch: (action: { type: 'START_MISSION'; missionId: string }) => void,
  dive: GameState['dive'],
): void {
  if (!dive) {
    dispatch({ type: 'START_MISSION', missionId: FIRST_TRIAL_MISSION_ID });
    replace('/dive');
    return;
  }
  if (dive.status === 'active') {
    replace('/dive');
    return;
  }
  replace('/mission-result');
}
