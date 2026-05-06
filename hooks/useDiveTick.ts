import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useGame } from '@/context/GameContext';

const TICK_MS = 520;

export function useDiveTick() {
  const { state, dispatch, appForeground } = useGame();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!state.dive || state.dive.status !== 'active') return;
    if (state.pendingOfflineReport) return;
    if (state.dive.pendingDiscovery) return;
    if (!appForeground || !isFocused) return;

    const id = setInterval(() => {
      dispatch({ type: 'TICK_DIVE', deltaMs: TICK_MS, now: Date.now() });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [
    appForeground,
    dispatch,
    isFocused,
    state.dive,
    state.pendingOfflineReport,
    state.dive?.status,
    state.dive?.pendingDiscovery,
  ]);
}
