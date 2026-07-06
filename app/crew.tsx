import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PortraitFrame } from '@/components/PortraitFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { portraitForCrewRole } from '@/game/portraitAssets';
import {
  getCrewSpecialization,
  hasPendingSpecialization,
  specializationOptionsForRole,
  SPECIALIZATION_UNLOCK_DIVES,
} from '@/game/crewSpecializations';

export default function CrewScreen() {
  const { state, dispatch } = useGame();

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.commandHubBackground} backgroundScrimOpacity={0.6}>
      <SectionHeader title="Crew Roster" subtitle="Recruit and assign crew to the active dive roster" />
      <Text style={styles.balance}>Scrap: {state.resources.scrap}</Text>
      {state.crew.map((c) => {
        const pending = hasPendingSpecialization(c);
        const chosen = getCrewSpecialization(c.specializationId);
        const portrait = portraitForCrewRole(c.role);
        return (
          <PanelCard key={c.id}>
            <View style={styles.cardTop}>
              {portrait ? <PortraitFrame source={portrait} size={72} /> : null}
              <View style={styles.cardBody}>
            <Text style={styles.name}>
              {c.name} · {c.role}
            </Text>
            <Text style={styles.meta}>
              Repair {Math.round(c.repairSkill * 100)}% · Nav {Math.round(c.navigationSkill * 100)}% · Sci{' '}
              {Math.round(c.researchSkill * 100)}%
            </Text>
            {c.hired ? (
              <Text style={styles.meta}>
                Dives completed: {c.divesCompleted}
                {chosen ? ` · Specialization: ${chosen.name}` : ''}
              </Text>
            ) : null}
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
            {pending ? (
              <View style={styles.specializationBox}>
                <Text style={styles.specializationTitle}>Specialization available</Text>
                <Text style={styles.specializationHint}>
                  {c.name} has completed {c.divesCompleted} dives (needs {SPECIALIZATION_UNLOCK_DIVES}).
                  Pick a permanent focus — this cannot be changed later.
                </Text>
                {specializationOptionsForRole(c.role).map((opt) => (
                  <View key={opt.id} style={styles.specializationOption}>
                    <PrimaryButton
                      title={opt.name}
                      onPress={() =>
                        dispatch({
                          type: 'CHOOSE_CREW_SPECIALIZATION',
                          crewId: c.id,
                          specializationId: opt.id,
                        })
                      }
                    />
                    <Text style={styles.specializationBlurb}>{opt.blurb}</Text>
                  </View>
                ))}
              </View>
            ) : null}
              </View>
            </View>
          </PanelCard>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  balance: { color: theme.accent, marginBottom: 8, fontWeight: '700' },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardBody: { flex: 1, minWidth: 0 },
  name: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  meta: { color: theme.textMuted, marginBottom: 8 },
  specializationBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.panelBorder,
  },
  specializationTitle: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  specializationHint: { color: theme.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  specializationOption: { marginBottom: 10 },
  specializationBlurb: { color: theme.textMuted, fontSize: 12, lineHeight: 16, marginTop: 4 },
});
