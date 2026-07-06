import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CommandTile } from '@/components/CommandTile';
import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { monoData, theme } from '@/constants/theme';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { SUBMARINE_IDENTITY } from '@/data/submarine';
import { useGame } from '@/context/GameContext';
import { totalRepairSupplyUnits } from '@/game/baseStorage';
import { isFirstContactAnalysisPending } from '@/game/firstContactAftermath';
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
  const firstContactReviewPending = isFirstContactAnalysisPending(state);

  return (
    <ScreenShell
      scroll
      backgroundImage={GAME_ASSETS.commandHubBackground}
      backgroundScrimOpacity={0.58}
      scanlineOverlay
    >
      <SectionHeader
        title={nu.title}
        subtitle={nu.subtitle}
        kicker="DBX-07 · Command Hub"
      />
      {firstContactReviewPending ? (
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>First Contact — Command Review</Text>
          <Text style={styles.meta}>
            Restricted telemetry from the DBX-03 return dive requires analysis authorization.
            Open Operational assignments to review findings and authorize the next preparation step.
          </Text>
          <PrimaryButton
            title="Open First Contact Analysis"
            onPress={() =>
              router.push({
                pathname: '/story-mission-briefing' as never,
                params: { missionId: 'first_contact_analysis' },
              })
            }
          />
        </PanelCard>
      ) : null}
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
        <Text style={styles.metaMono}>
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
      <View style={styles.commandGrid}>
        <CommandTile
          title="Repair Dock"
          subtitle="Hull & supply staging"
          emphasis
          onPress={() => router.push('/repair-dock' as never)}
        />
        <CommandTile
          title="Trial schedule"
          subtitle="Experimental & operational"
          emphasis
          onPress={() => router.push('/mission-select')}
        />
        <CommandTile
          title="Command Briefings"
          subtitle="Department status"
          onPress={() => router.push('/command-briefings' as never)}
        />
        <CommandTile
          title="Upgrades"
          subtitle="Module refit"
          onPress={() => router.push('/upgrades')}
        />
        <CommandTile
          title="Crew"
          subtitle="Roster & assignments"
          onPress={() => router.push('/crew')}
        />
        <CommandTile
          title="Inventory"
          subtitle="Expedition loadout"
          onPress={() => router.push('/inventory')}
        />
        <CommandTile
          title="Service Record"
          subtitle="Campaign overview"
          onPress={() => router.push('/campaigns' as never)}
        />
        {state.dive?.status === 'active' ? (
          <CommandTile
            title="Resume Dive"
            subtitle="Active trial in progress"
            emphasis
            onPress={() => router.push('/dive')}
          />
        ) : null}
        {state.dive && state.dive.status !== 'active' ? (
          <CommandTile
            title="Trial Report"
            subtitle="Debrief pending"
            onPress={() => router.push('/mission-result')}
          />
        ) : null}
      </View>
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
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
  },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 10 },
  statusLine: { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: theme.textMuted },
  metaMono: { color: theme.textMuted, ...monoData, fontSize: 13 },
  moduleRow: { marginBottom: 8 },
  moduleName: { color: theme.text, fontWeight: '600' },
  moduleMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  hint: { color: theme.textMuted, marginTop: 6, fontSize: 12 },
  crewRow: { marginBottom: 10 },
  crewName: { color: theme.text, fontWeight: '600' },
  navLabel: {
    color: theme.phosphorAmber,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 10,
    fontFamily: theme.fontMono,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
});
