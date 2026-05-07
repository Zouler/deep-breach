import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import type { ExternalDiscovery } from '@/types';

type Props = {
  visible: boolean;
  discovery: ExternalDiscovery;
  scanAvailable: boolean;
  onScan: () => void;
  onIgnore: () => void;
  onAttempt: () => void;
};

export function DiscoveryPromptModal({
  visible,
  discovery,
  scanAvailable,
  onScan,
  onIgnore,
  onAttempt,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onIgnore}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>External contact</Text>
          <Text style={styles.title}>{discovery.title}</Text>
          <Text style={styles.body}>{discovery.description}</Text>
          <Text style={styles.meta}>
            Estimated risk: {discovery.riskBand.toUpperCase()} · hazard ~{' '}
            {Math.round(discovery.hazardChanceDisplay * 100)}% · reward quality ~{' '}
            {Math.round(discovery.rewardQualityDisplay * 100)}%
          </Text>
          <Text style={styles.hint}>{discovery.rewardHint}</Text>
          {discovery.scanned ? (
            <Text style={styles.scanned}>
              {discovery.scanNarrative ?? 'Scan complete — margins refined.'}
            </Text>
          ) : null}
          <View style={styles.actions}>
            {scanAvailable && !discovery.scanned ? (
              <PrimaryButton
                title="Scan first"
                variant="ghost"
                iconLeft={GAME_ASSETS.icons.scanArea}
                iconLeftSize={24}
                onPress={onScan}
              />
            ) : null}
            <PrimaryButton title="Attempt recovery" onPress={onAttempt} />
            <PrimaryButton title="Ignore contact" variant="ghost" onPress={onIgnore} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 10,
  },
  kicker: {
    color: theme.accent,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  body: { color: theme.textMuted, lineHeight: 20 },
  meta: { color: theme.text, fontWeight: '600', fontSize: 13 },
  hint: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
  scanned: { color: theme.ok, fontWeight: '700', fontSize: 12 },
  actions: { marginTop: 8, gap: 8 },
});
