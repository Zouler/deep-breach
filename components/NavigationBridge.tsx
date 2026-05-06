import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { useGame } from '@/context/GameContext';
import { gameAudio } from '@/game/audioManager';

export function NavigationBridge() {
  const { state, appForeground } = useGame();
  const router = useRouter();
  const segments = useSegments();
  const path = segments.join('/');

  useEffect(() => {
    if (!state.pendingOfflineReport) return;
    if (path.includes('expedition-report')) return;
    router.push('/expedition-report');
  }, [path, router, state.pendingOfflineReport]);

  useEffect(() => {
    if (state.pendingOfflineReport) return;
    if (!state.lastMissionOutcome) return;
    if (!state.dive || state.dive.status === 'active') return;
    if (path.includes('mission-result')) return;
    router.push('/mission-result');
  }, [
    path,
    router,
    state.dive,
    state.lastMissionOutcome,
    state.pendingOfflineReport,
  ]);

  /** Dive ambience: active expedition shell only; stops on base, results, title, or background. */
  useEffect(() => {
    const dive = state.dive;
    const active = dive?.status === 'active';
    if (!appForeground || !active) {
      void gameAudio.stopAmbience();
      return;
    }
    const onDiveShell =
      path === 'dive' || path.startsWith('room/') || path === 'inventory';
    if (!onDiveShell) {
      void gameAudio.stopAmbience();
      return;
    }
    void gameAudio.startAmbience();
  }, [appForeground, path, state.dive?.status]);

  return null;
}
