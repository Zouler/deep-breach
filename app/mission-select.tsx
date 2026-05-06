import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { useGame } from '@/context/GameContext';
import { FIRST_TRIAL_MISSION_ID } from '@/game/storyNavigation';

export default function MissionSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ highlight?: string | string[] }>();
  const highlight = Array.isArray(params.highlight) ? params.highlight[0] : params.highlight;
  const { state, dispatch } = useGame();

  const ms = NARRATIVE_UI.missionSelect;

  return (
    <ScreenShell scroll>
      <SectionHeader title={ms.title} subtitle={ms.subtitle} />
      {highlight === FIRST_TRIAL_MISSION_ID ? (
        <Text style={styles.highlightBanner}>Next step: Pressure Trial I — launch when ready.</Text>
      ) : null}
      {state.missions.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => {
            if (state.dive?.status === 'active') return;
            if (state.dive) {
              router.push('/mission-result');
              return;
            }
            dispatch({ type: 'START_MISSION', missionId: m.id });
            router.push('/dive');
          }}
        >
          <PanelCard
            style={[styles.card, highlight === m.id ? styles.cardHighlight : null]}
          >
            <Text style={styles.name}>{m.name}</Text>
            {m.trialPurpose ? <Text style={styles.purpose}>{m.trialPurpose}</Text> : null}
            <Text style={styles.meta}>Target depth: {m.targetDepthM}m</Text>
            <Text style={styles.meta}>Est. duration: {m.durationMinutes} min (active)</Text>
            <Text style={styles.meta}>Risk: {m.risk}</Text>
            <Text style={styles.reward}>Expected: {m.expectedRewardsText}</Text>
          </PanelCard>
        </Pressable>
      ))}
      {state.dive?.status === 'active' ? (
        <Text style={styles.warn}>
          Active trial dive in progress — surface or complete the run first.
        </Text>
      ) : null}
      {state.dive && state.dive.status !== 'active' ? (
        <Text style={styles.warn}>{ms.debriefPending}</Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  highlightBanner: {
    color: theme.accent,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  card: { marginBottom: 4 },
  cardHighlight: {
    borderColor: theme.accent,
    borderWidth: 2,
    backgroundColor: '#082f4966',
  },
  name: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  purpose: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  meta: { color: theme.textMuted, marginBottom: 2 },
  reward: { color: theme.accent, marginTop: 6 },
  warn: { color: theme.warning },
});
