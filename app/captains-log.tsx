import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { STORY_SO_FAR_TEMPLATE } from '@/data/storyRecapTemplates';
import { useGame } from '@/context/GameContext';
import { formatCrewMessageDisplayName } from '@/game/crewMessagePresentation';
import type { StoryBeat, StoryBeatImportance } from '@/types';

function importanceLabel(i: StoryBeatImportance): string {
  if (i === 'high') return 'HIGH';
  if (i === 'medium') return 'MED';
  return 'LOW';
}

function BeatRow({ beat }: { beat: StoryBeat }) {
  const speaker = beat.speakerId ? formatCrewMessageDisplayName(beat.speakerId) : 'XO';
  return (
    <View style={styles.beat}>
      <Text style={styles.beatTitle}>
        [{importanceLabel(beat.importance)}] {beat.title}
      </Text>
      <Text style={styles.beatMeta}>{speaker}</Text>
      <Text style={styles.beatBody}>{beat.summaryText}</Text>
    </View>
  );
}

export default function CaptainsLogScreen() {
  const router = useRouter();
  const { state } = useGame();
  const beats = [...state.storyBeats].reverse();
  const recent = beats
    .filter((b) => b.importance !== 'low' || b.type === 'internal_crew_event')
    .slice(0, 12);
  const missionEnds = beats.filter(
    (b) =>
      b.type === 'mission_complete' ||
      b.type === 'mission_failed' ||
      b.type === 'mission_aborted' ||
      b.type === 'emergency_extraction',
  ).slice(0, 3);

  return (
    <ScreenShell
      scroll
      backgroundImage={GAME_ASSETS.captainsLogBackground}
      backgroundScrimOpacity={0.62}
    >
      <SectionHeader title="Captain’s Log" subtitle="Narrative record · not a raw systems dump" />
      <PanelCard style={styles.card}>
        <Text style={styles.cardHead}>Story so far</Text>
        <Text style={styles.storySoFar}>{STORY_SO_FAR_TEMPLATE}</Text>
      </PanelCard>
      <PanelCard style={styles.card}>
        <Text style={styles.cardHead}>Recent operations</Text>
        {recent.length === 0 ? (
          <Text style={styles.muted}>No notable beats logged yet — trials will write here.</Text>
        ) : (
          recent.map((b) => <BeatRow key={b.id} beat={b} />)
        )}
      </PanelCard>
      <PanelCard style={styles.card}>
        <Text style={styles.cardHead}>Last descents / trials</Text>
        {missionEnds.length === 0 ? (
          <Text style={styles.muted}>Complete or abort a trial to see summaries here.</Text>
        ) : (
          missionEnds.map((b) => <BeatRow key={b.id} beat={b} />)
        )}
      </PanelCard>
      <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardHead: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  storySoFar: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
  },
  beat: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(44, 217, 255, 0.35)',
    paddingLeft: 10,
    marginBottom: 12,
  },
  beatTitle: { color: theme.text, fontWeight: '800', fontSize: 14 },
  beatMeta: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  beatBody: { color: theme.text, fontSize: 13, lineHeight: 20, marginTop: 6 },
  muted: { color: theme.textMuted, fontSize: 13, lineHeight: 20 },
});
