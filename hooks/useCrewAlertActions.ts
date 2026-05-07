import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useGame } from '@/context/GameContext';
import {
  executeCrewAlertAction,
  type CrewAlertDispatch,
  type CrewAlertExecutionExtras,
} from '@/game/crewAlertActions';
import type { GameAction } from '@/game/gameReducer';
import type { CrewAlertAction } from '@/types/crewAlerts';

export function useCrewAlertActions(extras?: CrewAlertExecutionExtras) {
  const { state, dispatch } = useGame();
  const router = useRouter();

  return useCallback(
    (action: CrewAlertAction) => {
      executeCrewAlertAction({
        action,
        state,
        dispatch: (a: CrewAlertDispatch) => dispatch(a as GameAction),
        router,
        extras,
      });
    },
    [dispatch, extras, router, state],
  );
}
