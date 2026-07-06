import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PortraitFrame } from '@/components/PortraitFrame';
import { theme } from '@/constants/theme';
import { CREW_LEADS_BY_ID } from '@/data/crewLeads';
import { portraitForDepartmentLead } from '@/game/portraitAssets';
import type { DepartmentStatus } from '@/types/departmentBriefings';

function badgeColors(tone: DepartmentStatus['tone']): { bg: string; fg: string; border: string } {
  switch (tone) {
    case 'critical':
      return { bg: 'rgba(248, 113, 113, 0.14)', fg: theme.danger, border: 'rgba(248, 113, 113, 0.35)' };
    case 'warning':
      return { bg: 'rgba(251, 191, 36, 0.12)', fg: theme.warning, border: 'rgba(251, 191, 36, 0.35)' };
    default:
      return { bg: 'rgba(34, 211, 238, 0.10)', fg: theme.accent, border: 'rgba(34, 211, 238, 0.28)' };
  }
}

type Props = {
  status: DepartmentStatus;
  onRequestBriefing: () => void;
};

export function DepartmentBriefingCard({ status, onRequestBriefing }: Props) {
  const lead = CREW_LEADS_BY_ID[status.leadId];
  const label = lead ? `${lead.displayName} · ${lead.department}` : status.leadId;
  const role = lead?.fullTitle ?? 'Department Lead';
  const c = badgeColors(status.tone);
  const portrait = portraitForDepartmentLead(status.leadId);

  return (
    <Pressable onPress={onRequestBriefing} style={styles.card}>
      <View style={styles.topRow}>
        {portrait ? <PortraitFrame source={portrait} size={64} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.lead} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {role}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Text style={[styles.badgeText, { color: c.fg }]}>{status.badgeLabel}</Text>
        </View>
      </View>
      <Text style={styles.last} numberOfLines={3}>
        Last report: {status.shortReport}
      </Text>
      <Text style={styles.cta}>Request briefing ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBgSolid,
    padding: 14,
    marginBottom: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lead: { color: theme.text, fontWeight: '900', fontSize: 14 },
  role: { color: theme.textMuted, fontSize: 12, marginTop: 3, fontFamily: theme.fontMono },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  last: { color: theme.textMuted, marginTop: 10, fontSize: 13, lineHeight: 19 },
  cta: { color: theme.accent, marginTop: 10, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
});

