import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ActionableCrewAlert } from '@/components/ActionableCrewAlert';
import { CommandIntentModal } from '@/components/CommandIntentModal';
import { DiscoveryOutcomeModal } from '@/components/DiscoveryOutcomeModal';
import { DiscoveryPromptModal } from '@/components/DiscoveryPromptModal';
import { DiveFlashBand } from '@/components/DiveFlashBand';
import {
  AlertFeedCompact,
  CompactRoomRow,
  EmergencyButton,
  HudPanel,
  HudSectionTitle,
  StatusBarGauge,
  TacticalButton,
} from '@/components/hud/HudPrimitives';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SafeIcon } from '@/components/SafeIcon';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { monoData, theme } from '@/constants/theme';
import { diveTrialTipsForMission } from '@/data/storyBriefings';
import { useGame } from '@/context/GameContext';
import { filterCrewAlertActionsForState } from '@/game/crewAlertActions';
import { useCrewAlertActions } from '@/hooks/useCrewAlertActions';
import { useDiveFeedback } from '@/hooks/useDiveFeedback';
import { useDiveTick } from '@/hooks/useDiveTick';
import { isPropulsionRoom } from '@/game/rooms';
import { getDiveRoomThreat, type DiveRoomThreat } from '@/game/diveRoomThreat';
import { scanAvailable } from '@/game/discoveries';
import { formatCrewMessageDisplayName } from '@/game/crewMessagePresentation';
import { getOfflineExplorationGuard } from '@/game/offlineGuards';
import { getMissionModifierById, isHarderModifier } from '@/game/missionModifiers';
import { calculateMissionRisk } from '@/game/missionRisk';
import { ROUTE_OPTIONS } from '@/game/navigation';
import { formatHorizontalLabel, formatVerticalLabel } from '@/game/navigationVector';
import { computeCargoUsed, oxygenCanisterCount } from '@/game/cargo';
import {
  emergencyOxygenRestorePercent,
  oxygenCanisterRestorePercent,
} from '@/game/oxygen';
import { canPerformAreaScan, SCAN_AREA_COOLDOWN_MS } from '@/game/scanArea';
import {
  countActiveCracks,
  countHullRepairUnitsInExpedition,
  getRepairStockStatus,
  repairStockHudLine,
} from '@/game/repairResourceStatus';
import { cargoCapacityUnits } from '@/game/submarineStats';
import {
  formatThreatLabel,
  threatForHigherIsBetter,
  threatForLowerIsBetter,
  threatToGaugeTone,
} from '@/game/threatLevels';

