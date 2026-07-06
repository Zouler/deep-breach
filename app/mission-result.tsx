import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { EXPERIMENTAL_TRIAL_SET } from '@/data/experimentalTrials';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { useGame } from '@/context/GameContext';
import {
  DEAD_BEACON_DECISION_OPTIONS,
  isDeadBeaconDataDecisionPending,
  type DeadBeaconDataDecisionChoice,
} from '@/game/deadBeaconDecision';
import type { CargoTransferSummary } from '@/types';

function transferLines(p: CargoTransferSummary): string[] {
  const lines: string[] = [`Scrap +${p.scrap}`];
  if ((p.missionCompletionBonusScrap ?? 0) > 0) {
    lines.push(`  ↳ Trial completion bonus +${p.missionCompletionBonusScrap}`);
  }
  lines.push(
    `Research Data +${p.researchData}`,
    `Treasures +${p.treasures}`,
    `Artifacts +${p.artifacts}`,
    `Samples +${p.samples}`,
  );
  const repairUnits =
    p.hullPatchKits + p.pressureSealant + p.emergencyBrace + p.oxygenCanisters;
  lines.push(`Repair supply items +${repairUnits} (patches/sealant/brace/canisters)`);
  return lines;
}

function trialHeadline(outcome: {
  success: boolean;
  trialAborted?: boolean;
}): { text: string; color: string } {
  const tr = NARRATIVE_UI.trialReport;
  if (outcome.success) return { text: tr.completed, color: theme.ok };
  if (outcome.trialAborted) return { text: tr.aborted, color: theme.warning };
  return { text: tr.failed, color: theme.danger };
}

