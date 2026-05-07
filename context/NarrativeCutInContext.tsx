import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo } from 'react';

import { NarrativeCutInModal } from '@/components/NarrativeCutInModal';
import { useGame } from '@/context/GameContext';
import { resolveNarrativeCutInActions } from '@/game/cutInActionBridge';
import {
  executeCrewAlertAction,
  filterCrewAlertActionsForState,
  type CrewAlertDispatch,
} from '@/game/crewAlertActions';
import { mergeCutInQueue } from '@/game/cutInQueue';
import { CUT_INS_BY_ID } from '@/game/cutInRegistry';
import { shouldSuppressNarrativeCutIn } from '@/game/diveTransientState';
import type { GameAction } from '@/game/gameReducer';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { NarrativeCutIn } from '@/types';

export type NarrativeCutInContextValue = {
  showCutIn: (cutInId: string) => void;
  queueCutIn: (cutInId: string) => void;
  dismissCutIn: () => void;
  activeCutIn: NarrativeCutIn | null;
  cutInQueue: string[];
};

const NarrativeCutInContext = createContext<NarrativeCutInContextValue | null>(null);

export function NarrativeCutInProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGame();
  const router = useRouter();
  const segments = useSegments();
  const routePath = segments.join('/');

  const sortedQueue = useMemo(
    () => mergeCutInQueue([], state.pendingNarrativeCutInIds ?? []),
    [state.pendingNarrativeCutInIds],
  );

  const activeId = sortedQueue[0] ?? null;
  const activeCutIn = activeId ? CUT_INS_BY_ID[activeId] ?? null : null;

  const suppressCutIn = shouldSuppressNarrativeCutIn(state, routePath);

  const resolvedActions = useMemo(
    () => resolveNarrativeCutInActions(activeCutIn),
    [activeCutIn],
  );

  const extraActions = useMemo(
    () => filterCrewAlertActionsForState(state, resolvedActions),
    [resolvedActions, state],
  );

  const showCutIn = useCallback(
    (cutInId: string) => {
      dispatch({ type: 'REQUEST_NARRATIVE_CUT_IN', id: cutInId });
    },
    [dispatch],
  );

  const queueCutIn = showCutIn;

  const dismissCutIn = useCallback(() => {
    if (!activeId) return;
    dispatch({ type: 'DISMISS_NARRATIVE_CUT_IN', id: activeId });
  }, [dispatch, activeId]);

  const handleExtraAction = useCallback(
    (action: CrewAlertAction) => {
      const dismissId = activeId;
      if (!dismissId) return;
      dispatch({ type: 'DISMISS_NARRATIVE_CUT_IN', id: dismissId });
      executeCrewAlertAction({
        action,
        state,
        dispatch: (a: CrewAlertDispatch) => dispatch(a as GameAction),
        router,
      });
    },
    [activeId, dispatch, router, state],
  );

  const value = useMemo<NarrativeCutInContextValue>(
    () => ({
      showCutIn,
      queueCutIn,
      dismissCutIn,
      activeCutIn,
      cutInQueue: sortedQueue,
    }),
    [showCutIn, queueCutIn, dismissCutIn, activeCutIn, sortedQueue],
  );

  return (
    <NarrativeCutInContext.Provider value={value}>
      {children}
      <NarrativeCutInModal
        visible={Boolean(activeCutIn) && !suppressCutIn}
        cutIn={activeCutIn}
        extraActions={extraActions}
        onDismiss={dismissCutIn}
        onExtraAction={extraActions.length ? handleExtraAction : undefined}
      />
    </NarrativeCutInContext.Provider>
  );
}

/** Safe outside provider: no-ops and null active cut-in. */
export function useNarrativeCutIn(): NarrativeCutInContextValue {
  const ctx = useContext(NarrativeCutInContext);
  if (ctx) return ctx;
  return {
    showCutIn: () => {},
    queueCutIn: () => {},
    dismissCutIn: () => {},
    activeCutIn: null,
    cutInQueue: [],
  };
}
