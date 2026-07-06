import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { CAMPAIGNS, getCampaignById } from '@/data/campaigns';
import { DBX_FUTURE_ACT_VARIANTS, DBX_PROTOTYPE_LORE } from '@/data/dbxProgramLore';
import { SUBMARINE_IDENTITY } from '@/data/submarine';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { EXPERIMENTAL_TRIAL_MISSION_IDS } from '@/data/experimentalTrials';
import {
  experimentalTrialsCompletedCount,
  getEffectiveTrialStatus,
} from '@/game/trialProgression';

export default function CampaignsScreen() {
  const router = useRouter();
  const { state } = useGame();
  const id = SUBMARINE_IDENTITY;
  const trialsDone = experimentalTrialsCompletedCount(state);
  const trialsTotal = EXPERIMENTAL_TRIAL_MISSION_IDS.length;
  const completedNames = EXPERIMENTAL_TRIAL_MISSION_IDS.filter(
    (tid) => state.trialProgressByMissionId?.[tid]?.status === 'completed',
  )
    .map((tid) => state.missions.find((m) => m.id === tid)?.name ?? tid)
    .filter(Boolean);
  const nextTrialId = EXPERIMENTAL_TRIAL_MISSION_IDS.find((tid) => {
    const st = getEffectiveTrialStatus(state, tid);
    return st === 'available' || st === 'failed_retry_available';
  });
  const nextTrialName = nextTrialId
    ? state.missions.find((m) => m.id === nextTrialId)?.name
    : undefined;

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.commandHubBackground} backgroundScrimOpacity={0.6}>
      <Text style={styles.title}>Campaigns / Service Record</Text>
      <Text style={styles.sub}>
        Commander {state.commander.name} · {state.commander.title}
      </Text>
      <Text style={styles.vesselLine}>{id.displayName}</Text>
      <Text style={styles.meta}>
        {id.className} · {id.programName} · {id.currentVariant} variant
      </Text>
      <Text style={styles.meta}>
        Current focus:{' '}
        {getCampaignById(state.commander.currentActId)?.name ??
          state.commander.currentActId.replace(/_/g, ' ')}
      </Text>
      <PrimaryButton
        title="Review assignment memorandum"
        variant="ghost"
        onPress={() => router.push('/assignment-memo' as never)}
      />
      <PanelCard style={styles.card}>
        <Text style={styles.name}>Experimental Trials (Act 1)</Text>
        <Text style={styles.desc}>
          Certification progress: {trialsDone} / {trialsTotal} trials complete.
        </Text>
        {completedNames.length > 0 ? (
          <Text style={styles.desc}>
            Completed: {completedNames.join(', ')}.
          </Text>
        ) : (
          <Text style={styles.desc}>No trials certified yet.</Text>
        )}
        {trialsDone >= trialsTotal ? (
          <Text style={styles.desc}>
            Experimental certification track complete for the current trial set.
          </Text>
        ) : nextTrialName ? (
          <Text style={styles.desc}>Next trial: {nextTrialName}.</Text>
        ) : (
          <Text style={styles.desc}>Continue trials from the Trial schedule screen.</Text>
        )}
      </PanelCard>
      {CAMPAIGNS.map((c) => (
        <PanelCard key={c.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{c.name}</Text>
            <Text
              style={[
                styles.badge,
                c.status === 'active' ? styles.badgeActive : styles.badgeLocked,
              ]}
            >
              {c.status === 'active' ? 'Active' : 'Locked'}
            </Text>
          </View>
          <Text style={styles.subtitle}>{c.subtitle}</Text>
          <Text style={styles.desc}>{c.description}</Text>
        </PanelCard>
      ))}

      <Text style={styles.sectionLabel}>Program archives (optional)</Text>
      <Text style={styles.sectionHint}>
        Prior DBX hulls — background only; not required for trials.
      </Text>
      <PanelCard style={styles.loreCard}>
        {DBX_PROTOTYPE_LORE.map((entry) => (
          <View key={entry.designation} style={styles.loreRow}>
            <Text style={styles.loreDesignation}>{entry.designation}</Text>
            <Text style={styles.loreSummary}>{entry.summary}</Text>
          </View>
        ))}
      </PanelCard>

      <Text style={styles.sectionLabel}>Reserved retrofit designations</Text>
      <Text style={styles.sectionHint}>
        Classified retrofit designations — authorization pending Command review.
      </Text>
      <PanelCard style={styles.loreCard}>
        {DBX_FUTURE_ACT_VARIANTS.map((row) => (
          <Text key={row.act} style={styles.futureLine}>
            • {row.label}
          </Text>
        ))}
      </PanelCard>

      <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.text, fontSize: 22, fontWeight: '900', marginBottom: 6 },
  sub: { color: theme.text, fontWeight: '700', marginBottom: 4 },
  vesselLine: { color: theme.accent, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  meta: { color: theme.textMuted, marginBottom: 6, fontSize: 13 },
  sectionLabel: {
    color: theme.text,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  sectionHint: { color: theme.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  card: { marginBottom: 10, borderColor: theme.panelBorder, backgroundColor: theme.panelBg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { color: theme.text, fontWeight: '800', flex: 1 },
  subtitle: { color: theme.textMuted, fontSize: 12, marginTop: 6 },
  desc: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginTop: 8 },
  badge: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  badgeActive: { color: '#86efac' },
  badgeLocked: { color: theme.textMuted },
  loreCard: {
    marginBottom: 14,
    borderColor: '#33415588',
    backgroundColor: theme.panelBgSoft,
  },
  loreRow: { marginBottom: 12 },
  loreDesignation: { color: theme.text, fontWeight: '800', marginBottom: 2 },
  loreSummary: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
  futureLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
});
