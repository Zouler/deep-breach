import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StrategicMapView } from '@/components/StrategicMapView';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function NavMapScreen() {
  const router = useRouter();
  const { state } = useGame();
  const dive = state.dive;
  const mission = state.missions.find((m) => m.id === dive?.missionId);

  if (!dive || !mission || dive.status !== 'active') {
    return (
      <ScreenShell>
        <Text style={styles.muted}>No active dive.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll contentStyle={styles.pad}>
      <Text style={styles.h1}>Strategic Map</Text>
      <Text style={styles.quote}>
        Navigation Officer — “Nav Map shows our current route and range from launch.”
      </Text>

      <StrategicMapView
        missionName={mission.name}
        targetDepthM={dive.targetDepthM}
        currentDepthM={dive.currentDepthM}
        rangeKm={dive.horizontalDistanceKm ?? 0}
        route={dive.currentRoute}
      />

      <Text style={styles.hint}>
        Command Intent is issued from the dive console — use “Change Command Intent” on the Active Dive
        screen after closing this map.
      </Text>

      <PrimaryButton title="Close" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 24, gap: 12 },
  h1: { color: theme.text, fontWeight: '900', fontSize: 20, marginBottom: 4 },
  quote: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  hint: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  muted: { color: theme.textMuted, marginBottom: 12 },
});