export default function DiveScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const dive = state.dive;
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const openIntentPicker = useCallback(() => setRoutePickerOpen(true), []);
  const runCrewAlertAction = useCrewAlertActions({ openCommandIntentPicker: openIntentPicker });

  useDiveTick();
  const flashKind = useDiveFeedback(dive);

  const mission = useMemo(
    () => state.missions.find((m) => m.id === dive?.missionId),
    [dive?.missionId, state.missions],
  );

  const diveActive = dive?.status === 'active';
  const activeModifier = dive ? getMissionModifierById(dive.activeModifierId) : null;

  // Keep hook order stable across mission transitions (active → terminal).
  const priorityComm = useMemo(() => {
    const msgs = dive?.crewMessages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i]!;
      if (m.actions?.length) return m;
    }
    return null;
  }, [dive?.crewMessages]);

  const priorityActions = useMemo(() => {
    if (!priorityComm?.actions?.length) return [];
    return filterCrewAlertActionsForState(state, priorityComm.actions).filter(
      (a) => a.type !== 'acknowledge',
    );
  }, [priorityComm, state]);

  useEffect(() => {
    if (diveActive) return;
    setRoutePickerOpen(false);
  }, [diveActive]);

  if (!dive || !mission) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No active dive. Launch from Mission Select.</Text>
        <PrimaryButton title="Back to Base" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  if (!diveActive) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>
          This trial has ended. If the report does not open automatically, continue manually.
        </Text>
        <PrimaryButton
          title="Open Trial Report"
          onPress={() =>
            router.replace(state.lastMissionOutcome ? '/mission-result' : '/base')
          }
        />
        <PrimaryButton title="Back to Base" variant="ghost" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  const leaks = dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
  const offlineGuard = getOfflineExplorationGuard(dive);
  const offlineOk = offlineGuard.canEnable;
  const riskScore = calculateMissionRisk(mission);
  const scanReady = canPerformAreaScan(dive, Date.now());
  const scanCooldownLeftMs = Math.max(
    0,
    SCAN_AREA_COOLDOWN_MS - (Date.now() - dive.lastAreaScanAt),
  );
  const o2RestoreHint = Math.round(emergencyOxygenRestorePercent(state.submarine));
  const canisterRestore = Math.round(oxygenCanisterRestorePercent());
  const o2Canisters = oxygenCanisterCount(dive);
  const cargoUsed = computeCargoUsed(dive);
  const cargoCap = cargoCapacityUnits(state.submarine);
  const canUseO2 = o2Canisters > 0 || dive.emergencyOxygenChargesRemaining > 0;

  const hullThreat = threatForHigherIsBetter(dive.hullIntegrityPercent);
  const oxyThreat = threatForHigherIsBetter(dive.oxygenPercent);
  const waterThreat = threatForLowerIsBetter(dive.waterLevelPercent);

  const hullRepairUnits = countHullRepairUnitsInExpedition(dive.expeditionRepairInventory);
  const repairStockStatus = getRepairStockStatus(dive);
  const repairStockLine = repairStockHudLine(repairStockStatus, hullRepairUnits);
  const breachCount = countActiveCracks(dive);

  const criticalLeak = dive.rooms.some((r) =>
    r.cracks.some((c) => c.severity === 'critical'),
  );
  const leakSeverity = criticalLeak ? 'CRITICAL LEAK' : leaks > 0 ? 'ACTIVE LEAKS' : 'DRY BILGE';

  const delegationModeLabel = dive.continueExplorationWhileAway ? 'XO Command' : 'Captain Control';
  const delegationShort = dive.continueExplorationWhileAway
    ? 'Command delegation accepted. I’ll keep the crew on standing orders.'
    : 'Dive pauses while the captain is away.';
  const delegationBlockReason =
    offlineOk || dive.continueExplorationWhileAway
      ? null
      : 'Stabilize hull, oxygen, and critical leaks before handing me command.';

  const roomAccentColor = (t: DiveRoomThreat) => {
    switch (t) {
      case 'safe':
        return '#15803d';
      case 'warning':
        return '#ca8a04';
      case 'danger':
        return '#ea580c';
      case 'critical':
        return '#e11d48';
      default:
        return '#38bdf8';
    }
  };

  const alertLines = (dive.crewMessages ?? [])
    .filter((m) => (priorityComm ? m.id !== priorityComm.id : true))
    .slice(-3)
    .reverse()
    .map((m) => ({
      id: m.id,
      speaker: formatCrewMessageDisplayName(m.speaker),
      severity: m.severity === 'danger' ? 'danger' : m.severity === 'warning' ? 'warning' : 'info',
      text: m.text,
    })) as { id: string; speaker: string; severity: 'info' | 'warning' | 'danger'; text: string }[];

  return (
    <View style={styles.wrapper}>
      <ScreenShell
        scroll
        contentStyle={styles.scrollPad}
        backgroundImage={GAME_ASSETS.diveScreenBg}
        backgroundScrimOpacity={0.68}
        scanlineOverlay
        scanlineOpacity={theme.scanlineOpacityHud}
      >
        <HudPanel>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topTitle}>{dive.missionName}</Text>
              <Text style={styles.topMeta}>
                Trial depth {dive.targetDepthM}m · risk {riskScore}% · cargo {cargoUsed}/{cargoCap}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <PrimaryButton
                title="Briefings"
                variant="ghost"
                onPress={() => router.push('/command-briefings')}
              />
              <PrimaryButton
                title="Inventory"
                variant="ghost"
                onPress={() => router.push('/inventory')}
              />
            </View>
          </View>
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>TRIAL DIRECTIVE</HudSectionTitle>
          {mission.trialPurpose ? <Text style={styles.small}>{mission.trialPurpose}</Text> : null}
          {diveTrialTipsForMission(mission.id).map((line) => (
            <Text key={line} style={styles.tipLine}>
              • {line}
            </Text>
          ))}
          {activeModifier ? (
            <Text
              style={[
                styles.modifierLine,
                isHarderModifier(activeModifier) ? styles.modifierLineHarder : styles.modifierLineEasier,
              ]}
            >
              Conditions: {activeModifier.name} — {activeModifier.blurb}
            </Text>
          ) : null}
        </HudPanel>

        <HudPanel>
          <HudSectionTitle
            right={
              <View
                style={[
                  styles.conditionBadge,
                  criticalLeak ? styles.badgeCrit : leaks > 0 ? styles.badgeWarn : styles.badgeOk,
                ]}
              >
                {leaks > 0 ? (
                  <SafeIcon source={GAME_ASSETS.icons.crack} size={18} style={{ marginRight: 6 }} />
                ) : null}
                <Text style={styles.conditionText}>{leakSeverity}</Text>
              </View>
            }
          >
            MAIN STATUS
          </HudSectionTitle>

          <Text style={styles.label}>Current depth</Text>
          <Text style={styles.depthHero}>{Math.round(dive.currentDepthM)} m</Text>

          <View style={styles.threatRow}>
            <View style={[styles.pill, hullThreat === 'critical' && styles.pillCrit]}>
              <Text style={styles.pillLabel}>Hull</Text>
              <Text style={styles.pillValue}>{formatThreatLabel(hullThreat)}</Text>
            </View>
            <View style={[styles.pill, oxyThreat === 'critical' && styles.pillCrit]}>
              <Text style={styles.pillLabel}>O₂</Text>
              <Text style={styles.pillValue}>{formatThreatLabel(oxyThreat)}</Text>
            </View>
            <View style={[styles.pill, waterThreat === 'critical' && styles.pillCrit]}>
              <Text style={styles.pillLabel}>Water</Text>
              <Text style={styles.pillValue}>{formatThreatLabel(waterThreat)}</Text>
            </View>
          </View>

          <StatusBarGauge label="Hull integrity" value={dive.hullIntegrityPercent} tone={threatToGaugeTone(hullThreat)} />
          <StatusBarGauge label="Oxygen reserves" value={dive.oxygenPercent} tone={threatToGaugeTone(oxyThreat)} />
          <StatusBarGauge label="Water intrusion" value={dive.waterLevelPercent} tone={threatToGaugeTone(waterThreat)} />
          <Text style={styles.small}>{leaks} crack(s) across compartments</Text>
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>NAV VECTOR</HudSectionTitle>
          <Text style={styles.navLine}>
            {formatVerticalLabel(dive.verticalMovementState ?? 'descending')}
          </Text>
          <Text style={styles.navLine}>
            {formatHorizontalLabel(dive.horizontalMovementState ?? 'advancing')}
          </Text>
          <Text style={styles.navMeta}>
            Descent ~{Math.max(0, Math.round(dive.descentRateMPerMin ?? 0))} m/min · Forward ~{' '}
            {(dive.horizontalSpeedKmPerMin ?? 0).toFixed(2)} km/min
          </Text>
          <Text style={styles.navMeta}>
            Range: {(dive.horizontalDistanceKm ?? 0).toFixed(1)} km
          </Text>
          <Text style={styles.navIntent}>
            Intent: {ROUTE_OPTIONS.find((r) => r.id === dive.currentRoute)?.label ?? '—'}
          </Text>
          <View style={styles.navMapRow}>
            <PrimaryButton
              style={styles.navMapBtn}
              title="Nav Map"
              variant="ghost"
              onPress={() => router.push('/nav-map')}
            />
            <PrimaryButton
              style={styles.navMapBtn}
              title="Tac Sonar"
              variant="ghost"
              onPress={() => router.push('/tactical-sonar')}
            />
          </View>
        </HudPanel>

        <HudPanel variant="emergency">
          <HudSectionTitle>EMERGENCY OXYGEN</HudSectionTitle>
          <EmergencyButton
            title="Use Emergency Oxygen"
            subtitle={
              canUseO2
                ? `Restore ~+${o2Canisters > 0 ? canisterRestore : o2RestoreHint}% · ${
                    o2Canisters > 0
                      ? `${o2Canisters} canister(s)`
                      : `${dive.emergencyOxygenChargesRemaining} reserve charge(s)`
                  }`
                : 'UNAVAILABLE — no canisters or reserve charges'
            }
            disabled={!diveActive || !canUseO2}
            onPress={() => {
              if (!diveActive) return;
              dispatch({ type: 'USE_EMERGENCY_OXYGEN' });
            }}
          />
          {!canUseO2 ? <Text style={styles.small}>Resupply at Repair Dock or upgrade O₂ plant.</Text> : null}
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>REPAIR STOCK (HULL KITS)</HudSectionTitle>
          <Text
            style={[
              styles.repairStockLine,
              repairStockStatus === 'critical_empty'
                ? styles.repairStockCrit
                : repairStockStatus === 'empty'
                  ? styles.repairStockEmpty
                  : repairStockStatus === 'low'
                    ? styles.repairStockLow
                    : styles.repairStockOk,
            ]}
          >
            {repairStockLine}
          </Text>
          <Text style={styles.small}>
            Hull Patch / Sealant / Brace only. Oxygen canisters are tracked separately for O₂
            actions.
          </Text>
          {repairStockStatus === 'empty' || repairStockStatus === 'critical_empty' ? (
            <>
              <Text style={[styles.small, styles.repairHint]}>
                {breachCount > 0
                  ? 'Search for Salvage improves odds of repair supplies in recoveries. Stabilize Systems slows new damage. Return to Base (below) if you cannot manage the hull.'
                  : 'You have no hull repair kits left. Search for Salvage before the next breach. Stabilize Systems reduces crack risk.'}
              </Text>
              <View style={styles.intentSuggestCol}>
                <PrimaryButton
                  title="Set intent: Search for Salvage"
                  variant="ghost"
                  disabled={dive.currentRoute === 'search_salvage'}
                  onPress={() => dispatch({ type: 'SET_DIVE_ROUTE', route: 'search_salvage' })}
                />
                <PrimaryButton
                  title="Set intent: Stabilize Systems"
                  variant="ghost"
                  disabled={dive.currentRoute === 'stabilize_systems'}
                  onPress={() =>
                    dispatch({ type: 'SET_DIVE_ROUTE', route: 'stabilize_systems' })
                  }
                />
              </View>
            </>
          ) : null}
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>TACTICAL ACTIONS</HudSectionTitle>
          <View style={styles.tacticalRow}>
            <View style={{ flex: 1 }}>
              <TacticalButton
                title={scanReady ? 'Scan Area' : 'Scan Cooling'}
                subtitle={
                  scanReady
                    ? 'Sweep for outside contacts.'
                    : `Cooling ${Math.max(1, Math.ceil(scanCooldownLeftMs / 1000))}s`
                }
                icon={GAME_ASSETS.icons.scanArea}
                disabled={!diveActive || !scanReady || !!dive.pendingDiscovery}
                onPress={() => {
                  if (!diveActive) return;
                  dispatch({ type: 'SCAN_AREA', now: Date.now() });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TacticalButton
                title="Change Command Intent"
                subtitle={`Current: ${
                  ROUTE_OPTIONS.find((r) => r.id === dive.currentRoute)?.label ?? 'Unknown'
                }`}
                disabled={!diveActive}
                onPress={() => {
                  if (!diveActive) return;
                  setRoutePickerOpen(true);
                }}
              />
            </View>
          </View>
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>COMMAND DELEGATION</HudSectionTitle>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.modeLabel}>{delegationModeLabel}</Text>
              <Text style={styles.small}>{delegationShort}</Text>
            </View>
            <Switch
              value={dive.continueExplorationWhileAway}
              onValueChange={(v) => dispatch({ type: 'SET_OFFLINE_EXPLORATION', value: v })}
              disabled={!offlineOk && !dive.continueExplorationWhileAway}
              thumbColor={dive.continueExplorationWhileAway ? theme.accent : '#334155'}
              trackColor={{ false: '#1e293b', true: '#155e75' }}
            />
          </View>
          {delegationBlockReason ? <Text style={styles.warn}>{delegationBlockReason}</Text> : null}
          {__DEV__ ? <Text style={styles.debug}>DEV: {offlineGuard.debugDetails}</Text> : null}
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>SUBMARINE COMPARTMENTS</HudSectionTitle>
          {dive.rooms.map((room) => {
            const isEngine = isPropulsionRoom(room.id);
            const tier = getDiveRoomThreat(room, isEngine ? dive.engineHeatPercent : undefined);
            const staged = room.loot.filter(
              (l) =>
                !l.collected && (l.kind === 'repair_supply' || l.kind === 'emergency_supply'),
            ).length;
            const accent = roomAccentColor(tier);
            const heatSuffix = isEngine ? ` · heat ${Math.round(dive.engineHeatPercent)}%` : '';
            return (
              <CompactRoomRow
                key={room.id}
                title={room.name}
                subtitle={`${tier.toUpperCase()} · ${room.cracks.length} crack(s) · ${staged} staged${heatSuffix}`}
                leftIcon={room.cracks.length > 0 ? GAME_ASSETS.icons.crack : undefined}
                accentColor={accent}
                onPress={() => router.push(`/room/${room.id}`)}
              />
            );
          })}
        </HudPanel>

        <HudPanel>
          <HudSectionTitle>ALERT FEED</HudSectionTitle>
          {priorityComm && priorityActions.length > 0 ? (
            <ActionableCrewAlert
              message={priorityComm}
              actions={priorityActions}
              onAction={runCrewAlertAction}
            />
          ) : null}
          <AlertFeedCompact lines={alertLines} />
        </HudPanel>

        <View style={styles.returnRow}>
          <PrimaryButton
            title="Return to Base (Abort)"
            variant="danger"
            onPress={() => {
              dispatch({ type: 'RETURN_TO_BASE' });
              router.replace('/base');
            }}
          />
        </View>
      </ScreenShell>
      <DiveFlashBand kind={flashKind} />
      <CommandIntentModal
        visible={routePickerOpen && diveActive}
        currentRoute={dive.currentRoute}
        onSelect={(route) => {
          dispatch({ type: 'SET_DIVE_ROUTE', route });
          setRoutePickerOpen(false);
        }}
        onClose={() => setRoutePickerOpen(false)}
      />
      {diveActive && dive.pendingDiscovery ? (
        <DiscoveryPromptModal
          visible
          discovery={dive.pendingDiscovery}
          scanAvailable={scanAvailable(state.submarine, state.crew)}
          onScan={() => {
            if (!diveActive) return;
            dispatch({ type: 'SCAN_PENDING_DISCOVERY' });
          }}
          onIgnore={() => {
            if (!diveActive) return;
            dispatch({ type: 'RESOLVE_PENDING_DISCOVERY', choice: 'ignore' });
          }}
          onAttempt={() => {
            if (!diveActive) return;
            dispatch({ type: 'RESOLVE_PENDING_DISCOVERY', choice: 'attempt' });
          }}
        />
      ) : null}
      <DiscoveryOutcomeModal
        visible={diveActive && Boolean(dive.discoveryOutcomeBanner)}
        banner={dive.discoveryOutcomeBanner}
        onDismiss={() => {
          if (!diveActive) return;
          dispatch({ type: 'DISMISS_DISCOVERY_OUTCOME' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.bg },
  scrollPad: { paddingTop: 6, paddingBottom: 14 },
  hero: { color: theme.accent, fontSize: 40, fontWeight: '800', marginBottom: 8 },
  depthHero: {
    color: theme.instrumentCyan,
    fontSize: 44,
    fontWeight: '900',
    marginBottom: 4,
    ...monoData,
  },
  label: { color: theme.textMuted, marginBottom: 4 },
  meta: { color: theme.textMuted, marginBottom: 2 },
  small: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
  tipLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  modifierLine: { fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: '700' },
  modifierLineHarder: { color: theme.warning },
  modifierLineEasier: { color: theme.ok },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTitle: { color: theme.text, fontWeight: '900', letterSpacing: 0.5 },
  topMeta: { color: theme.textMuted, marginTop: 4, fontSize: 12, ...monoData },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conditionText: { color: theme.text, fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  badgeOk: { borderColor: theme.okBorder, backgroundColor: theme.okBg },
  badgeWarn: { borderColor: theme.warningBorder, backgroundColor: theme.warningBg },
  badgeCrit: { borderColor: '#e11d48aa', backgroundColor: theme.dangerBg },
  tacticalRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modeLabel: { color: theme.text, fontWeight: '900', marginBottom: 2, marginTop: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warn: { color: theme.warning, marginTop: 8, fontSize: 12 },
  muted: { color: theme.textMuted, marginBottom: 12 },
  threatRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.panelBorderFaint,
    backgroundColor: theme.panelBgSoft,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  pillCrit: {
    borderColor: '#fb7185',
    backgroundColor: '#450a0a44',
  },
  pillLabel: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase' },
  pillValue: { color: theme.paperBone, fontWeight: '700', marginTop: 4, fontSize: 12, ...monoData },
  debug: { color: theme.textMuted, fontSize: 11, marginTop: 6 },
  returnRow: { marginTop: 4, marginBottom: 8 },
  navMapRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  navMapBtn: { flex: 1, minWidth: 120 },
  navLine: { color: theme.text, fontWeight: '700', fontSize: 13, marginTop: 2 },
  navMeta: { color: theme.textMuted, fontSize: 12, marginTop: 4, ...monoData },
  navIntent: { color: theme.accent, fontSize: 12, fontWeight: '800', marginTop: 6 },
  repairStockLine: { fontSize: 14, fontWeight: '900', marginTop: 4, ...monoData },
  repairStockOk: { color: theme.ok },
  repairStockLow: { color: theme.warning },
  repairStockEmpty: { color: theme.warning },
  repairStockCrit: { color: theme.danger },
  repairHint: { marginTop: 8, lineHeight: 18 },
  intentSuggestCol: { marginTop: 10, gap: 8 },
});
