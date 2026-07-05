import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { formatCrewMessageDisplayName } from '@/game/crewMessagePresentation';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { CrewMessage } from '@/types';

type Props = {
  message: CrewMessage;
  actions: CrewAlertAction[];
  onAction: (action: CrewAlertAction) => void;
};

function buttonVariantForAction(a: CrewAlertAction): 'primary' | 'danger' | 'ghost' {
  if (a.style === 'danger') return 'danger';
  if (a.style === 'secondary') return 'ghost';
  return 'primary';
}

export function ActionableCrewAlert({ message, actions, onAction }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  if (!actions.length) return null;

  const speaker = formatCrewMessageDisplayName(message.speaker);
  const dept = message.department;
  const header = dept ? `${speaker} · ${dept}` : speaker;

  const primary = actions[0];
  const rest = actions.slice(1);
  const showRestInline = !compact && rest.length <= 2;

  return (
    <View
      style={[
        styles.wrap,
        message.severity === 'danger' ? styles.wrapDanger : message.severity === 'warning' ? styles.wrapWarn : null,
      ]}
    >
      <Text style={styles.header}>{header}</Text>
      <Text style={styles.body}>{message.text}</Text>

      <View style={[styles.row, showRestInline ? styles.rowInline : styles.rowStack]}>
        <PrimaryButton
          title={primary.label}
          variant={buttonVariantForAction(primary)}
          onPress={() => onAction(primary)}
          style={showRestInline ? styles.btnFlex : styles.btnFull}
        />
        {showRestInline
          ? rest.map((a) => (
              <PrimaryButton
                key={a.id}
                title={a.label}
                variant={buttonVariantForAction(a)}
                onPress={() => onAction(a)}
                style={styles.btnFlex}
              />
            ))
          : null}
      </View>
      {!showRestInline && rest.length ? (
        <View style={styles.more}>
          {rest.map((a) => (
            <PrimaryButton
              key={a.id}
              title={a.label}
              variant={buttonVariantForAction(a)}
              onPress={() => onAction(a)}
              style={styles.btnFull}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  wrapWarn: {
    borderColor: '#f59e0b66',
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
  },
  wrapDanger: {
    borderColor: theme.dangerBorder,
    backgroundColor: 'rgba(127, 29, 29, 0.14)',
  },
  header: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  body: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: theme.fontMono,
  },
  row: {
    marginTop: 12,
    gap: 8,
  },
  rowInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rowStack: {
    flexDirection: 'column',
  },
  btnFlex: {
    flex: 1,
    minWidth: 120,
  },
  btnFull: {
    marginTop: 0,
  },
  more: {
    marginTop: 8,
    gap: 8,
  },
});
