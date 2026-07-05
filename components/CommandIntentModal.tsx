import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { ROUTE_OPTIONS } from '@/game/navigation';
import type { DiveRoute } from '@/types';

type Props = {
  visible: boolean;
  currentRoute: DiveRoute | undefined;
  onSelect: (route: DiveRoute) => void;
  onClose: () => void;
};

export function CommandIntentModal({ visible, currentRoute, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Command Intent</Text>
          <Text style={styles.subtitle}>
            Issue orders; department leads execute the intent. Tap to switch.
          </Text>
          {ROUTE_OPTIONS.map((r) => (
            <View key={r.id} style={styles.row}>
              <PrimaryButton
                title={`${r.label}${currentRoute === r.id ? ' · active' : ''}`}
                variant={currentRoute === r.id ? 'primary' : 'ghost'}
                onPress={() => onSelect(r.id as DiveRoute)}
              />
              <Text style={styles.effect}>{r.effectLine}</Text>
            </View>
          ))}
          <PrimaryButton title="Close" variant="ghost" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: theme.panelBgSolid,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  title: { color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 4 },
  subtitle: { color: theme.textMuted, marginBottom: 10, fontSize: 12 },
  row: { marginBottom: 10 },
  effect: { color: theme.textMuted, fontSize: 11, lineHeight: 15, marginTop: 4, marginLeft: 2 },
});
