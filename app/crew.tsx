import { StyleSheet, Text } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function CrewScreen() {
  const { state, dispatch } = useGame();

  return (
    <ScreenShell scroll>
      <SectionHeader title="Crew Roster" subtitle="Recruit and assign crew to the active dive roster" />
      <Text style={styles.balance}>Scrap: {state.resources.scrap}</Text>
      {state.crew.map((c) => (
        <PanelCard key={c.id}>
          <Text style={styles.name}>
            {c.name} · {c.role}
          </Text>
          <Text style={styles.meta}>
            Repair {Math.round(c.repairSkill * 100)}% · Nav {Math.round(c.navigationSkill * 100)}% · Sci{' '}
            {Math.round(c.researchSkill * 100)}%
          </Text>
          {!c.hired ? (
            <PrimaryButton
              title={`Hire (${c.hireCostScrap} scrap)`}
              disabled={state.resources.scrap < c.hireCostScrap}
              onPress={() => dispatch({ type: 'HIRE_CREW', crewId: c.id })}
            />
          ) : (
            <PrimaryButton
              title={c.assignedToDive ? 'Remove from dive roster' : 'Assign to dive roster'}
              variant="ghost"
              onPress={() => dispatch({ type: 'TOGGLE_CREW_ASSIGN', crewId: c.id })}
            />
          )}
        </PanelCard>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  balance: { color: theme.accent, marginBottom: 8, fontWeight: '700' },
  name: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  meta: { color: theme.textMuted, marginBottom: 8 },
});
