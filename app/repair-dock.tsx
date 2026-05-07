import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import {
  calculateHullRepairCost,
  calculatePartialRepairTarget,
  describeBasicRestock,
  getSubmarineConditionLabel,
} from '@/game/repairDock';
import {
  countHullRepairUnitsInBaseStorage,
  getBaseRepairStockStatus,
} from '@/game/repairResourceStatus';
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
  const baseHullKits = countHullRepairUnitsInBaseStorage(bs);
  const baseRepairBand = getBaseRepairStockStatus(bs);

  const rd = NARRATIVE_UI.repairDock;

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.baseRepairDockBg} backgroundScrimOpacity={0.72}>
      <SectionHeader title={rd.title} subtitle={rd.subtitle} />
      <Text style={styles.blurb}>{rd.blurb}</Text>
      {baseRepairBand === 'low' || baseRepairBand === 'empty' ? (
        <View style={styles.supplyWarn}>
          <Text style={styles.supplyWarnText}>
            {baseRepairBand === 'empty'
              ? 'Repair supplies are depleted at base. Use Restock Basic Supplies before the next trial.'
              : 'Repair supplies are low at base. Restock before the next trial if you can.'}
          </Text>
        </View>
      ) : null}
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Repair supplies (Base Storage)</Text>
        <Text style={styles.line}>
          Hull kits total: {baseHullKits} (patch + sealant + brace)
        </Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Hull Patch Kits"
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
          label="Oxygen canisters (base)"
          value={`×${bs.oxygenCanisters}`}
        />
      </PanelCard>
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.hero}>Hull {Math.round(hull)}%</Text>
        <View style={styles.hullTrack}>
          <View style={[styles.hullFill, { width: `${Math.round(hull)}%` }]} />
        </View>
        <Text style={styles.line}>Condition: {label}</Text>
        <IconLabelRow
          icon={GAME_ASSETS.icons.scrap}
          label="Scrap in Base Storage"
          value={`×${bs.scrap} · 1 scrap repairs 2% hull`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label={`Partial repair (+${PARTIAL_HULL_REPAIR_PERCENT}%)`}
          value={`~${partialCost} scrap`}
        />
        <IconLabelRow
          icon={GAME_ASSETS.icons.hullPatchKit}
          label="Full repair (to 100%)"
          value={`~${fullCost} scrap`}
        />
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Hull repairs</Text>
        <PrimaryButton
          title={`Repair hull +${Math.min(PARTIAL_HULL_REPAIR_PERCENT, Math.round(100 - hull))}% (${partialCost} scrap)`}
          iconLeft={GAME_ASSETS.icons.hullPatchKit}
          disabled={hull >= 100 || bs.scrap < partialCost || partialTarget <= hull}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_HULL', mode: 'partial' });
            setBanner('Hull repaired by up to 25%.');
          }}
        />
        <PrimaryButton
          title={`Full repair to 100% (${fullCost} scrap)`}
          variant="ghost"
          iconLeft={GAME_ASSETS.icons.scrap}
          disabled={hull >= 100 || bs.scrap < fullCost}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_HULL', mode: 'full' });
            setBanner('Hull repaired to 100%.');
          }}
        />
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Restock basic supplies</Text>
        <View style={styles.restockIcons}>
          <IconLabelRow
            icon={GAME_ASSETS.icons.hullPatchKit}
            label="Hull Patch"
            value="to ×1 if missing"
            iconSize={20}
          />
          <IconLabelRow
            icon={GAME_ASSETS.icons.pressureSealant}
            label="Sealant"
            value="to ×1 if missing"
            iconSize={20}
          />
          <IconLabelRow
            icon={GAME_ASSETS.icons.oxygenCanister}
            label="O₂ canister"
            value="to ×1 if missing"
            iconSize={20}
          />
        </View>
        <Text style={styles.meta}>
          Flat {BASIC_RESTOCK_SCRAP_COST} scrap — adds only missing basics to Base Storage.
        </Text>
        <Text style={styles.meta}>{restock.message}</Text>
        <PrimaryButton
          title="Restock basic supplies"
          variant="ghost"
          iconLeft={GAME_ASSETS.icons.scrap}
          disabled={!restock.canRestock}
          onPress={() => {
            dispatch({ type: 'REPAIR_DOCK_RESTOCK_BASIC' });
            setBanner('Basic supplies restocked in Base Storage.');
          }}
        />
      </PanelCard>
      <PanelCard style={styles.lockedCard}>
        <Text style={styles.cardTitle}>Future systems</Text>
        <Text style={styles.lockedLine}>Weapons Systems — Locked</Text>
        <Text style={styles.lockedLine}>Defensive Systems — Locked</Text>
        <Text style={styles.lockedLine}>Advanced Hull Plating — Locked</Text>
        <Text style={styles.lockedLine}>Crew Equipment — Locked</Text>
        <Text style={styles.lockedLine}>Market / Supply Shop — Locked</Text>
      </PanelCard>
      <PrimaryButton title="Back to base" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  blurb: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  consoleCard: {
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
  },
  lockedCard: {
    borderColor: '#334155',
    backgroundColor: '#02061799',
    opacity: 0.92,
  },
  lockedLine: {
    color: theme.textMuted,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  hullTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  hullFill: {
    height: '100%',
    backgroundColor: theme.accent,
  },
  restockIcons: { marginBottom: 6 },
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
  supplyWarn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b4530944',
    backgroundColor: '#451a0344',
    padding: 12,
    marginBottom: 12,
  },
  supplyWarnText: { color: theme.warning, fontWeight: '700', fontSize: 13, lineHeight: 18 },
});
