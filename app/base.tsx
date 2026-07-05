import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { SUBMARINE_IDENTITY } from '@/data/submarine';
import { useGame } from '@/context/GameContext';
import { totalRepairSupplyUnits } from '@/game/baseStorage';
import { moduleLevel } from '@/game/submarineStats';
import { formatThreatLabel, threatForHigherIsBetter } from '@/game/threatLevels';
import { getSubmarineStatus } from '@/game/statusHelpers';

export default function BaseScreen() {
  const router = useRouter();
  const { state } = useGame();
  const { resources, submarine, crew, baseStorage, commander } = state;
  const nu = NARRATIVE_UI.base;
  const hired = crew.filter((c) => c.hired);
  const subStatus = getSubmarineStatus(submarine);
  const hullBand = formatThreatLabel(threatForHigherIsBetter(submarine.hullIntegrityPercent));

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.7}>
      <SectionHeader title={nu.title} subtitle={nu.subtitle} />
      <Text style={styles.commanderLine}>{nu.commanderLine(commander.name, commander.title)}</Text>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Resources</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.scrap}
          label="Scrap"
          value={`×${resources.scrap}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Research Data"
          value={`×${resources.researchData}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Relics in vault"
          value={`×${state.treasureInventory.length}`}
        />
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>{nu.storageCardTitle}</Text>
        <Text style={styles.meta}>
          Scrap {baseStorage.scrap} · Research {baseStorage.researchData} · Treasures{' '}
          {baseStorage.treasures.length} · Artifacts {baseStorage.artifacts} · Samples{' '}
          {baseStorage.samples}
        </Text>
        <Text style={styles.meta}>
          Repair supply units staged: {totalRepairSupplyUnits(baseStorage)}
        </Text>
        <PrimaryButton
          title="Open Base Storage"
          variant="ghost"
          onPress={() => router.push('/base-storage' as never)}
        />
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>
          {SUBMARINE_IDENTITY.displayName} · condition
        </Text>
        <Text style={styles.statusLine}>{subStatus.label}</Text>
        <Text style={styles.meta}>
          Hull {Math.round(submarine.hullIntegrityPercent)}% · band {hullBand}
        </Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Modules</Text>
        {submarine.modules.map((m) => (
          <View key={m.id} style={styles.moduleRow}>
            <Text style={styles.moduleName}>{m.name}</Text>
            <Text style={styles.moduleMeta}>
              L{m.level}/{m.maxLevel}
              {m.type === 'hull' || m.type === 'sonar'
                ? ` · focus ${m.type === 'hull' ? 'integrity' : 'survey'}`
                : ''}
            </Text>
          </View>
        ))}
        <Text style={styles.hint}>
          Hull module L{moduleLevel(submarine, 'hull')} · Sonar L{moduleLevel(submarine, 'sonar')}
        </Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Captain’s Log</Text>
        <Text style={styles.meta}>XO narrative summaries of recent trials and standing orders.</Text>
        <PrimaryButton
          title="Open Captain’s Log"
          variant="ghost"
          onPress={() => router.push('/captains-log' as never)}
        />
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Crew status</Text>
        <Text style={styles.meta}>
          Condition · morale {Math.round(state.crewState.morale)} · stress{' '}
          {Math.round(state.crewState.stress)} · discipline {Math.round(state.crewState.discipline)} ·
          readiness {Math.round(state.crewState.readiness)}
        </Text>
        {hired.length === 0 ? (
          <Text style={styles.muted}>No hired crew — open Crew to recruit.</Text>
        ) : (
          hired.map((c) => (
            <View key={c.id} style={styles.crewRow}>
              <Text style={styles.crewName}>
                {c.name} · {c.role}
              </Text>
              <Text style={styles.meta}>
                {c.assignedToDive ? 'On dive roster' : 'Standby at base'}
              </Text>
            </View>
          ))
        )}
      </PanelCard>
      <Text style={styles.navLabel}>Operations</Text>
      <PrimaryButton title="Repair Dock" onPress={() => router.push('/repair-dock' as never)} />
      <PrimaryButton
        title="Command Briefings"
        variant="ghost"
        onPress={() => router.push('/command-briefings' as never)}
      />
      <PrimaryButton
        title="Campaigns / Service Record"
        variant="ghost"
        onPress={() => router.push('/campaigns' as never)}
      />
      <PrimaryButton title="Trial schedule" onPress={() => router.push('/mission-select')} />
      <PrimaryButton title="Upgrades" variant="ghost" onPress={() => router.push('/upgrades')} />
      <PrimaryButton title="Crew" variant="ghost" onPress={() => router.push('/crew')} />
      <PrimaryButton title="Inventory" variant="ghost" onPress={() => router.push('/inventory')} />
      {state.dive?.status === 'active' ? (
        <PrimaryButton title="Resume Dive" variant="ghost" onPress={() => router.push('/dive')} />
      ) : null}
      {state.dive && state.dive.status !== 'active' ? (
        <PrimaryButton
          title="Open Trial Report"
          variant="ghost"
          onPress={() => router.push('/mission-result')}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  commanderLine: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  consoleCard: {
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
  },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 10 },
  statusLine: { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: theme.textMuted },
  moduleRow: { marginBottom: 8 },
  moduleName: { color: theme.text, fontWeight: '600' },
  moduleMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  hint: { color: theme.textMuted, marginTop: 6, fontSize: 12 },
  crewRow: { marginBottom: 10 },
  crewName: { color: theme.text, fontWeight: '600' },
  navLabel: {
    color: theme.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
});
