import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import type { DepartmentBriefing } from '@/types/departmentBriefings';
import type { CrewAlertAction } from '@/types/crewAlerts';

type Props = {
  visible: boolean;
  briefing: DepartmentBriefing | null;
  onDismiss: () => void;
  onAction?: (action: CrewAlertAction) => void;
};

function variantForAction(a: CrewAlertAction): 'primary' | 'ghost' | 'danger' {
  if (a.style === 'danger') return 'danger';
  if (a.style === 'secondary') return 'ghost';
  return 'primary';
}

export function DepartmentBriefingModal({ visible, briefing, onDismiss, onAction }: Props) {
  if (!briefing) return null;
  const actions = briefing.actions ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.kicker}>COMMAND BRIEFING</Text>
          <Text style={styles.headline}>{briefing.title}</Text>
          <View style={styles.body}>
            {briefing.paragraphs.map((p, i) => (
              <Text key={i} style={styles.para}>
                {p}
              </Text>
            ))}
            {briefing.recommendation ? (
              <Text style={styles.reco}>Recommendation: {briefing.recommendation}</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            {actions.slice(0, 3).map((a) => (
              <PrimaryButton
                key={a.id}
                title={a.label}
                variant={variantForAction(a)}
                onPress={() => onAction?.(a)}
              />
            ))}
            <PrimaryButton title="Close" variant="ghost" onPress={onDismiss} />
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
    maxWidth: 560,
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
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  body: { gap: 10, marginBottom: 16 },
  para: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.fontMono,
  },
  reco: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: { gap: 10 },
});

