import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { INTERNAL_CREW_EVENTS_BY_ID } from '@/data/internalCrewEvents';
import { useGame } from '@/context/GameContext';
import { shouldHideInternalCrewEventModal } from '@/game/diveTransientState';
import type { InternalCrewEvent } from '@/types';

type Props = {
  visible: boolean;
  event: InternalCrewEvent | null;
  onResolve: (eventId: string, optionId: string) => void;
};

export function InternalCrewEventModal({ visible, event, onResolve }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !event) setSelectedOptionId(null);
  }, [visible, event?.id]);

  if (!event) return null;

  const selected = selectedOptionId
    ? event.options.find((o) => o.id === selectedOptionId) ?? null
    : null;

  const headerDept = event.department ? `${event.speakerName} · ${event.department}` : event.speakerName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <View style={styles.scrim}>
        <View
          style={[
            styles.sheet,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              maxHeight: '88%',
            },
          ]}
        >
          <Text style={styles.kicker}>Crew event</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.speakerLine}>{headerDept}</Text>

          {!selected ? (
            <>
              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.body}>{event.description}</Text>
              </ScrollView>
              <View style={styles.optionStack}>
                {event.options.map((opt) => (
                  <PrimaryButton
                    key={opt.id}
                    title={opt.label}
                    variant="ghost"
                    onPress={() => setSelectedOptionId(opt.id)}
                  />
                ))}
              </View>
            </>
          ) : (
            <>
              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.outcomeLabel}>Outcome</Text>
                <Text style={styles.body}>{selected.outcomeText}</Text>
              </ScrollView>
              <PrimaryButton
                title="Acknowledge"
                onPress={() => onResolve(event.id, selected.id)}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Renders pending internal crew event modal above navigation (must be under `GameProvider`). */
export function InternalCrewEventHost() {
  const { state, dispatch } = useGame();
  const id = state.pendingInternalCrewEventId;
  const ev = id ? INTERNAL_CREW_EVENTS_BY_ID[id] ?? null : null;
  const hideForReport = shouldHideInternalCrewEventModal(state);

  return (
    <InternalCrewEventModal
      visible={Boolean(ev) && !hideForReport}
      event={ev}
      onResolve={(eventId, optionId) => {
        dispatch({ type: 'RESOLVE_INTERNAL_CREW_EVENT', eventId, optionId });
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 3, 12, 0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    backgroundColor: 'rgba(6, 14, 32, 0.98)',
    paddingHorizontal: 18,
  },
  kicker: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  speakerLine: {
    color: theme.textMuted,
    fontSize: 13,
    fontFamily: theme.fontMono,
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 280,
    marginBottom: 12,
  },
  body: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
  },
  outcomeLabel: {
    color: theme.accent,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  optionStack: {
    gap: 8,
    marginTop: 4,
  },
});
