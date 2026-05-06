import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { useGame } from '@/context/GameContext';

export function NavigationBridge() {
  const { state } = useGame();
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

  return null;
}
