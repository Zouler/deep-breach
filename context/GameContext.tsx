import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { createInitialGameState } from '@/game/initialGame';
import { gameAudio } from '@/game/audioManager';
import { reduceGame, type GameAction } from '@/game/gameReducer';
import { reactToGameAudio } from '@/game/reactGameAudio';
import { loadAudioSettings } from '@/storage/audioSettingsStorage';

const IMMEDIATE_SAVE = new Set<GameAction['type']>([
  'START_MISSION',
  'SET_OFFLINE_EXPLORATION',
  'MARK_DIVER_BACKGROUND',
  'SCAN_PENDING_DISCOVERY',
  'RESOLVE_PENDING_DISCOVERY',
  'SET_DIVE_ROUTE',
  'USE_EMERGENCY_OXYGEN',
  'SCAN_AREA',
  'DISMISS_DISCOVERY_OUTCOME',
  'REPAIR_CRACK',
  'COLLECT_LOOT',
  'RETURN_TO_BASE',
  'REPAIR_DOCK_HULL',
  'REPAIR_DOCK_RESTOCK_BASIC',
  'UPGRADE_MODULE',
  'NEW_GAME',
  'STORY_MARK_ASSIGNMENT_BRIEFING_SEEN',
  'STORY_ACCEPT_ASSIGNMENT',
  'STORY_SKIP_ASSIGNMENT_BRIEFING',
  'STORY_INTRO_SEQUENCE_COMPLETE',
  'STORY_INTRO_SEQUENCE_SKIP',
  'APPLY_OFFLINE_RESOLUTION',
  'CLEAR_OFFLINE_REPORT',
  'HIRE_CREW',
  'TOGGLE_CREW_ASSIGN',
]);
import type { GameState } from '@/types';
import { loadGameState, saveGameState } from '@/storage/gameStorage';

type GameContextValue = {
  state: GameState;
  dispatch: (action: GameAction) => void;
  hydrated: boolean;
  hasSaveFile: boolean;
  appForeground: boolean;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

function gameReducer(state: GameState, action: GameAction): GameState {
  return reduceGame(state, action);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchBase] = useReducer(gameReducer, createInitialGameState());
  const [hydrated, setHydrated] = useState(false);
  const [hasSaveFile, setHasSaveFile] = useState(false);
  const [appForeground, setAppForeground] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Chains `reduceGame` previews when multiple dispatches batch before the next paint. */
  const audioChainRef = useRef<GameState | null>(null);
  useLayoutEffect(() => {
    audioChainRef.current = null;
  });
  const skipInitialSave = useRef(true);
  const pendingImmediateSave = useRef(false);

  useEffect(() => {
    void gameAudio.ensureInitialized();
    void loadAudioSettings().then((s) => gameAudio.applyUserSettings(s));
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    const prev = audioChainRef.current ?? stateRef.current;
    const next = reduceGame(prev, action);
    audioChainRef.current = next;
    if (IMMEDIATE_SAVE.has(action.type)) pendingImmediateSave.current = true;
    dispatchBase(action);
    reactToGameAudio(prev, next, action);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadGameState();
      if (cancelled) return;
      if (loaded) {
        dispatch({ type: 'HYDRATE', state: loaded });
        setHasSaveFile(true);
      } else {
        setHasSaveFile(false);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  /** Cold start: resolve one offline interval if the player left with exploration enabled. */
  useEffect(() => {
    if (!hydrated) return;
    const d = stateRef.current.dive;
    if (!d?.continueExplorationWhileAway || !d.backgroundedAt || d.status !== 'active') return;
    dispatch({ type: 'APPLY_OFFLINE_RESOLUTION', now: Date.now() });
  }, [hydrated, dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    if (pendingImmediateSave.current) {
      pendingImmediateSave.current = false;
      void saveGameState(state).then(() => setHasSaveFile(true));
      return;
    }
    const handle = setTimeout(() => {
      void saveGameState(stateRef.current).then(() => setHasSaveFile(true));
    }, 500);
    return () => clearTimeout(handle);
  }, [state, hydrated]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = AppState.currentState;
      setAppForeground(next === 'active');
      if (next === 'inactive' || next === 'background') {
        void gameAudio.pauseAmbienceForBackground();
        const dive = stateRef.current.dive;
        if (
          dive &&
          dive.status === 'active' &&
          dive.continueExplorationWhileAway &&
          !dive.backgroundedAt
        ) {
          dispatch({ type: 'MARK_DIVER_BACKGROUND', now: Date.now() });
        }
      }
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        dispatch({ type: 'APPLY_OFFLINE_RESOLUTION', now: Date.now() });
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [dispatch]);

  const value = useMemo(
    () => ({ state, dispatch, hydrated, hasSaveFile, appForeground }),
    [state, dispatch, hydrated, hasSaveFile, appForeground],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
