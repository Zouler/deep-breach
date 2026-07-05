import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';

export function RepairToolRow({
  name,
  purpose,
  stock,
  icon,
  recommended,
  available,
  unavailableReason,
  onApply,
}: {
  name: string;
  purpose: string;
  stock: number;
  icon: any;
  recommended?: boolean;
  available: boolean;
  unavailableReason?: string;
  onApply: () => void;
}) {
  return (
    <View style={[styles.wrap, recommended ? styles.wrapRec : null, !available ? styles.wrapDisabled : null]}>
      <View style={styles.top}>
        <SafeIcon source={icon} size={26} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{name}</Text>
            {recommended ? (
              <View style={styles.recPill}>
                <Text style={styles.recText}>REC</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.purpose}>{purpose}</Text>
          <Text style={[styles.stock, stock <= 0 ? styles.stockEmpty : null]}>
            {stock <= 0 ? 'No stock' : `Stock: ${stock}`}
          </Text>
        </View>
      </View>
      {!available ? (
        <Text style={styles.blocked}>{unavailableReason ?? 'Unavailable'}</Text>
      ) : (
        <Pressable
          onPress={onApply}
          disabled={stock <= 0}
          style={({ pressed }) => [styles.btn, pressed ? styles.btnPressed : null, stock <= 0 ? styles.btnDisabled : null]}
        >
          <Text style={[styles.btnText, stock <= 0 ? styles.btnTextDisabled : null]}>Apply</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: theme.panelBgFaint,
    padding: 10,
    marginTop: 10,
  },
  wrapRec: { borderColor: '#22d3ee66' },
  wrapDisabled: { opacity: 0.72 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  icon: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { color: theme.text, fontWeight: '900' },
  recPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22d3ee55',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#08334444',
  },
  recText: { color: '#67e8f9', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  purpose: { color: theme.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  stock: { color: theme.textMuted, fontSize: 12, marginTop: 6, fontWeight: '700' },
  stockEmpty: { color: theme.warning, fontWeight: '900' },
  blocked: { color: theme.textMuted, marginTop: 10, fontSize: 12, fontStyle: 'italic' },
  btn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    backgroundColor: '#0b1220',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnPressed: { backgroundColor: '#155e75' },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: theme.text, fontWeight: '900', letterSpacing: 0.5 },
  btnTextDisabled: { color: theme.textMuted },
});
