import { StyleSheet, Text, View } from 'react-native';

import { HudPanel, HudSectionTitle } from '@/components/hud/HudPrimitives';
import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';
import { repairTemplateIconSource } from '@/game/assetVisuals';
import type { RepairItem } from '@/types';

import { getExpeditionRepairTools } from '@/game/roomDetailHelpers';

function Row({ label, qty, icon }: { label: string; qty: number; icon: any }) {
  return (
    <View style={styles.row}>
      <SafeIcon source={icon} size={28} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{label}</Text>
        <Text style={styles.stock}>Stock: {qty}</Text>
      </View>
    </View>
  );
}

export function RepairSuppliesSummary({ inventory }: { inventory: RepairItem[] }) {
  const tools = getExpeditionRepairTools(inventory);
  const allZero = tools.every((t) => t.quantity <= 0);

  return (
    <HudPanel>
      <HudSectionTitle>AVAILABLE REPAIR SUPPLIES</HudSectionTitle>
      {tools.map((t) => (
        <Row key={t.id} label={t.name} qty={t.quantity} icon={repairTemplateIconSource(t.id)} />
      ))}
      {allZero ? (
        <Text style={styles.helper}>
          No repair supplies available. Recover supplies through external contacts or return to base.
        </Text>
      ) : null}
    </HudPanel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  icon: {},
  name: { color: theme.text, fontWeight: '800' },
  stock: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  helper: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 10 },
});
