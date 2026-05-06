import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { DiscoveryOutcomeModal } from '@/components/DiscoveryOutcomeModal';
import { DiscoveryPromptModal } from '@/components/DiscoveryPromptModal';
import { DiveEventStrip } from '@/components/DiveEventStrip';
import { DiveFlashBand } from '@/components/DiveFlashBand';
import { Gauge } from '@/components/Gauge';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SafeIcon } from '@/components/SafeIcon';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useDiveFeedback } from '@/hooks/useDiveFeedback';
import { useDiveTick } from '@/hooks/useDiveTick';
import { getDiveRoomThreat, type DiveRoomThreat } from '@/game/diveRoomThreat';
import { scanAvailable } from '@/game/discoveries';
import { getOfflineExplorationGuard } from '@/game/offlineGuards';
import { calculateMissionRisk } from '@/game/missionRisk';
import { ROUTE_OPTIONS } from '@/game/navigation';
import { computeCargoUsed, oxygenCanisterCount } from '@/game/cargo';
import {
  emergencyOxygenRestorePercent,
  oxygenCanisterRestorePercent,
} from '@/game/oxygen';
import { canPerformAreaScan, SCAN_AREA_COOLDOWN_MS } from '@/game/scanArea';
import { cargoCapacityUnits } from '@/game/submarineStats';
import type { DiveRoute } from '@/types';
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

  useDiveTick();
  const flashKind = useDiveFeedback(dive);

  const mission = useMemo(
    () => state.missions.find((m) => m.id === dive?.missionId),
    [dive?.missionId, state.missions],
  );

  if (!dive || !mission) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No active dive. Launch from Mission Select.</Text>
        <PrimaryButton title="Back to Base" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  const leaks = dive.rooms.reduce((n, r) => n + r.cracks.length, 0);
  const offlineGuard = getOfflineExplorationGuard(dive);
  const offlineOk = offlineGuard.canEnable;
  const riskScore = calculateMissionRisk(mission);
  const showTutorial = mission.id === 'shallow_descent' || dive.missionElapsedMs < 55_000;
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

  const criticalLeak = dive.rooms.some((r) =>
    r.cracks.some((c) => c.severity === 'critical'),
  );
  const leakSeverity = criticalLeak ? 'CRITICAL LEAK' : leaks > 0 ? 'ACTIVE LEAKS' : 'DRY BILGE';

  const roomAccent = (t: DiveRoomThreat) => {
    switch (t) {
      case 'safe':
        return styles.roomSafe;
      case 'warning':
        return styles.roomWarn;
      case 'danger':
        return styles.roomDanger;
      case 'critical':
        return styles.roomCrit;
      default:
        return null;
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScreenShell
        scroll
        contentStyle={styles.scrollPad}
        backgroundImage={GAME_ASSETS.diveScreenBg}
        backgroundScrimOpacity={0.68}
      >
        <SectionHeader
          title={dive.missionName}
          subtitle={`Contract ${dive.targetDepthM}m · mission risk ${riskScore}%`}
        />
        <View style={styles.cargoBar}>
          <Text style={styles.cargoText}>
            Cargo {cargoUsed} / {cargoCap}
          </Text>
          <PrimaryButton
            title="Inventory / cargo"
            variant="ghost"
            onPress={() => router.push('/inventory')}
          />
        </View>
        <View
          style={[
            styles.alertBar,
            criticalLeak ? styles.alertCrit : leaks > 0 ? styles.alertWarn : styles.alertOk,
          ]}
        >
          <View style={styles.alertHead}>
            {leaks > 0 ? (
              <SafeIcon source={GAME_ASSETS.icons.crack} size={26} style={styles.alertIcon} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.alertText}>{leakSeverity}</Text>
              <Text style={styles.alertMeta}>{leaks} crack(s) across compartments</Text>
            </View>
          </View>
        </View>
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
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.label}>Current depth</Text>
          <Text style={styles.hero}>{Math.round(dive.currentDepthM)} m</Text>
          <Gauge
            label="Hull integrity"
            value={dive.hullIntegrityPercent}
            tone={threatToGaugeTone(hullThreat)}
          />
          <View style={{ height: 10 }} />
          <Gauge
            label="Oxygen reserves"
            value={dive.oxygenPercent}
            tone={threatToGaugeTone(oxyThreat)}
          />
          <View style={{ height: 10 }} />
          <Gauge
            label="Water intrusion"
            value={dive.waterLevelPercent}
            tone={threatToGaugeTone(waterThreat)}
          />
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Navigation intent</Text>
          <Text style={styles.meta}>
            Active route: {dive.currentRoute.replace(/_/g, ' ')} — set how we descend and explore.
          </Text>
          {ROUTE_OPTIONS.map((r) => (
            <PrimaryButton
              key={r.id}
              title={`${r.label}${dive.currentRoute === r.id ? ' · active' : ''}`}
              variant={dive.currentRoute === r.id ? 'primary' : 'ghost'}
              onPress={() => dispatch({ type: 'SET_DIVE_ROUTE', route: r.id as DiveRoute })}
            />
          ))}
        </PanelCard>
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Sensors & life support</Text>
          <PrimaryButton
            title={
              scanReady
                ? 'Scan area'
                : `Scan cooling (${Math.max(1, Math.ceil(scanCooldownLeftMs / 1000))}s)`
            }
            iconLeft={GAME_ASSETS.icons.scanArea}
            iconLeftSize={26}
            disabled={!scanReady || !!dive.pendingDiscovery}
            onPress={() => dispatch({ type: 'SCAN_AREA', now: Date.now() })}
          />
          <PrimaryButton
            title={
              o2Canisters > 0
                ? `Use oxygen canister (~+${canisterRestore}%) · ${o2Canisters} on board`
                : `Emergency oxygen reserve (~+${o2RestoreHint}%) · ${dive.emergencyOxygenChargesRemaining} charge(s)`
            }
            variant="ghost"
            disabled={!canUseO2}
            onPress={() => dispatch({ type: 'USE_EMERGENCY_OXYGEN' })}
          />
          <Text style={styles.small}>
            Scan requests a sonar sweep for outside contacts. Bottled canisters are spent first;
            built-in emergency charges scale with your O₂ plant upgrades.
          </Text>
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Crew comms</Text>
          {(dive.crewMessages ?? []).length === 0 ? (
            <Text style={styles.muted}>Quiet channel — standing by.</Text>
          ) : (
            (dive.crewMessages ?? [])
              .slice(-4)
              .reverse()
              .map((m) => (
                <Text key={m.id} style={styles.crewLine}>
                  <Text
                    style={
                      m.severity === 'danger'
                        ? styles.crewDanger
                        : m.severity === 'warning'
                          ? styles.crewWarn
                          : styles.crewSpeaker
                    }
                  >
                    {m.speaker}:{' '}
                  </Text>
                  {m.text}
                </Text>
              ))
          )}
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Mission clock</Text>
          <Text style={styles.meta}>
            Elapsed: {Math.floor(dive.missionElapsedMs / 1000)}s /{' '}
            {Math.floor(dive.missionDurationMs / 1000)}s
          </Text>
          <Text style={styles.modeLabel}>
            {dive.continueExplorationWhileAway
              ? 'Mode: Offline Exploration (crew continues while away)'
              : 'Mode: Safe Pause (dive frozen while away)'}
          </Text>
          <Text style={styles.meta}>
            Safe Pause: depth, oxygen, hull, events, and rewards do not advance while the app is
            backgrounded. Offline Exploration simulates up to 4h away time using mission risk, depth,
            modules, and assigned crew — higher yield with real margin risk; emergency extraction can
            cut a run short with partial salvage.
          </Text>
        </PanelCard>
        {showTutorial ? (
          <PanelCard>
            <Text style={styles.tutorialTitle}>Briefing</Text>
            <Text style={styles.tutorialLine}>• Repair cracks before they worsen.</Text>
            <Text style={styles.tutorialLine}>
              • External contacts can bring rewards, but may damage the hull.
            </Text>
            <Text style={styles.tutorialLine}>• Scan before recovery to reduce risk.</Text>
            <Text style={styles.tutorialLine}>
              • Offline exploration requires a stable submarine.
            </Text>
          </PanelCard>
        ) : null}
        <PanelCard>
          <DiveEventStrip events={dive.eventLog} />
        </PanelCard>
        <PanelCard>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.cardTitle}>Continue Exploration While Away</Text>
              <Text style={styles.small}>
                Offline resolution uses mission risk, module levels, assigned crew, depth, hull, sonar
                and cargo capacity. Unfair hull breaches are clamped while away.
              </Text>
            </View>
            <Switch
              value={dive.continueExplorationWhileAway}
              onValueChange={(v) => dispatch({ type: 'SET_OFFLINE_EXPLORATION', value: v })}
              disabled={!offlineOk && !dive.continueExplorationWhileAway}
              thumbColor={dive.continueExplorationWhileAway ? theme.accent : '#334155'}
              trackColor={{ false: '#1e293b', true: '#155e75' }}
            />
          </View>
          {!offlineOk && !dive.continueExplorationWhileAway ? (
            <Text style={styles.warn}>{offlineGuard.userMessage}</Text>
          ) : null}
          {__DEV__ ? (
            <Text style={styles.debug}>DEV: {offlineGuard.debugDetails}</Text>
          ) : null}
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Rooms</Text>
          {dive.rooms.map((room) => {
            const tier = getDiveRoomThreat(room);
            return (
              <Pressable
                key={room.id}
                onPress={() => router.push(`/room/${room.id}`)}
                style={[styles.roomRow, roomAccent(tier)]}
              >
                {room.cracks.length > 0 ? (
                  <SafeIcon source={GAME_ASSETS.icons.crack} size={22} style={styles.roomCrackIcon} />
                ) : (
                  <View style={{ width: 22 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.meta}>
                    {tier.toUpperCase()} · {room.cracks.length} crack(s) ·{' '}
                    {
                      room.loot.filter(
                        (l) =>
                          !l.collected &&
                          (l.kind === 'repair_supply' || l.kind === 'emergency_supply'),
                      ).length
                    }{' '}
                    staged supply
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            );
          })}
        </PanelCard>
        <PrimaryButton
          title="Return to Base (abort)"
          variant="danger"
          onPress={() => {
            dispatch({ type: 'RETURN_TO_BASE' });
            router.replace('/base');
          }}
        />
      </ScreenShell>
      <DiveFlashBand kind={flashKind} />
      {dive.pendingDiscovery ? (
        <DiscoveryPromptModal
          visible
          discovery={dive.pendingDiscovery}
          scanAvailable={scanAvailable(state.submarine, state.crew)}
          onScan={() => dispatch({ type: 'SCAN_PENDING_DISCOVERY' })}
          onIgnore={() => dispatch({ type: 'RESOLVE_PENDING_DISCOVERY', choice: 'ignore' })}
          onAttempt={() => dispatch({ type: 'RESOLVE_PENDING_DISCOVERY', choice: 'attempt' })}
        />
      ) : null}
      <DiscoveryOutcomeModal
        visible={Boolean(dive.discoveryOutcomeBanner)}
        banner={dive.discoveryOutcomeBanner}
        onDismiss={() => dispatch({ type: 'DISMISS_DISCOVERY_OUTCOME' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.bg },
  scrollPad: { paddingTop: 6 },
  hero: { color: theme.accent, fontSize: 40, fontWeight: '800', marginBottom: 8 },
  label: { color: theme.textMuted, marginBottom: 4 },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  meta: { color: theme.textMuted, marginBottom: 2 },
  small: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
  roomRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    paddingLeft: 8,
    gap: 8,
  },
  roomCrackIcon: { marginRight: 2 },
  roomSafe: { borderLeftColor: '#15803d' },
  roomWarn: { borderLeftColor: '#ca8a04' },
  roomDanger: { borderLeftColor: '#ea580c' },
  roomCrit: { borderLeftColor: '#e11d48' },
  roomName: { color: theme.text, fontWeight: '600' },
  chev: { color: theme.textMuted, fontSize: 22 },
  warn: { color: theme.warning, marginTop: 8, fontSize: 12 },
  muted: { color: theme.textMuted, marginBottom: 12 },
  modeLabel: { color: theme.text, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  alertOk: { borderColor: '#14532d55', backgroundColor: '#052e1644' },
  alertWarn: { borderColor: '#b4530944', backgroundColor: '#451a0344' },
  alertCrit: { borderColor: '#e11d48aa', backgroundColor: '#450a0a66' },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: {},
  alertText: { color: theme.text, fontWeight: '800', letterSpacing: 1 },
  alertMeta: { color: theme.textMuted, marginTop: 4, fontSize: 12 },
  threatRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  pillCrit: {
    borderColor: '#fb7185',
    backgroundColor: '#450a0a44',
  },
  consoleCard: {
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
  },
  pillLabel: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase' },
  pillValue: { color: theme.text, fontWeight: '700', marginTop: 4, fontSize: 12 },
  tutorialTitle: {
    color: theme.accent,
    fontWeight: '800',
    marginBottom: 6,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tutorialLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  debug: { color: theme.textMuted, fontSize: 11, marginTop: 6 },
  crewLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  crewSpeaker: { color: theme.accent, fontWeight: '700' },
  crewWarn: { color: theme.warning, fontWeight: '700' },
  crewDanger: { color: theme.danger, fontWeight: '700' },
  cargoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  cargoText: { color: theme.text, fontWeight: '700' },
});
