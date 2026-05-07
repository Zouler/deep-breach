import type { GameState } from '@/types';

import { totalRepairSupplyUnits } from '@/game/baseStorage';
import { computeCargoUsed } from '@/game/cargo';
import { cargoCapacityUnits } from '@/game/submarineStats';

export const XO_BRIEFING_MIN_AWAY_MS = 15 * 60 * 1000;
export const XO_BRIEFING_LONG_AWAY_MS = 24 * 60 * 60 * 1000;

export function computeBriefingFingerprint(state: GameState, backgroundAt: number, now: number): string {
  const repAt = state.pendingOfflineReport?.generatedAt ?? 0;
  const dive = state.dive;
  const beatTail = state.storyBeats.at(-1)?.id ?? 'none';
  return `${backgroundAt}|${repAt}|${dive?.startedAt ?? 'n'}|${dive?.status ?? 'n'}|${Math.round(
    dive?.currentDepthM ?? 0,
  )}|${beatTail}|${Math.floor(now / 60000)}`;
}

export function shouldOfferXOBriefing(
  state: GameState,
  now: number,
): { offer: boolean; awayMs: number; backgroundAt: number | null } {
  const bg = state.narrativeRecap.lastGlobalBackgroundAt;
  if (!bg) return { offer: false, awayMs: 0, backgroundAt: null };
  const awayMs = Math.max(0, now - bg);
  if (awayMs < XO_BRIEFING_MIN_AWAY_MS) {
    return { offer: false, awayMs, backgroundAt: bg };
  }
  const fp = computeBriefingFingerprint(state, bg, now);
  if (fp === state.narrativeRecap.lastXOBriefingDismissedFingerprint) {
    return { offer: false, awayMs, backgroundAt: bg };
  }
  return { offer: true, awayMs, backgroundAt: bg };
}

export type XOBriefingContent = {
  fingerprint: string;
  paragraphs: string[];
  suggestCaptainLog: boolean;
  showReturnToBase: boolean;
};

export function buildXOBriefing(
  state: GameState,
  opts: { awayMs: number; backgroundAt: number; now: number },
): XOBriefingContent {
  const { awayMs, backgroundAt, now } = opts;
  const fp = computeBriefingFingerprint(state, backgroundAt, now);
  const commander = state.commander.name;
  const dive = state.dive;
  const report = state.pendingOfflineReport;
  const beatsWhileAway = state.storyBeats.filter(
    (b) => b.timestamp >= backgroundAt && b.timestamp <= now,
  );
  const notableAway = beatsWhileAway
    .filter((b) => b.importance !== 'low')
    .slice(-4)
    .map((b) => b.summaryText);

  const paragraphs: string[] = [];

  const greeting =
    awayMs >= XO_BRIEFING_LONG_AWAY_MS
      ? `Captain ${commander}, long interval since your last watch — executive summary follows.`
      : `Captain ${commander}, while you were off the bridge, I kept the picture short.`;

  paragraphs.push(greeting);

  if (report && dive?.status === 'active') {
    paragraphs.push(
      `Unattended interval: about ${Math.round(awayMs / 60000)} minutes. ${report.explorationSummary}`,
    );
  } else if (notableAway.length) {
    paragraphs.push(`Highlights: ${notableAway.join(' ')}`);
  } else if (dive?.status === 'active') {
    paragraphs.push(
      `DBX-07 remains underway on ${dive.missionName}. Depth ${Math.round(
        dive.currentDepthM,
      )}m · range ${(dive.horizontalDistanceKm ?? 0).toFixed(1)} km.`,
    );
  } else {
    paragraphs.push('No active trial is running. The boat is in facility posture.');
  }

  const hull = state.submarine.hullIntegrityPercent;
  const leaks =
    dive?.rooms.reduce((n, r) => n + r.cracks.filter((c) => c.severity !== 'hairline').length, 0) ??
    0;
  const cargoUsed = dive ? computeCargoUsed(dive) : 0;
  const cargoCap = cargoCapacityUnits(state.submarine);
  const supplies = totalRepairSupplyUnits(state.baseStorage);

  const statusBits: string[] = [];
  statusBits.push(`Hull ${Math.round(hull)}%`);
  if (dive) statusBits.push(`oxygen ${Math.round(dive.oxygenPercent)}%`);
  else statusBits.push(`boat oxygen plant nominal`);
  if (leaks > 0) statusBits.push(`${leaks} serious leak(s) in the stack`);
  if (dive && cargoCap > 0) {
    statusBits.push(`cargo ${cargoUsed}/${cargoCap}`);
  }
  if (supplies < 6) statusBits.push('repair stock below comfort level');

  paragraphs.push(`Vessel status: ${statusBits.join(' · ')}.`);

  const rec: string[] = [];
  if (report?.emergencyExtraction) {
    rec.push('Review the expedition report and stabilize before re-entering the trench.');
  } else if (leaks > 0) {
    rec.push('Prioritize breach control and staged repair kits before pushing depth.');
  } else if (supplies < 6) {
    rec.push('Restock from recovery or Repair Dock before the next certification trial.');
  } else if (!dive) {
    rec.push('When ready, select the next trial from the schedule.');
  } else {
    rec.push('Continue the trial or return to base if margins tighten.');
  }

  paragraphs.push(`Recommendation: ${rec.join(' ')}`);

  return {
    fingerprint: fp,
    paragraphs,
    suggestCaptainLog: awayMs >= XO_BRIEFING_LONG_AWAY_MS || notableAway.length >= 3,
    showReturnToBase: Boolean(dive?.status === 'active'),
  };
}
