import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { theme } from '@/constants/theme';
import {
  ASSIGNMENT_BRIEFING_BODY,
  ASSIGNMENT_MEMO,
} from '@/data/storyBriefings';

function PortraitFrame({
  initials,
  caption,
  sub,
}: {
  initials: string;
  caption: string;
  sub?: string;
}) {
  return (
    <View style={styles.portraitCol}>
      <View style={styles.portraitRing}>
        <Text style={styles.portraitInitials}>{initials}</Text>
      </View>
      <Text style={styles.portraitCaption}>{caption}</Text>
      {sub ? <Text style={styles.portraitSub}>{sub}</Text> : null}
    </View>
  );
}

export function AssignmentMemoFrame() {
  const m = ASSIGNMENT_MEMO;
  return (
    <>
      <Text style={styles.kicker}>{m.headerKicker}</Text>
      <Text style={styles.docTitle}>{m.documentTitle}</Text>

      <View style={styles.portraitRow}>
        <PortraitFrame initials="PC" caption="Program" sub="Sender" />
        <PortraitFrame initials="PR" caption="Commander" sub="Recipient" />
        <PortraitFrame initials="07" caption="DBX" sub="Seal" />
      </View>

      <PanelCard style={styles.memoCard}>
        <View style={styles.memoRow}>
          <Text style={styles.memoKey}>{m.fromLabel}</Text>
          <Text style={styles.memoVal}>{m.fromValue}</Text>
        </View>
        <View style={styles.memoRow}>
          <Text style={styles.memoKey}>{m.toLabel}</Text>
          <Text style={styles.memoVal}>{m.toValue}</Text>
        </View>
        <View style={styles.memoRow}>
          <Text style={styles.memoKey}>{m.subjectLabel}</Text>
          <Text style={styles.memoVal}>{m.subjectValue}</Text>
        </View>
        <View style={styles.memoRow}>
          <Text style={styles.memoKey}>{m.programLabel}</Text>
          <Text style={styles.memoVal}>{m.programValue}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.body}>{ASSIGNMENT_BRIEFING_BODY}</Text>
        <View style={styles.divider} />
        <Text style={styles.signoff}>{m.signoff}</Text>
        <Text style={styles.classification}>{m.classification}</Text>
      </PanelCard>
    </>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: theme.accent,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  docTitle: { color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  portraitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  portraitCol: { flex: 1, alignItems: 'center' },
  portraitRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#38bdf8aa',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  portraitInitials: { color: theme.accent, fontWeight: '900', fontSize: 14 },
  portraitCaption: { color: theme.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  portraitSub: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  memoCard: {
    borderColor: theme.panelBorderStrong,
    backgroundColor: '#020617ee',
    marginBottom: 8,
  },
  memoRow: { marginBottom: 8 },
  memoKey: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  memoVal: { color: theme.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  divider: {
    height: 1,
    backgroundColor: theme.panelBorder,
    marginVertical: 12,
  },
  body: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  signoff: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 6,
  },
  classification: {
    color: theme.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
    fontStyle: 'italic',
  },
});
