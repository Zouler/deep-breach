import { StyleSheet, Text, View } from 'react-native';

import { HudPanel } from '@/components/hud/HudPrimitives';
import { theme } from '@/constants/theme';
import type { RoomDamageBadge } from '@/game/roomDetailHelpers';

function badgeColors(badge: RoomDamageBadge): { bg: string; border: string; fg: string } {
  switch (badge) {
    case 'SAFE':
      return { bg: theme.okBg, border: '#22c55e55', fg: '#86efac' };
    case 'WARNING':
      return { bg: theme.warningBg, border: '#f59e0b55', fg: '#fcd34d' };
    case 'DAMAGED':
      return { bg: '#43140755', border: '#fb923c66', fg: '#fdba74' };
    case 'CRITICAL':
      return { bg: theme.dangerBg, border: '#fb718588', fg: '#fecaca' };
    default:
      return { bg: theme.panelBg, border: theme.panelBorder, fg: theme.text };
  }
}

export function RoomDamageHeader({
  roomName,
  badge,
  breachCount,
  totalLeakPerSecond,
}: {
  roomName: string;
  badge: RoomDamageBadge;
  breachCount: number;
  totalLeakPerSecond: number;
}) {
  const c = badgeColors(badge);
  return (
    <HudPanel>
      <Text style={styles.roomName}>{roomName}</Text>
      <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={[styles.badgeText, { color: c.fg }]}>{badge}</Text>
      </View>
      <Text style={styles.meta}>
        {breachCount} active breach{breachCount === 1 ? '' : 'es'}
      </Text>
      <Text style={styles.meta}>Total leak: {totalLeakPerSecond.toFixed(2)} u/s</Text>
    </HudPanel>
  );
}

const styles = StyleSheet.create({
  roomName: { color: theme.text, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeText: { fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  meta: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
});
