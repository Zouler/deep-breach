import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconLabelRow } from '@/components/IconLabelRow';
import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { computeCargoUsed } from '@/game/cargo';
import { repairTemplateIconSource } from '@/game/assetVisuals';
import {
  groupCatalogEntries,
  ITEM_GROUP_LABELS,
  ITEM_GROUP_ORDER,
  normalizeItemId,
} from '@/game/items';
import { cargoCapacityUnits } from '@/game/submarineStats';

function mergeInventoryCounts(
  repairRows: { id: string; quantity: number }[],
  catalog: Record<string, number> | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [id, qty] of Object.entries(catalog ?? {})) {
    if (qty <= 0) continue;
    const canonId = normalizeItemId(id);
    counts[canonId] = (counts[canonId] ?? 0) + qty;
  }
  for (const row of repairRows) {
    if (row.quantity <= 0) continue;
    const canonId = normalizeItemId(row.id);
    counts[canonId] = (counts[canonId] ?? 0) + row.quantity;
  }
  return counts;
}

function GroupedSupplySections({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const grouped = groupCatalogEntries(counts);
  const groups = ITEM_GROUP_ORDER.filter((g) => (grouped[g]?.length ?? 0) > 0);
  if (groups.length === 0) {
    return <Text style={styles.muted}>No field kits aboard — seek external recoveries.</Text>;
  }
  return (
    <>
      {groups.map((group) => (
        <View key={group} style={styles.groupBlock}>
          <Text style={styles.groupLabel}>{ITEM_GROUP_LABELS[group]}</Text>
          {grouped[group]!.map((entry) => {
            const iconId =
              entry.itemId === 'hull_patch_kit'
                ? 'patch_kit'
                : entry.itemId === 'emergency_bulkhead_clamps'
                  ? 'brace_frame'
                  : entry.itemId;
            return (
              <IconLabelRow
                key={entry.itemId}
                icon={repairTemplateIconSource(iconId)}
                label={entry.name}
                value={`×${entry.quantity}`}
              />
            );
          })}
        </View>
      ))}
    </>
  );
}

export default function InventoryScreen() {
  const { state } = useGame();
  const router = useRouter();
  const dive = state.dive;

  if (dive && dive.status === 'active') {
    const cap = cargoCapacityUnits(state.submarine);
    const used = computeCargoUsed(dive);
    const inv = dive.expeditionRepairInventory ?? [];
    const catalog = dive.expeditionCatalogItems ?? {};
    const supplyCounts = mergeInventoryCounts(inv, catalog);

    const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;

    return (
      <ScreenShell scroll backgroundImage={GAME_ASSETS.diveScreenBg} backgroundScrimOpacity={0.66}>
        <SectionHeader
          title="Expedition cargo"
          subtitle="What you are carrying on this dive"
        />
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.hero}>
            Cargo {used} / {cap}
          </Text>
          <View style={styles.cargoTrack}>
            <View style={[styles.cargoFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.muted}>
            Repair items, salvage blocks, research packets, and relics all consume capacity. Upgrade
            the Cargo Bay at base for more headroom.
          </Text>
        </PanelCard>
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Supplies & salvage</Text>
          <GroupedSupplySections counts={supplyCounts} />
        </PanelCard>
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Resources</Text>
          <IconLabelRow
            icon={GAME_ASSETS.icons.scrap}
            label="Scrap (mission haul)"
            value={`×${dive.collectedScrap}`}
          />
          <IconLabelRow
            icon={GAME_ASSETS.icons.researchData}
            label="Research Data"
            value={`×${dive.collectedResearch}`}
          />
        </PanelCard>
        <PanelCard style={styles.consoleCard}>
          <Text style={styles.cardTitle}>Discoveries</Text>
          <IconLabelRow
            icon={GAME_ASSETS.icons.artifact}
            label="Treasures"
            value={`×${dive.collectedTreasures.length}`}
          />
          <IconLabelRow
            icon={GAME_ASSETS.icons.artifact}
            label="Artifacts"
            value={`×${dive.collectedArtifacts ?? 0}`}
          />
          <IconLabelRow
            icon={GAME_ASSETS.icons.researchData}
            label="Samples"
            value={`×${dive.collectedSamples ?? 0}`}
          />
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
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.7}>
      <SectionHeader title="Base inventory" subtitle="Drydock stock · mirrors Base Storage" />
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
        <Text style={styles.cardTitle}>Supplies & salvage</Text>
        <GroupedSupplySections
          counts={mergeInventoryCounts(
            state.repairInventory.map((r) => ({ id: r.id, quantity: r.quantity })),
            state.catalogItems,
          )}
        />
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Treasures & specimens</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.artifact}
          label="Treasures"
          value={`×${bs.treasures.length}`}
        />
        <IconLabelRow icon={GAME_ASSETS.icons.artifact} label="Artifacts" value={`×${bs.artifacts}`} />
        <IconLabelRow
          icon={GAME_ASSETS.icons.researchData}
          label="Samples"
          value={`×${bs.samples}`}
        />
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
  consoleCard: {
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
  },
  cargoTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cargoFill: {
    height: '100%',
    backgroundColor: theme.accent,
  },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  groupBlock: { marginBottom: 12 },
  groupLabel: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  line: { color: theme.textMuted, marginBottom: 4 },
  item: { color: theme.text, fontWeight: '600' },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
  tag: { color: theme.accent, marginTop: 4, textTransform: 'uppercase', fontSize: 11 },
  hero: { color: theme.accent, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  warn: { color: theme.warning, marginBottom: 4 },
});
