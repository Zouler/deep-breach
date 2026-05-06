import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import {
  calculateHullRepairCost,
  calculatePartialRepairTarget,
  describeBasicRestock,
  getSubmarineConditionLabel,
} from '@/game/repairDock';
import { BASIC_RESTOCK_SCRAP_COST, PARTIAL_HULL_REPAIR_PERCENT } from '@/game/economy';

export default function RepairDockScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [banner, setBanner] = useState<string | null>(null);
  const hull = state.submarine.hullIntegrityPercent;
  const bs = state.baseStorage;
  const label = getSubmarineConditionLabel(hull);
  const partialTarget = calculatePartialRepairTarget(hull);
  const partialCost = useMemo(
    () => calculateHullRepairCost(hull, partialTarget),
    [hull, partialTarget],
  );
  const fullCost = useMemo(() => calculateHullRepairCost(hull, 100), [hull]);
  const restock = describeBasicRestock(state);

  return (
    <ScreenShell scroll>
      <SectionHeader title="Repair Dock" subtitle="Submarine maintenance and refit" />
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}
      <PanelCard>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.hero}>Hull {Math.round(hull)}%</Text>
        <Text style={styles.line}>Condition: {label}</Text>
        <Text style={styles.line}>
          Scrap in Base Storage: {bs.scrap} (repair cost 1 scrap / 2% hull)
        </Text>
        <Text style={styles.line}>
          Partial repair (+{PARTIAL_HULL_REPAIR_PERCENT}%): ~{partialCost} scrap
        </Text>
        <Text style={styles.line}>Full repair (to 100%): ~{fullCost} scrap</Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Hull repairs</Text>
        <PrimaryButton
          title={`Repair hull +${Math.min(PARTIAL_HULL_REPAIR_PERCENT, Math.round(100 - hull))}% (${partialCost} scrap)`}
          disabled={hull >= 100 || bs.scrap < partialCost || partialTarget <= hull}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_HULL', mode: 'partial' });
            setBanner('Hull repaired by up to 25%.');
          }}
        />
        <PrimaryButton
          title={`Full repair to 100% (${fullCost} scrap)`}
          variant="ghost"
          disabled={hull >= 100 || bs.scrap < fullCost}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_HULL', mode: 'full' });
            setBanner('Hull repaired to 100%.');
          }}
        />
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Restock basic supplies</Text>
        <Text style={styles.meta}>
          Adds missing Hull Patch / Sealant / Oxygen Canister to Base Storage for{' '}
          {BASIC_RESTOCK_SCRAP_COST} scrap total.
        </Text>
        <Text style={styles.meta}>{restock.message}</Text>
        <PrimaryButton
          title="Restock basic supplies"
          variant="ghost"
          disabled={!restock.canRestock}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_RESTOCK_BASIC' });
            setBanner('Basic supplies restocked in Base Storage.');
          }}
        />
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Future systems</Text>
        <Text style={styles.placeholder}>• Weapons Systems — Locked</Text>
        <Text style={styles.placeholder}>• Defensive Systems — Locked</Text>
        <Text style={styles.placeholder}>• Advanced Hull Plating — Coming Soon</Text>
        <Text style={styles.placeholder}>• Crew Equipment — Coming Soon</Text>
        <Text style={styles.placeholder}>• Market / Supply Shop — Coming Soon</Text>
      </PanelCard>
      <PrimaryButton title="Back to base" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  hero: { color: theme.accent, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  line: { color: theme.textMuted, marginBottom: 4 },
  meta: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  placeholder: { color: theme.textMuted, marginBottom: 6, fontStyle: 'italic' },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#14532d55',
    backgroundColor: '#052e1644',
    padding: 10,
    marginBottom: 10,
  },
  bannerText: { color: theme.ok, fontWeight: '700' },
});
