import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DepartmentBriefingCard } from '@/components/DepartmentBriefingCard';
import { DepartmentBriefingModal } from '@/components/DepartmentBriefingModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { buildDepartmentBriefing } from '@/game/departmentBriefings';
import { executeCrewAlertAction, type CrewAlertDispatch } from '@/game/crewAlertActions';
import { COMMAND_BRIEFING_LEADS, computeDepartmentStatuses } from '@/game/departmentStatus';
import { ROUTE_OPTIONS } from '@/game/navigation';
import type { GameAction } from '@/game/gameReducer';
import type { DepartmentBriefing, DepartmentLeadId } from '@/types/departmentBriefings';
import type { CrewAlertAction } from '@/types/crewAlerts';

export default function CommandBriefingsScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const dive = state.dive;
  const mission = useMemo(
    () => state.missions.find((m) => m.id === dive?.missionId) ?? null,
    [dive?.missionId, state.missions],
  );

  const [activeLead, setActiveLead] = useState<DepartmentLeadId | null>(null);
  const [briefing, setBriefing] = useState<DepartmentBriefing | null>(null);
  const [intentPickerOpen, setIntentPickerOpen] = useState(false);

  const diveActive = dive?.status === 'active';

  // Safety: if mission ends while modal is open, dismiss it (report/result must win).
  useEffect(() => {
    if (diveActive && !state.lastMissionOutcome) return;
    setIntentPickerOpen(false);
    setBriefing(null);
    setActiveLead(null);
  }, [diveActive, state.lastMissionOutcome]);

  const statuses = useMemo(() => computeDepartmentStatuses(state, mission), [state, mission]);

  const requestBriefing = useCallback(
    (leadId: DepartmentLeadId) => {
      setActiveLead(leadId);
      setBriefing(buildDepartmentBriefing(state, mission, leadId, Date.now()));
    },
    [mission, state],
  );

  const runAction = useCallback(
    (action: CrewAlertAction) => {
      executeCrewAlertAction({
        action,
        state,
        dispatch: (a: CrewAlertDispatch) => dispatch(a as GameAction),
        router,
        extras: { openCommandIntentPicker: () => setIntentPickerOpen(true) },
      });
      // Close the briefing when an action is taken (keeps flow clean).
      if (action.type !== 'change_command_intent') {
        setBriefing(null);
        setActiveLead(null);
      }
    },
    [dispatch, router, state],
  );

  const crewSummary = useMemo(() => {
    const cs = state.crewState;
    return `Morale ${Math.round(cs.morale)} · Stress ${Math.round(cs.stress)} · Discipline ${Math.round(
      cs.discipline,
    )} · Readiness ${Math.round(cs.readiness)}`;
  }, [state.crewState]);

  return (
    <ScreenShell scroll>
      <SectionHeader
        title="Command Briefings"
        subtitle="Department status reports from DBX-07 crew leads."
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHead}>Crew readiness</Text>
        <Text style={styles.summaryBody}>{crewSummary}</Text>
        {state.pendingInternalCrewEventId ? (
          <Text style={styles.summaryHint}>Unresolved internal crew event pending at base.</Text>
        ) : null}
      </View>

      {COMMAND_BRIEFING_LEADS.map((id) => {
        const st =
          statuses.find((s) => s.leadId === id) ??
          ({ leadId: id, tone: 'stable', badgeLabel: 'STABLE', shortReport: 'Standing by.' } as const);
        return (
          <DepartmentBriefingCard key={id} status={st} onRequestBriefing={() => requestBriefing(id)} />
        );
      })}

      <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />

      <DepartmentBriefingModal
        visible={Boolean(briefing)}
        briefing={briefing}
        onDismiss={() => {
          setBriefing(null);
          setActiveLead(null);
        }}
        onAction={runAction}
      />

      <Modal
        visible={intentPickerOpen && Boolean(diveActive)}
        transparent
        animationType="fade"
        onRequestClose={() => setIntentPickerOpen(false)}
      >
        <Pressable style={styles.intentBackdrop} onPress={() => setIntentPickerOpen(false)}>
          <View style={styles.intentSheet}>
            <Text style={styles.intentTitle}>Command Intent</Text>
            <Text style={styles.intentSub}>Issue orders; department leads execute the intent.</Text>
            {ROUTE_OPTIONS.map((r) => (
              <View key={r.id} style={styles.intentRow}>
                <PrimaryButton
                  title={`${r.label}${dive?.currentRoute === r.id ? ' · active' : ''}`}
                  variant={dive?.currentRoute === r.id ? 'primary' : 'ghost'}
                  onPress={() => {
                    dispatch({ type: 'SET_DIVE_ROUTE', route: r.id } as GameAction);
                    setIntentPickerOpen(false);
                    if (activeLead) setBriefing(buildDepartmentBriefing(state, mission, activeLead, Date.now()));
                  }}
                />
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
    padding: 14,
    marginBottom: 12,
  },
  summaryHead: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryBody: { color: theme.text, marginTop: 8, fontSize: 13, lineHeight: 20 },
  summaryHint: { color: theme.warning, marginTop: 8, fontSize: 12 },

  intentBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 2, 10, 0.86)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  intentSheet: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44, 217, 255, 0.35)',
    backgroundColor: 'rgba(0, 5, 14, 0.94)',
    padding: 16,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  intentTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
  intentSub: { color: theme.textMuted, marginTop: 6, marginBottom: 10, fontSize: 12 },
  intentRow: { marginBottom: 10 },
});

