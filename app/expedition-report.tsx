import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { calculateMissionRisk } from '@/game/missionRisk';
import type { OfflineMissionStatus } from '@/types';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function missionStatusLabel(status: OfflineMissionStatus): { title: string; detail: string } {
  switch (status) {
    case 'completed':
      return { title: 'Mission completed', detail: 'Target depth reached while you were away.' };
    case 'failed':
      return { title: 'Mission failed', detail: 'Hull or life-support margins collapsed during offline run.' };
    case 'emergency_extraction':
      return {
        title: 'Emergency extraction',
        detail: 'Autonomous surface protocol — partial haul recovered, tug stress applied.',
      };
    default:
      return { title: 'Mission still active', detail: 'Dive session resumed with updated telemetry.' };
  }
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export default function ExpeditionReportScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const report = state.pendingOfflineReport;
  const mission = state.missions.find((m) => m.id === state.dive?.missionId);

  if (!report) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No expedition report queued.</Text>
        <PrimaryButton title="Back to base" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  const risk = mission ? calculateMissionRisk(mission) : null;
  const statusCopy = missionStatusLabel(report.missionStatus);

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>Expedition Report</Text>
      <Text style={styles.sub}>Offline interval reconciled with hull state, cargo and crew logs.</Text>

      <PanelCard>
        <SectionTitle>Mission status</SectionTitle>
        <Text style={styles.statusTitle}>{statusCopy.title}</Text>
        <Text style={styles.line}>{statusCopy.detail}</Text>
        {report.emergencyExtraction ? (
          <Text style={styles.warn}>
            Emergency extraction: partial salvage rules applied. Surface tug stress −
            {report.surfaceHullPenaltyPercent}% hull on return.
          </Text>
        ) : null}
      </PanelCard>

      <PanelCard>
        <SectionTitle>Exploration Progress</SectionTitle>
        <Text style={styles.line}>Wall time away: {formatDuration(report.timeAwayMs)}</Text>
        <Text style={styles.line}>
          Simulated interval: {formatDuration(report.effectiveAwayMs)} (capped at 4h)
        </Text>
        <Text style={styles.line}>
          Depth reached: {Math.round(report.depthReachedM)}m (from {Math.round(report.depthStartM)}m)
        </Text>
        <Text style={styles.line}>Progress vs contract target: {report.explorationProgressPercent}%</Text>
        <Text style={styles.summary}>{report.explorationSummary}</Text>
        {report.cargoAtCapacity ? (
          <Text style={styles.warn}>Cargo headroom limited new salvage this interval.</Text>
        ) : null}
        {risk != null ? <Text style={styles.line}>Contract risk index: {risk}%</Text> : null}
      </PanelCard>

      <PanelCard>
        <SectionTitle>Resources Recovered</SectionTitle>
        <Text style={styles.line}>Scrap: {report.scrapCollected}</Text>
        <Text style={styles.line}>Research data: {report.researchCollected}</Text>
        <Text style={styles.line}>Treasures: {report.treasuresFound.length}</Text>
      </PanelCard>

      <PanelCard>
        <SectionTitle>Discoveries</SectionTitle>
        {report.treasuresFound.length === 0 ? (
          <Text style={styles.muted}>No relics recovered this interval.</Text>
        ) : (
          report.treasuresFound.map((t) => (
            <Text key={t.id} style={styles.treasure}>
              {t.name} · {t.rarity}
            </Text>
          ))
        )}
        {report.events.length ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionHint}>Signal highlights</Text>
            {report.events.map((e) => (
              <Text key={e.id} style={styles.event}>
                • {e.message}
              </Text>
            ))}
          </View>
        ) : null}
        {report.specialEventsDiscovered.length ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionHint}>Special events discovered</Text>
            {report.specialEventsDiscovered.map((line, idx) => (
              <Text key={`${idx}_${line}`} style={styles.event}>
                • {line}
              </Text>
            ))}
          </View>
        ) : null}
      </PanelCard>

      <PanelCard>
        <SectionTitle>Damage Report</SectionTitle>
        <Text style={styles.line}>Hull stress: {report.hullDamagePercent.toFixed(1)}%</Text>
        <Text style={styles.line}>Oxygen consumed: {report.oxygenUsedPercent.toFixed(1)}%</Text>
        <Text style={styles.line}>Water ingress: +{report.waterIngressPercent.toFixed(1)}%</Text>
      </PanelCard>

      <PanelCard>
        <SectionTitle>Crew Notes</SectionTitle>
        {report.crewNotes.length === 0 ? (
          <Text style={styles.muted}>No crew annotations.</Text>
        ) : (
          report.crewNotes.map((line, idx) => (
            <Text key={`${idx}`} style={styles.note}>
              {line}
            </Text>
          ))
        )}
      </PanelCard>

      <PanelCard>
        <SectionTitle>Recommended Action</SectionTitle>
        <Text style={styles.action}>{report.recommendedAction}</Text>
      </PanelCard>

      <PrimaryButton
        title="Continue Dive"
        onPress={() => {
          dispatch({ type: 'CLEAR_OFFLINE_REPORT' });
          if (state.dive && state.dive.status !== 'active') {
            router.replace('/mission-result');
          } else {
            router.replace('/dive');
          }
        }}
      />
      <PrimaryButton
        title="Return to Base"
        variant="ghost"
        onPress={() => {
          dispatch({ type: 'RETURN_TO_BASE' });
          router.replace('/base');
        }}
      />
      <PrimaryButton title="Review Inventory" variant="ghost" onPress={() => router.push('/inventory')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  sub: { color: theme.textMuted, marginBottom: 12, marginTop: 4 },
  sectionTitle: {
    color: theme.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '800',
  },
  sectionHint: { color: theme.textMuted, fontSize: 12, marginBottom: 6 },
  line: { color: theme.textMuted, marginBottom: 4 },
  event: { color: theme.text, marginBottom: 4, fontSize: 13 },
  treasure: { color: theme.text, marginBottom: 4, fontWeight: '600' },
  note: { color: theme.text, marginBottom: 6, lineHeight: 20 },
  action: { color: theme.text, lineHeight: 20, fontWeight: '600' },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
  statusTitle: { color: theme.text, fontWeight: '800', marginBottom: 6 },
  summary: { color: theme.text, marginTop: 8, lineHeight: 20 },
  warn: { color: theme.warning, marginTop: 8, lineHeight: 18, fontWeight: '600' },
});