export default function MissionResultScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const outcome = state.lastMissionOutcome;
  const tr = NARRATIVE_UI.trialReport;

  if (!outcome) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>{tr.noReport}</Text>
        <PrimaryButton title="Back to base" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  const { text: headlineText, color: headlineColor } = trialHeadline(outcome);
  const sec = tr.sections;
  const catastrophic = Boolean(outcome.catastrophicFailure);
  const dataDecisionPending =
    isDeadBeaconDataDecisionPending(state) &&
    Boolean(outcome.storyDebrief?.reconComplete) &&
    !outcome.storyDebrief?.dataDecisionResolved;
  const dataDecisionResolved = Boolean(outcome.storyDebrief?.dataDecisionResolved);

  const handleDataDecision = (choice: DeadBeaconDataDecisionChoice) => {
    dispatch({ type: 'RESOLVE_DEAD_BEACON_DATA_DECISION', choice });
  };

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.74}>
      <Text style={styles.docTitle}>{tr.docTitle}</Text>
      <Text style={[styles.title, { color: catastrophic ? theme.danger : headlineColor }]}>
        {catastrophic ? 'VESSEL LOST' : headlineText}
      </Text>
      <Text style={styles.sub}>{outcome.missionName}</Text>
      <Text style={styles.vesselMeta}>{tr.vesselLine}</Text>

      {!catastrophic ? (
        <PanelCard style={[styles.consoleCard, styles.heroCard]}>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>
                {Math.min(100, Math.round((outcome.depthReachedM / outcome.targetDepthM) * 100))}%
              </Text>
              <Text style={styles.heroLabel}>Depth reached</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>
                {outcome.rewards.scrap + (outcome.missionCompletionBonusScrap ?? 0)}
              </Text>
              <Text style={styles.heroLabel}>Scrap earned</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{outcome.repairSuppliesConsumed}</Text>
              <Text style={styles.heroLabel}>Close calls sealed</Text>
            </View>
            {typeof outcome.oxygenRemainingPercent === 'number' ? (
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{outcome.oxygenRemainingPercent}%</Text>
                <Text style={styles.heroLabel}>O₂ remaining</Text>
              </View>
            ) : null}
          </View>
        </PanelCard>
      ) : null}

      {catastrophic ? (
        <PanelCard style={[styles.consoleCard, styles.failureCard]}>
          <Text style={styles.failureKicker}>{outcome.failureTitle ?? 'DBX-07 LOST'}</Text>
          <Text style={styles.failureBody}>
            {outcome.causeSummary ??
              'DBX-07 failed to recover from catastrophic structural damage. The vessel was lost beneath operational depth.'}
          </Text>
          <View style={styles.failureStatsRow}>
            <Text style={styles.failureStat}>Final depth: {outcome.finalDepth ?? outcome.depthReachedM}m</Text>
            <Text style={styles.failureStat}>Hull: {outcome.finalHull ?? '—'}%</Text>
            <Text style={styles.failureStat}>O₂: {outcome.finalOxygen ?? '—'}%</Text>
          </View>
          <View style={styles.signalLostBox}>
            <Text style={styles.signalLostTitle}>SIGNAL LOST</Text>
            <Text style={styles.signalLostLine}>No recovery beacon detected.</Text>
            <Text style={styles.signalLostLine}>No surface telemetry received.</Text>
          </View>
        </PanelCard>
      ) : null}

      {catastrophic ? (
        <PanelCard style={[styles.consoleCard, styles.memorialCard]}>
          <Text style={styles.memorialTitle}>In Memoriam</Text>
          <Text style={styles.memorialName}>Commander Phillip Roberts</Text>
          <Text style={styles.memorialRole}>Commanding Officer, DBX-07 “Deep Breach”</Text>
          <Text style={styles.memorialLine}>
            Fell in the line of duty during DBX Experimental Trials.
          </Text>
          <Text style={styles.memorialNotice}>
            Official notice delivered under DBX Program Command authority.
          </Text>
        </PanelCard>
      ) : null}

      {outcome.trialDebrief &&
      outcome.missionId &&
      EXPERIMENTAL_TRIAL_SET.has(outcome.missionId) ? (
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>{tr.sections.certification}</Text>
          {outcome.trialDebrief.certificationLine ? (
            <Text style={styles.line}>{outcome.trialDebrief.certificationLine}</Text>
          ) : (
            <Text style={styles.line}>DBX Certification progress updated.</Text>
          )}
          {outcome.trialDebrief.firstClearRewards ? (
            <>
              <Text style={[styles.line, styles.rewardHead]}>Rewards (first clear)</Text>
              <Text style={styles.line}>
                +{outcome.trialDebrief.firstClearRewards.scrap} Scrap
              </Text>
              <Text style={styles.line}>
                +{outcome.trialDebrief.firstClearRewards.researchData} Research Data
              </Text>
              <Text style={styles.line}>
                +{outcome.trialDebrief.firstClearRewards.hullPatchKits} Hull Patch Kit
                {outcome.trialDebrief.firstClearRewards.hullPatchKits === 1 ? '' : 's'}
              </Text>
              <Text style={styles.line}>
                +{outcome.trialDebrief.firstClearRewards.pressureSealant} Pressure Sealant
              </Text>
            </>
          ) : null}
          {outcome.trialDebrief.unlockedTrialName ? (
            <Text style={[styles.line, styles.unlockLine]}>
              Unlocked: {outcome.trialDebrief.unlockedTrialName}
            </Text>
          ) : null}
        </PanelCard>
      ) : null}

      {outcome.storyDebrief ? (
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Operational debrief</Text>
          <Text style={[styles.line, styles.unlockLine]}>{outcome.storyDebrief.headline}</Text>
          <Text style={styles.line}>{outcome.storyDebrief.summaryLine}</Text>
          {!outcome.storyDebrief.reconComplete &&
          outcome.storyDebrief.firstContactComplete === undefined ? (
            <Text style={[styles.line, styles.mutedNote]}>
              Standoff scan and depth requirements were not fully met. Command may re-task the
              reconnaissance package.
            </Text>
          ) : null}
          {outcome.storyDebrief.firstContactComplete ? (
            <Text style={[styles.line, styles.unlockLine, { marginTop: 8 }]}>
              First anomaly contact logged — data restricted pending Command review.
            </Text>
          ) : null}
          {outcome.storyDebrief.firstContactComplete &&
          !state.storyFlags?.includes('first_contact_analysis') ? (
            <Text style={[styles.line, styles.mutedNote]}>
              Return to base — open First Contact Analysis under Operational assignments to authorize
              the next preparation step.
            </Text>
          ) : null}
          {outcome.storyDebrief.monitoringComplete ? (
            <Text style={[styles.line, styles.unlockLine, { marginTop: 8 }]}>
              Passive monitoring logged — phenomenon confirmed recurring outside DBX-03 zone.
            </Text>
          ) : null}
          {dataDecisionResolved && outcome.storyDebrief.dataDecisionHeadline ? (
            <>
              <Text style={[styles.line, styles.unlockLine, { marginTop: 10 }]}>
                {outcome.storyDebrief.dataDecisionHeadline}
              </Text>
              <Text style={styles.line}>{outcome.storyDebrief.dataDecisionSummary}</Text>
            </>
          ) : null}
        </PanelCard>
      ) : null}

      {dataDecisionPending ? (
        <PanelCard style={[styles.consoleCard, styles.decisionCard]}>
          <Text style={styles.cardTitle}>Data disposition — command review</Text>
          <Text style={styles.line}>
            Recon confirms the DBX-03 signal is active, but telemetry is incomplete and partially
            corrupted. Choose how DBX-07 handles the data package before standing down from Dead
            Beacon tasking.
          </Text>
          <Text style={[styles.line, styles.mutedNote]}>
            We have enough proof to escalate, but not enough context to understand what we found.
          </Text>
          {DEAD_BEACON_DECISION_OPTIONS.map((option) => (
            <PrimaryButton
              key={option.id}
              title={option.label}
              variant="ghost"
              onPress={() => handleDataDecision(option.id)}
              style={styles.decisionOption}
            />
          ))}
        </PanelCard>
      ) : null}

      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>{sec.pressure}</Text>
        <Text style={styles.line}>
          Depth reached: {outcome.depthReachedM}m / {outcome.targetDepthM}m
        </Text>
        <Text style={styles.line}>
          Dominant route: {outcome.dominantRoute.replace(/_/g, ' ')}
        </Text>
        {typeof outcome.oxygenRemainingPercent === 'number' ? (
          <Text style={styles.line}>Oxygen remaining: {outcome.oxygenRemainingPercent}%</Text>
        ) : null}
      </PanelCard>

      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>{sec.hull}</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.crack}
          label="Approx hull stress"
          value={`${outcome.hullDamageTakenApprox}%`}
        />
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
        <Text style={styles.line}>
          Cargo (end): {outcome.cargoUsedApprox} / {outcome.cargoLimit}
        </Text>
      </PanelCard>

      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>{sec.materials}</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.scrap}
          label="Scrap recovered (during trial)"
          value={`×${outcome.rewards.scrap}`}
        />
        {(outcome.missionCompletionBonusScrap ?? 0) > 0 ? (
          <IconLabelRow
            icon={GAME_ASSETS.icons.scrap}
            label="Trial completion bonus"
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
        <Text style={styles.line}>
          Recoveries completed (passive): {outcome.discoveriesResolvedPassive}
        </Text>
      </PanelCard>

      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>{sec.systemsValidated}</Text>
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
      </PanelCard>

      {outcome.storageTransferPreview ? (
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>{sec.transfer}</Text>
          <Text style={styles.line}>
            On return, expedition cargo moves into Base Storage (one transfer per trial).
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
        <Text style={styles.cardTitle}>{sec.contacts}</Text>
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
        <Text style={styles.cardTitle}>{sec.log}</Text>
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
        title={catastrophic ? 'Return to Base / Command Hub' : 'Return to Base'}
        disabled={dataDecisionPending}
        onPress={() => {
          dispatch({ type: 'RETURN_TO_BASE' });
          router.replace('/base');
        }}
      />
      {dataDecisionPending ? (
        <Text style={styles.mutedNote}>
          Select a data disposition option before returning to base.
        </Text>
      ) : null}
      {catastrophic && outcome.missionId ? (
        <PrimaryButton
          title="Retry Trial"
          variant="danger"
          onPress={() => {
            dispatch({ type: 'RETRY_TRIAL', missionId: outcome.missionId! });
            router.replace('/dive');
          }}
        />
      ) : null}
      {catastrophic ? (
        <PrimaryButton
          title="Review Captain’s Log"
          variant="ghost"
          onPress={() => router.push('/captains-log')}
        />
      ) : null}
      <PrimaryButton
        title="Open trial schedule"
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
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
  },
  heroCard: {
    borderColor: theme.accent,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroStat: {
    flexGrow: 1,
    minWidth: 76,
  },
  heroValue: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  heroLabel: {
    color: theme.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  failureCard: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
  },
  failureKicker: {
    color: theme.danger,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  failureBody: { color: theme.text, fontSize: 14, lineHeight: 22 },
  failureStatsRow: { marginTop: 10, gap: 4 },
  failureStat: { color: theme.textMuted, fontSize: 12, fontFamily: theme.fontMono },
  signalLostBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(127, 29, 29, 0.14)',
    padding: 12,
  },
  signalLostTitle: {
    color: theme.danger,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  signalLostLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
  memorialCard: {
    borderColor: 'rgba(248, 113, 113, 0.22)',
    backgroundColor: 'rgba(0, 5, 14, 0.94)',
  },
  memorialTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  memorialName: { color: theme.text, fontSize: 18, fontWeight: '900' },
  memorialRole: { color: theme.textMuted, marginTop: 4, fontFamily: theme.fontMono, fontSize: 12 },
  memorialLine: { color: theme.text, marginTop: 10, fontSize: 13, lineHeight: 20 },
  memorialNotice: {
    color: theme.textMuted,
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  docTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { color: theme.textMuted, marginBottom: 6 },
  vesselMeta: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  rewardHead: { color: theme.accent, fontWeight: '700', marginTop: 8 },
  unlockLine: { color: theme.ok, fontWeight: '700', marginTop: 8 },
  mutedNote: { color: theme.textMuted, fontStyle: 'italic', marginTop: 8 },
  decisionCard: {
    borderColor: theme.warningBorder,
    backgroundColor: theme.warningBg,
  },
  decisionOption: { marginTop: 10 },
  decisionSummary: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  decisionDivider: {
    height: 1,
    backgroundColor: theme.panelBorderFaint,
    marginVertical: 10,
  },
  line: { color: theme.textMuted, marginBottom: 4 },
  event: { color: theme.text, marginBottom: 4 },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
});
