import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { computeCargoUsed } from '@/game/cargo';
import { cargoCapacityUnits } from '@/game/submarineStats';

export default function InventoryScreen() {
  const { state } = useGame();
  const router = useRouter();
  const dive = state.dive;

  if (dive && dive.status === 'active') {
    const cap = cargoCapacityUnits(state.submarine);
    const used = computeCargoUsed(dive);
    const inv = dive.expeditionRepairInventory ?? [];
    const patch = inv.find((i) => i.id === 'patch_kit')?.quantity ?? 0;
    const seal = inv.find((i) => i.id === 'pressure_sealant')?.quantity ?? 0;
    const brace = inv.find((i) => i.id === 'brace_frame')?.quantity ?? 0;
    const o2c = inv.find((i) => i.id === 'oxygen_canister')?.quantity ?? 0;

    return (
      <ScreenShell scroll>
        <SectionHeader
          title="Expedition cargo"
          subtitle="What you are carrying on this dive"
        />
        <PanelCard>
          <Text style={styles.hero}>
            Cargo {used} / {cap}
          </Text>
          <Text style={styles.muted}>
            Repair items, salvage blocks, research packets, and relics all consume capacity. Upgrade
            the Cargo Bay at base for more headroom.
          </Text>
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Repair supplies</Text>
          <Text style={styles.line}>Hull Patch Kit ×{patch}</Text>
          <Text style={styles.line}>Pressure Sealant ×{seal}</Text>
          <Text style={styles.line}>Emergency Brace ×{brace}</Text>
          <Text style={styles.line}>Oxygen Canister ×{o2c}</Text>
          {patch + seal + brace + o2c === 0 ? (
            <Text style={styles.muted}>No field kits aboard — seek external recoveries.</Text>
          ) : null}
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Resources</Text>
          <Text style={styles.line}>Scrap (mission haul) ×{dive.collectedScrap}</Text>
          <Text style={styles.line}>Research Data ×{dive.collectedResearch}</Text>
        </PanelCard>
        <PanelCard>
          <Text style={styles.cardTitle}>Discoveries</Text>
          <Text style={styles.line}>Treasures ×{dive.collectedTreasures.length}</Text>
          <Text style={styles.line}>Artifacts ×{dive.collectedArtifacts ?? 0}</Text>
          <Text style={styles.line}>Samples ×{dive.collectedSamples ?? 0}</Text>
          {dive.collectedTreasures.length === 0 &&
          (dive.collectedArtifacts ?? 0) === 0 &&
          (dive.collectedSamples ?? 0) === 0 ? (
            <Text style={styles.muted}>No relics catalogued yet this dive.</Text>
          ) : null}
        </PanelCard>
        {(dive.cargoLeftBehindNotes ?? []).length > 0 ? (
          <PanelCard>
            <Text style={styles.cardTitle}>Cargo notes</Text>
            {dive.cargoLeftBehindNotes!.map((n, i) => (
              <Text key={`${i}`} style={styles.warn}>
                • {n}
              </Text>
            ))}
          </PanelCard>
        ) : null}
        <PrimaryButton title="Back to dive" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  const bs = state.baseStorage;
  return (
    <ScreenShell scroll>
      <SectionHeader title="Base inventory" subtitle="Drydock stock · mirrors Base Storage" />
      <PanelCard>
        <Text style={styles.cardTitle}>Resources</Text>
        <Text style={styles.line}>Scrap ×{bs.scrap}</Text>
        <Text style={styles.line}>Research Data ×{bs.researchData}</Text>
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Repair items</Text>
        {state.repairInventory.map((r) => (
          <Text key={r.id} style={styles.line}>
            {r.name} · x{r.quantity} · handles up to {r.maxSeverity}
          </Text>
        ))}
      </PanelCard>
      <PanelCard>
        <Text style={styles.cardTitle}>Treasures & specimens</Text>
        <Text style={styles.line}>Treasures ×{bs.treasures.length}</Text>
        <Text style={styles.line}>Artifacts ×{bs.artifacts}</Text>
        <Text style={styles.line}>Samples ×{bs.samples}</Text>
        {bs.treasures.length === 0 ? (
          <Text style={styles.muted}>No relics catalogued in storage yet.</Text>
        ) : (
          bs.treasures.map((t) => (
            <View key={t.id} style={{ marginBottom: 10 }}>
              <Text style={styles.item}>{t.name}</Text>
              <Text style={styles.muted}>{t.description}</Text>
              <Text style={styles.tag}>{t.rarity}</Text>
            </View>
          ))
        )}
      </PanelCard>
      <PrimaryButton
        title="Full Base Storage view"
        variant="ghost"
        onPress={() => router.push('/base-storage' as never)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  line: { color: theme.textMuted, marginBottom: 4 },
  item: { color: theme.text, fontWeight: '600' },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
  tag: { color: theme.accent, marginTop: 4, textTransform: 'uppercase', fontSize: 11 },
  hero: { color: theme.accent, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  warn: { color: theme.warning, marginBottom: 4 },
});
