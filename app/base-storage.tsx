import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
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

  return (
    <ScreenShell scroll>
      <SectionHeader title="Base Storage" subtitle="Surface warehouse · Triton Outpost" />
      <PanelCard>
        <Text style={styles.cardTitle}>Resources</Text>
        <Text style={styles.line}>Scrap ×{bs.scrap}</Text>
        <Text style={styles.line}>Research Data ×{bs.researchData}</Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Repair supplies</Text>
        <Text style={styles.line}>Hull Patch Kit ×{bs.hullPatchKits}</Text>
        <Text style={styles.line}>Pressure Sealant ×{bs.pressureSealant}</Text>
        <Text style={styles.line}>Emergency Brace ×{bs.emergencyBrace}</Text>
        <Text style={styles.line}>Oxygen Canister ×{bs.oxygenCanisters}</Text>
        <Text style={styles.meta}>Total supply units: {totalRepairSupplyUnits(bs)}</Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Recovered valuables</Text>
        <Text style={styles.line}>Common Treasure ×{commonTreasures}</Text>
        <Text style={styles.line}>Rare Relic ×{rareTreasures}</Text>
        <Text style={styles.line}>Unknown Artifact ×{bs.artifacts}</Text>
        <Text style={styles.line}>Deep Sample ×{bs.samples}</Text>

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
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  line: { color: theme.textMuted, marginBottom: 4 },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 6 },
  actions: { marginTop: 10, gap: 8 },
});
