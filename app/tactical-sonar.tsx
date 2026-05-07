import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { TacticalSonarView } from '@/components/TacticalSonarView';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { buildSonarContacts } from '@/game/sonarContacts';
import { canPerformAreaScan, SCAN_AREA_COOLDOWN_MS } from '@/game/scanArea';
import { scanAvailable } from '@/game/discoveries';

export default function TacticalSonarScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const dive = state.dive;
  const mission = useMemo(
    () => state.missions.find((m) => m.id === dive?.missionId),
    [dive?.missionId, state.missions],
  );

  if (!dive || !mission || dive.status !== 'active') {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No active dive.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  const now = Date.now();
  const scanReady = canPerformAreaScan(dive, now);
  const scanCooldownLeftMs = Math.max(0, SCAN_AREA_COOLDOWN_MS - (now - dive.lastAreaScanAt));
  const contacts = useMemo(
    () => buildSonarContacts({ dive, mission, route: dive.currentRoute }),
    [dive, mission],
  );
  const hasActiveContact = Boolean(dive.pendingDiscovery);
  const scanAllowed = scanAvailable(state.submarine, state.crew);

  return (
    <ScreenShell scroll contentStyle={styles.pad}>
      <Text style={styles.h1}>Tactical Sonar</Text>
      <Text style={styles.quote}>
        Sensor Officer — “Tac Sonar shows nearby contacts, hazards, and terrain references.”
      </Text>
      {!dive.pendingDiscovery ? (
        <Text style={styles.hint}>
          No active external contact. Recommend a scan sweep when the array is ready.
        </Text>
      ) : null}

      <TacticalSonarView contacts={contacts} route={dive.currentRoute} />

      <View style={styles.contactList}>
        <Text style={styles.listTitle}>Returns</Text>
        <ScrollView style={styles.scroll} nestedScrollEnabled>
          {contacts.map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={styles.rowTitle}>
                {c.label}
                {c.source === 'ambient' ? ' · passive' : ''}
              </Text>
              <Text style={styles.rowMeta}>
                {Math.round(c.bearingDeg)}° · {Math.round(c.distanceMeters)}m · {c.risk} risk
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <PrimaryButton
        title={scanReady ? 'Scan Area' : `Scan cooling (${Math.max(1, Math.ceil(scanCooldownLeftMs / 1000))}s)`}
        disabled={!scanReady || !!dive.pendingDiscovery || !scanAllowed}
        onPress={() => dispatch({ type: 'SCAN_AREA', now: Date.now() })}
      />
      <PrimaryButton
        title="View external contact"
        variant="ghost"
        disabled={!hasActiveContact}
        onPress={() => router.back()}
      />
      <PrimaryButton title="Close" variant="ghost" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 24 },
  h1: { color: theme.text, fontWeight: '900', fontSize: 20, marginBottom: 8 },
  quote: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  hint: { color: theme.accent, fontSize: 12, marginBottom: 12, fontWeight: '700' },
  muted: { color: theme.textMuted, marginBottom: 12 },
  contactList: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(3, 8, 18, 0.9)',
    maxHeight: 200,
  },
  listTitle: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  scroll: { maxHeight: 160 },
  row: { marginBottom: 8 },
  rowTitle: { color: theme.text, fontWeight: '700', fontSize: 13 },
  rowMeta: { color: theme.textMuted, fontSize: 11, fontFamily: theme.fontMono },
});
