import { StyleSheet, Text } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import {
  upgradeModuleResearchCost,
  upgradeModuleScrapCost,
} from '@/game/moduleUpgrade';

export default function UpgradesScreen() {
  const { state, dispatch } = useGame();

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.commandHubBackground} backgroundScrimOpacity={0.6}>
      <SectionHeader title="Drydock Upgrades" subtitle="Pay in scrap or research data" />
      <Text style={styles.balance}>
        Scrap: {state.resources.scrap} · Research: {state.resources.researchData}
      </Text>
      {state.submarine.modules.map((m) => {
        const scrapCost = upgradeModuleScrapCost(m.level);
        const researchCost = upgradeModuleResearchCost(m.level);
        const maxed = m.level >= m.maxLevel;
        const canScrap = !maxed && state.resources.scrap >= scrapCost;
        const canResearch = !maxed && state.resources.researchData >= researchCost;
        return (
          <PanelCard key={m.id}>
            <Text style={styles.name}>
              {m.name} · L{m.level}/{m.maxLevel}
            </Text>
            <Text style={styles.meta}>
              Next: {scrapCost} scrap or {researchCost} research
            </Text>
            <PrimaryButton
              title={maxed ? 'Maxed' : `Pay ${scrapCost} scrap`}
              disabled={!canScrap}
              onPress={() =>
                dispatch({ type: 'UPGRADE_MODULE', moduleType: m.type, currency: 'scrap' })
              }
            />
            <PrimaryButton
              title={maxed ? '—' : `Pay ${researchCost} research`}
              variant="ghost"
              disabled={!canResearch}
              onPress={() =>
                dispatch({ type: 'UPGRADE_MODULE', moduleType: m.type, currency: 'research' })
              }
            />
          </PanelCard>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  balance: { color: theme.accent, marginBottom: 8, fontWeight: '700' },
  name: { color: theme.text, fontWeight: '700', marginBottom: 6 },
  meta: { color: theme.textMuted, marginBottom: 8 },
});
