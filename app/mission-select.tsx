import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function MissionSelectScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();

  return (
    <ScreenShell scroll>
      <SectionHeader title="Mission Board" subtitle="Depth contracts · risk disclosure" />
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
          <PanelCard style={styles.card}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.meta}>Target depth: {m.targetDepthM}m</Text>
            <Text style={styles.meta}>Est. duration: {m.durationMinutes} min (active)</Text>
            <Text style={styles.meta}>Risk: {m.risk}</Text>
            <Text style={styles.reward}>Expected: {m.expectedRewardsText}</Text>
          </PanelCard>
        </Pressable>
      ))}
      {state.dive?.status === 'active' ? (
        <Text style={styles.warn}>Active dive in progress — surface or finish contract first.</Text>
      ) : null}
      {state.dive && state.dive.status !== 'active' ? (
        <Text style={styles.warn}>Mission debrief pending — open Mission Result.</Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 4 },
  name: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  meta: { color: theme.textMuted, marginBottom: 2 },
  reward: { color: theme.accent, marginTop: 6 },
  warn: { color: theme.warning },
});
