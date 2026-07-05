import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { NARRATIVE_UI } from '@/data/storyBriefings';
import { useGame } from '@/context/GameContext';
import { salvageTreasureValueScrap, totalRepairSupplyUnits } from '@/game/baseStorage';
import {
  ARTIFACT_ANALYZE_RESEARCH,
  SAMPLE_ANALYZE_RESEARCH,
  TREASURE_SALVAGE_SCRAP_COMMON,
  TREASURE_SALVAGE_SCRAP_RARE,
} from '@/game/economy';

export default function BaseStorageScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const bs = state.baseStorage;
  const commonTreasures = bs.treasures.filter((t) => (t.rarity ?? 'common') === 'common').length;
  const rareTreasures = bs.treasures.filter((t) => (t.rarity ?? 'common') === 'rare').length;

  const bsCopy = NARRATIVE_UI.baseStorage;

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.72}>
      <SectionHeader title={bsCopy.title} subtitle={bsCopy.subtitle} />
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Resources</Text>
        <IconLabelRow icon={GAME_ASSETS.icons.scrap} label="Scrap" value={`×${bs.scrap}`} />
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Research Data"
          value={`×${bs.researchData}`}
        />
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Repair supplies</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Hull Patch Kit"
          value={`×${bs.hullPatchKits}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.pressureSealant}
          label="Pressure Sealant"
          value={`×${bs.pressureSealant}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Emergency Brace"
          value={`×${bs.emergencyBrace}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.oxygenCanister}
          label="Oxygen Canister"
          value={`×${bs.oxygenCanisters}`}
        />
        <Text style={styles.meta}>Total supply units: {totalRepairSupplyUnits(bs)}</Text>
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Recovered valuables</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Common Treasure"
          value={`×${commonTreasures}`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Rare Relic"
          value={`×${rareTreasures}`}
        />
        <IconLabelRow icon={GAME_ASSETS.icons.artifact} label="Artifact" value={`×${bs.artifacts}`} />
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Deep Sample"
          value={`×${bs.samples}`}
        />

        <View style={styles.actions}>
          <PrimaryButton
            title={`Salvage common treasure (+${TREASURE_SALVAGE_SCRAP_COMMON} scrap)`}
            variant="ghost"
            disabled={commonTreasures <= 0}
            onPress={() => dispatch({ type: 'SALVAGE_TREASURES', rarity: 'common', count: 1 })}
          />
          <PrimaryButton
            title={`Salvage rare relic (+${TREASURE_SALVAGE_SCRAP_RARE} scrap)`}
            variant="ghost"
            disabled={rareTreasures <= 0}
            onPress={() => dispatch({ type: 'SALVAGE_TREASURES', rarity: 'rare', count: 1 })}
          />
          <PrimaryButton
            title={`Analyze artifact (+${ARTIFACT_ANALYZE_RESEARCH} research)`}
            variant="ghost"
            disabled={bs.artifacts <= 0}
            onPress={() => dispatch({ type: 'ANALYZE_ARTIFACTS', count: 1 })}
          />
          <PrimaryButton
            title={`Analyze sample (+${SAMPLE_ANALYZE_RESEARCH} research)`}
            variant="ghost"
            disabled={bs.samples <= 0}
            onPress={() => dispatch({ type: 'ANALYZE_SAMPLES', count: 1 })}
          />
        </View>
        <Text style={styles.meta}>
          Salvage values: common {salvageTreasureValueScrap('common')} scrap · rare{' '}
          {salvageTreasureValueScrap('rare')} scrap.
        </Text>
      </PanelCard>
      <PrimaryButton title="Back" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  consoleCard: {
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
  },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  line: { color: theme.textMuted, marginBottom: 4 },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 6 },
  actions: { marginTop: 10, gap: 8 },
});
