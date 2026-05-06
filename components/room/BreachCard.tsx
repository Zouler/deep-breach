import { StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { repairTemplateIconSource } from '@/game/assetVisuals';
import {
  formatSeverityUi,
  getExpeditionRepairTools,
  getRecommendedRepairItemId,
  getRepairActionAvailability,
  getRepairItemPurpose,
} from '@/game/roomDetailHelpers';
import type { Crack, RepairItem } from '@/types';

import { RepairToolRow } from '@/components/room/RepairToolRow';

export function BreachCard({
  breachIndex,
  crack,
  inventory,
  feedback,
  onApply,
}: {
  breachIndex: number;
  crack: Crack;
  inventory: RepairItem[];
  feedback?: { text: string; tone: 'ok' | 'err' } | null;
  onApply: (item: RepairItem) => void;
}) {
  const tools = getExpeditionRepairTools(inventory);
  const recId = getRecommendedRepairItemId(crack);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <SafeIcon source={GAME_ASSETS.icons.crack} size={24} />
        <View style={{ flex: 1 }}>
          <Text style={styles.breachTitle}>Breach {breachIndex}</Text>
          <Text style={styles.severity}>{formatSeverityUi(crack.severity)}</Text>
          <Text style={styles.leak}>Leak: {crack.leakRatePerSecond.toFixed(2)} u/s</Text>
          <Text style={styles.rec}>
            Recommended: {tools.find((t) => t.id === recId)?.name ?? 'Pressure Sealant'}
          </Text>
        </View>
      </View>

      {feedback ? (
        <View style={[styles.inline, feedback.tone === 'ok' ? styles.inlineOk : styles.inlineErr]}>
          <Text style={styles.inlineText}>{feedback.text}</Text>
        </View>
      ) : null}

      {tools.map((item) => {
        const avail = getRepairActionAvailability(crack, item);
        return (
          <RepairToolRow
            key={item.id}
            name={item.name}
            purpose={getRepairItemPurpose(item.id)}
            stock={item.quantity}
            icon={repairTemplateIconSource(item.id)}
            recommended={item.id === recId}
            available={avail.available}
            unavailableReason={avail.reason}
            onApply={() => onApply(item)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38bdf844',
    backgroundColor: '#020617cc',
    padding: 12,
    marginBottom: 10,
  },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  breachTitle: { color: theme.text, fontWeight: '900', fontSize: 16 },
  severity: { color: '#fde68a', fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },
  leak: { color: theme.textMuted, marginTop: 4, fontSize: 13 },
  rec: { color: '#67e8f9', marginTop: 6, fontSize: 12, fontWeight: '800' },
  inline: { marginTop: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  inlineOk: { borderColor: '#166534', backgroundColor: '#052e1655' },
  inlineErr: { borderColor: '#b91c1c', backgroundColor: '#450a0a55' },
  inlineText: { color: theme.text, fontWeight: '700', fontSize: 12, lineHeight: 16 },
});
