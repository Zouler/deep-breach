import { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { XOBriefingModal } from '@/components/XOBriefingModal';
import { useGame } from '@/context/GameContext';
import { gameAudio } from '@/game/audioManager';
import { buildXOBriefing, shouldOfferXOBriefing } from '@/game/recapGenerator';

export function NavigationBridge() {
  const { state, dispatch, hydrated, appForeground } = useGame();
  const router = useRouter();
  const segments = useSegments();
  const path = segments.join('/');
  const [xoOpen, setXoOpen] = useState(false);
  const [xoContent, setXoContent] = useState<ReturnType<typeof buildXOBriefing> | null>(null);
  const prevFg = useRef(appForeground);
  const coldStartChecked = useRef(false);
  const xoOpenRef = useRef(false);
  xoOpenRef.current = xoOpen;

  const tryOpenBriefing = (now: number) => {
    if (xoOpenRef.current) return;
    const { offer, backgroundAt } = shouldOfferXOBriefing(state, now);
    if (!offer || !backgroundAt) return;
    const awayMs = now - backgroundAt;
    const content = buildXOBriefing(state, { awayMs, backgroundAt, now });
    setXoContent(content);
    setXoOpen(true);
  };

  useEffect(() => {
    if (!hydrated) return;
    if (coldStartChecked.current) return;
    coldStartChecked.current = true;
    tryOpenBriefing(Date.now());
  }, [hydrated, state]);

  useEffect(() => {
    const resumed = !prevFg.current && appForeground;
    prevFg.current = appForeground;
    if (!hydrated || !resumed) return;
    tryOpenBriefing(Date.now());
  }, [appForeground, hydrated, state]);

  useEffect(() => {
    if (!state.pendingOfflineReport) return;
    if (path.includes('expedition-report')) return;
    if (xoOpenRef.current) return;
    router.replace('/expedition-report');
  }, [path, router, state.pendingOfflineReport, xoOpen]);

  useEffect(() => {
    if (state.pendingOfflineReport) return;
    if (!state.lastMissionOutcome) return;
    if (!state.dive || state.dive.status === 'active') return;
    if (path.includes('mission-result')) return;
    if (xoOpenRef.current) return;
    router.replace('/mission-result');
  }, [
    path,
    router,
    state.dive,
    state.lastMissionOutcome,
    state.pendingOfflineReport,
    xoOpen,
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

  const dismissXo = () => {
    if (xoContent) {
      dispatch({
        type: 'NARRATIVE_DISMISS_XO_BRIEFING',
        fingerprint: xoContent.fingerprint,
        now: Date.now(),
      });
    }
    setXoOpen(false);
  };

  return (
    <>
      <XOBriefingModal
        visible={xoOpen && Boolean(xoContent)}
        paragraphs={xoContent?.paragraphs ?? []}
        suggestCaptainLog={xoContent?.suggestCaptainLog ?? false}
        showReturnToBase={xoContent?.showReturnToBase ?? false}
        onContinue={dismissXo}
        onReviewCaptainLog={() => {
          dismissXo();
          router.push('/captains-log');
        }}
        onReturnToBase={
          state.dive?.status === 'active'
            ? () => {
                dispatch({ type: 'RETURN_TO_BASE' });
                dismissXo();
                router.replace('/base');
              }
            : undefined
        }
      />
    </>
  );
}
