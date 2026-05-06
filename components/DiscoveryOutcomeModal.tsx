import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SafeIcon } from '@/components/SafeIcon';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import type { DiscoveryOutcomeBanner } from '@/types';

type Props = {
  visible: boolean;
  banner: DiscoveryOutcomeBanner | null;
  onDismiss: () => void;
};

export function DiscoveryOutcomeModal({ visible, banner, onDismiss }: Props) {
  if (!banner) return null;
  const tone =
    banner.severity === 'danger'
      ? styles.metaDanger
      : banner.severity === 'warning'
        ? styles.metaWarn
        : styles.metaOk;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Discovery result</Text>
          <Text style={[styles.title, tone]}>{banner.title}</Text>
          <Text style={styles.body}>{banner.body}</Text>
          <View style={styles.rewardChips}>
            <SafeIcon source={GAME_ASSETS.icons.scrap} size={34} />
            <SafeIcon source={GAME_ASSETS.icons.researchData} size={34} />
            <SafeIcon source={GAME_ASSETS.icons.artifact} size={34} />
          </View>
          <Text style={styles.chipHint}>Recoveries may add scrap, research, or relics.</Text>
          <PrimaryButton title="Understood" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000bb',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 12,
  },
  kicker: {
    color: theme.accent,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  title: { color: theme.text, fontSize: 18, fontWeight: '800' },
  body: { color: theme.textMuted, lineHeight: 22, fontSize: 14 },
  metaOk: { color: theme.ok },
  metaWarn: { color: theme.warning },
  metaDanger: { color: theme.danger },
  rewardChips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 4,
  },
  chipHint: { color: theme.textMuted, fontSize: 11, textAlign: 'center' },
});
