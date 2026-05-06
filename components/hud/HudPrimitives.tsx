import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';
import type { GaugeTone } from '@/game/threatLevels';

export function HudPanel({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'emergency';
}) {
  return (
    <View style={[styles.panel, variant === 'emergency' ? styles.panelEmergency : styles.panelDefault]}>
      {children}
    </View>
  );
}

export function HudSectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right ? <View style={styles.sectionRight}>{right}</View> : null}
    </View>
  );
}

function toneColor(tone: GaugeTone): string {
  switch (tone) {
    case 'ok':
      return '#22c55e';
    case 'warning':
      return '#f59e0b';
    case 'danger':
      return '#fb923c';
    case 'critical':
      return '#fb7185';
    default:
      return '#38bdf8';
  }
}

export function StatusBarGauge({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: GaugeTone;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const c = toneColor(tone);
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeTop}>
        <Text style={styles.gaugeLabel}>{label}</Text>
        <Text style={styles.gaugeValue}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c }]} />
      </View>
    </View>
  );
}

export function TacticalButton({
  title,
  subtitle,
  icon,
  disabled,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tacticalBtn,
        disabled ? styles.btnDisabled : null,
        pressed ? styles.btnPressed : null,
      ]}
    >
      {icon ? <SafeIcon source={icon} size={22} style={styles.btnIcon} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.btnTitle}>{title}</Text>
        {subtitle ? <Text style={styles.btnSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.btnChevron}>›</Text>
    </Pressable>
  );
}

export function EmergencyButton({
  title,
  subtitle,
  disabled,
  onPress,
}: {
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.emergencyBtn,
        disabled ? styles.btnDisabled : null,
        pressed ? styles.emergencyPressed : null,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.emergencyTitle}>{title}</Text>
        {subtitle ? <Text style={styles.emergencySubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.btnChevron}>›</Text>
    </Pressable>
  );
}

export function CompactRoomRow({
  title,
  subtitle,
  leftIcon,
  accentColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  leftIcon?: any;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.roomRow, { borderLeftColor: accentColor }]}>
      {leftIcon ? <SafeIcon source={leftIcon} size={18} style={styles.roomIcon} /> : <View style={{ width: 18 }} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.roomTitle}>{title}</Text>
        <Text style={styles.roomSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.btnChevron}>›</Text>
    </Pressable>
  );
}

export function AlertFeedCompact({
  lines,
}: {
  lines: Array<{ id: string; speaker: string; severity: 'info' | 'warning' | 'danger'; text: string }>;
}) {
  if (lines.length === 0) {
    return <Text style={styles.muted}>Quiet channel — standing by.</Text>;
  }
  return (
    <View style={{ gap: 6 }}>
      {lines.map((m) => (
        <Text key={m.id} style={styles.alertLine}>
          <Text
            style={
              m.severity === 'danger'
                ? styles.alertDanger
                : m.severity === 'warning'
                  ? styles.alertWarn
                  : styles.alertSpeaker
            }
          >
            {m.speaker}:{' '}
          </Text>
          {m.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  panelDefault: {
    borderColor: '#38bdf833',
    backgroundColor: '#020617cc',
  },
  panelEmergency: {
    borderColor: '#fb718566',
    backgroundColor: '#2a060acc',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionRight: { marginLeft: 10 },
  sectionTitle: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gauge: { marginTop: 10 },
  gaugeTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  gaugeLabel: { color: theme.textMuted, fontSize: 12 },
  gaugeValue: { color: theme.text, fontWeight: '800', fontSize: 12 },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#38bdf822',
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  tacticalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf833',
    backgroundColor: '#020617aa',
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fb718566',
    backgroundColor: '#450a0a66',
  },
  btnIcon: { opacity: 0.95 },
  btnTitle: { color: theme.text, fontWeight: '900' },
  btnSubtitle: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  emergencyTitle: { color: '#fecaca', fontWeight: '900' },
  emergencySubtitle: { color: '#fecaca99', fontSize: 12, marginTop: 2 },
  btnChevron: { color: theme.textMuted, fontSize: 22, marginLeft: 8 },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { backgroundColor: '#0b1220cc' },
  emergencyPressed: { backgroundColor: '#7f1d1d66' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f172a88',
    borderLeftWidth: 3,
  },
  roomIcon: { marginRight: 2 },
  roomTitle: { color: theme.text, fontWeight: '900' },
  roomSubtitle: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  muted: { color: theme.textMuted },
  alertLine: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
  alertSpeaker: { color: theme.accent, fontWeight: '800' },
  alertWarn: { color: theme.warning, fontWeight: '800' },
  alertDanger: { color: theme.danger, fontWeight: '800' },
});

