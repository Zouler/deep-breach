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
          <Text style={styles.cardTitle}>Repair supplies</Text>
          <IconLabelRow
            icon={repairTemplateIconSource('patch_kit')}
            label="Hull Patch Kit"
            value={`×${patch}`}
          />
          <IconLabelRow
            icon={repairTemplateIconSource('pressure_sealant')}
            label="Pressure Sealant"
            value={`×${seal}`}
          />
          <IconLabelRow
            icon={repairTemplateIconSource('brace_frame')}
            label="Emergency Brace"
            value={`×${brace}`}
          />
          <IconLabelRow
            icon={repairTemplateIconSource('oxygen_canister')}
            label="Oxygen Canister"
            value={`×${o2c}`}
          />
          {patch + seal + brace + o2c === 0 ? (
            <Text style={styles.muted}>No field kits aboard — seek external recoveries.</Text>
          ) : null}
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
        <Text style={styles.cardTitle}>Repair items</Text>
        {state.repairInventory.map((r) => (
          <IconLabelRow
            key={r.id}
            icon={repairTemplateIconSource(r.id)}
            label={r.name}
            value={`×${r.quantity} · up to ${r.maxSeverity}`}
          />
        ))}
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
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
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
  line: { color: theme.textMuted, marginBottom: 4 },
  item: { color: theme.text, fontWeight: '600' },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
  tag: { color: theme.accent, marginTop: 4, textTransform: 'uppercase', fontSize: 11 },
  hero: { color: theme.accent, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  warn: { color: theme.warning, marginBottom: 4 },
});
