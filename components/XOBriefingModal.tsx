import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';

type Props = {
  visible: boolean;
  paragraphs: string[];
  suggestCaptainLog: boolean;
  showReturnToBase: boolean;
  onContinue: () => void;
  onReviewCaptainLog: () => void;
  onReturnToBase?: () => void;
};

export function XOBriefingModal({
  visible,
  paragraphs,
  suggestCaptainLog,
  showReturnToBase,
  onContinue,
  onReviewCaptainLog,
  onReturnToBase,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <Pressable style={styles.backdrop} onPress={onContinue}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.kicker}>XO BRIEFING · EXECUTIVE OFFICER</Text>
          <Text style={styles.headline}>Previously on Deep Breach</Text>
          <View style={styles.body}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.para}>
                {p}
              </Text>
            ))}
            {suggestCaptainLog ? (
              <Text style={styles.hint}>Long interval — review Captain’s Log when you have a moment.</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <PrimaryButton title="Continue command" onPress={onContinue} />
            <PrimaryButton title="Review Captain’s Log" variant="ghost" onPress={onReviewCaptainLog} />
            {showReturnToBase && onReturnToBase ? (
              <PrimaryButton title="Return to base" variant="ghost" onPress={onReturnToBase} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000b18ee',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44, 217, 255, 0.35)',
    backgroundColor: 'rgba(0, 5, 14, 0.94)',
    padding: 18,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  kicker: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headline: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  body: { gap: 10, marginBottom: 16 },
  para: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: { gap: 10 },
});
