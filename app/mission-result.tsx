import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import type { CargoTransferSummary } from '@/types';

function transferLines(p: CargoTransferSummary): string[] {
  const lines: string[] = [`Scrap +${p.scrap}`];
  if ((p.missionCompletionBonusScrap ?? 0) > 0) {
    lines.push(`  ↳ Mission completion bonus +${p.missionCompletionBonusScrap}`);
  }
  lines.push(
    `Research Data +${p.researchData}`,
    `Treasures +${p.treasures}`,
    `Artifacts +${p.artifacts}`,
    `Samples +${p.samples}`,
  );
  const repairUnits =
    p.hullPatchKits +
    p.pressureSealant +
    p.emergencyBrace +
    p.oxygenCanisters;
  lines.push(`Repair supply items +${repairUnits} (patches/sealant/brace/canisters)`);
  return lines;
}

export default function MissionResultScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const outcome = state.lastMissionOutcome;

  if (!outcome) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No mission debrief available.</Text>
        <PrimaryButton title="Back to base" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.74}>
      <Text style={[styles.title, { color: outcome.success ? theme.ok : theme.danger }]}>
        {outcome.success ? 'Mission Complete' : 'Mission Failure'}
      </Text>
      <Text style={styles.sub}>{outcome.missionName}</Text>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.line}>Depth reached: {outcome.depthReachedM}m / {outcome.targetDepthM}m</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.scrap}
          label="Scrap recovered (during dive)"
          value={`×${outcome.rewards.scrap}`}
        />
        {(outcome.missionCompletionBonusScrap ?? 0) > 0 ? (
          <IconLabelRow
            icon={GAME_ASSETS.icons.scrap}
            label="Mission completion bonus"
            value={`+${outcome.missionCompletionBonusScrap} Scrap`}
            emphasize
          />
        ) : null}
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Research recovered"
          value={`×${outcome.rewards.researchData}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Relics secured"
          value={`×${outcome.treasures.length}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.crack}
          label="Approx hull stress"
          value={`${outcome.hullDamageTakenApprox}%`}
        />
        <Text style={styles.line}>Dominant route: {outcome.dominantRoute.replace(/_/g, ' ')}</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.scanArea}
          label="Area scans"
          value={`×${outcome.scansPerformed}`}
        />
        <Text style={styles.line}>Contacts from scans: {outcome.discoveriesFromScan}</Text>
        <Text style={styles.line}>Passive contacts: {outcome.discoveriesFromPassive}</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.oxygenCanister}
          label="Emergency oxygen uses"
          value={`×${outcome.emergencyOxygenUses}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.oxygenCanister}
          label="Oxygen canister uses"
          value={`×${outcome.oxygenCanisterUses}`}
        />
        <Text style={styles.line}>Crew comms logged: {outcome.crewMessageCount}</Text>
        <Text style={styles.line}>
          Cargo (end): {outcome.cargoUsedApprox} / {outcome.cargoLimit}
        </Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Repair supplies consumed"
          value={`×${outcome.repairSuppliesConsumed}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Repair supplies recovered"
          value={`×${outcome.repairSuppliesRecovered}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Treasures (tally)"
          value={`×${outcome.treasuresRecovered}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Artifacts (tally)"
          value={`×${outcome.artifactsRecovered}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Samples (tally)"
          value={`×${outcome.samplesRecovered}`}
        />
        <Text style={styles.line}>Recoveries completed (scan): {outcome.discoveriesResolvedViaScan}</Text>
        <Text style={styles.line}>Recoveries completed (passive): {outcome.discoveriesResolvedPassive}</Text>
      </PanelCard>
      {outcome.storageTransferPreview ? (
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Cargo transferred to Base Storage</Text>
          <Text style={styles.line}>
            On return, expedition cargo is moved into Base Storage (one transfer per mission).
          </Text>
          {transferLines(outcome.storageTransferPreview).map((line, idx) => (
            <Text key={`tr${idx}`} style={styles.line}>
              • {line}
            </Text>
          ))}
        </PanelCard>
      ) : null}
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Items & recoveries</Text>
        {outcome.itemsCollectedSummary.length === 0 ? (
          <Text style={styles.muted}>No extra supply notes.</Text>
        ) : (
          outcome.itemsCollectedSummary.map((line, idx) => (
            <Text key={`${idx}`} style={styles.line}>
              • {line}
            </Text>
          ))
        )}
        {outcome.cargoLeftBehindLines.length > 0 ? (
          <>
            <Text style={[styles.cardTitle, { marginTop: 12 }]}>Cargo left behind</Text>
            {outcome.cargoLeftBehindLines.map((line, idx) => (
              <Text key={`c${idx}`} style={styles.line}>
                • {line}
              </Text>
            ))}
          </>
        ) : null}
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>External discoveries</Text>
        <Text style={styles.line}>Attempted: {outcome.externalDiscoveriesAttempted}</Text>
        <Text style={styles.line}>Ignored: {outcome.externalDiscoveriesIgnored}</Text>
        <Text style={styles.line}>Hazards from recoveries: {outcome.externalDiscoveryHazardsTriggered}</Text>
        <Text style={styles.line}>Special notes: {outcome.externalDiscoverySpecialEvents}</Text>
        {outcome.externalDiscoverySummaries.length === 0 ? (
          <Text style={styles.muted}>No contacts logged.</Text>
        ) : (
          outcome.externalDiscoverySummaries.map((line, idx) => (
            <Text key={`${idx}`} style={styles.line}>
              • {line}
            </Text>
          ))
        )}
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Signals & events</Text>
        {outcome.events.length === 0 ? (
          <Text style={styles.muted}>Quiet log.</Text>
        ) : (
          outcome.events.map((e) => (
            <Text key={e.id} style={styles.event}>
              • {e.message}
            </Text>
          ))
        )}
      </PanelCard>
      <PrimaryButton
        title="Return to Base"
        onPress={() => {
          dispatch({ type: 'RETURN_TO_BASE' });
          router.replace('/base');
        }}
      />
      <PrimaryButton
        title="Start Another Mission"
        variant="ghost"
        onPress={() => {
          dispatch({ type: 'RETURN_TO_BASE' });
          router.replace('/mission-select');
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  consoleCard: {
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
  },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { color: theme.textMuted, marginBottom: 12 },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  line: { color: theme.textMuted, marginBottom: 4 },
  event: { color: theme.text, marginBottom: 4 },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
});
