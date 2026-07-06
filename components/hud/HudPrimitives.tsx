import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { monoData, theme } from '@/constants/theme';
import type { GaugeTone } from '@/game/threatLevels';

const GAUGE_TICKS = 10;

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
      return theme.ok;
    case 'warning':
      return theme.phosphorAmber;
    case 'danger':
      return theme.warning;
    case 'critical':
      return theme.emergencyRed;
    default:
      return theme.instrumentCyan;
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
  const filledTicks = Math.round((pct / 100) * GAUGE_TICKS);
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeTop}>
        <Text style={styles.gaugeLabel}>{label.toUpperCase()}</Text>
        <Text style={[styles.gaugeValue, { color: c }]}>{Math.round(pct).toString().padStart(3, ' ')}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c }]} />
        <View style={styles.tickOverlay} pointerEvents="none">
          {Array.from({ length: GAUGE_TICKS - 1 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tickMark,
                { left: `${((i + 1) / GAUGE_TICKS) * 100}%` },
                i + 1 <= filledTicks ? styles.tickMarkLit : null,
              ]}
            />
          ))}
        </View>
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
        <Text style={styles.btnTitle}>{title.toUpperCase()}</Text>
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
        <Text style={styles.emergencyTitle}>{title.toUpperCase()}</Text>
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
  lines: { id: string; speaker: string; severity: 'info' | 'warning' | 'danger'; text: string }[];
}) {
  if (lines.length === 0) {
    return (
      <Text style={styles.muted}>
        [ STBY ] Quiet channel — no active advisories.
      </Text>
    );
  }
  return (
    <View style={{ gap: 6 }}>
      {lines.map((m) => (
        <Text key={m.id} style={styles.alertLine}>
          <Text style={styles.alertStamp}>[{m.severity.toUpperCase()}] </Text>
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
    borderRadius: theme.radiusInstrument,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  panelDefault: {
    borderColor: theme.panelBorderStrong,
    backgroundColor: theme.panelBg,
  },
  panelEmergency: {
    borderColor: theme.dangerBorder,
    backgroundColor: '#2a060acc',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionRight: { marginLeft: 10 },
  sectionTitle: {
    color: theme.instrumentCyan,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  gauge: { marginTop: 10 },
  gaugeTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' },
  gaugeLabel: { color: theme.mutedSteel, fontSize: 10, letterSpacing: 0.6 },
  gaugeValue: {
    ...monoData,
    fontWeight: '800',
    fontSize: 13,
  },
  track: {
    height: 12,
    borderRadius: 2,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: theme.panelBorderFaint,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: { height: '100%', borderRadius: 1 },
  tickOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ffffff18',
    marginLeft: -1,
  },
  tickMarkLit: {
    backgroundColor: '#ffffff33',
  },
  tacticalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radiusInstrument,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: theme.panelBgSoft,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radiusInstrument,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    backgroundColor: theme.dangerBg,
  },
  btnIcon: { opacity: 0.95 },
  btnTitle: {
    color: theme.paperBone,
    fontFamily: theme.fontMono,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  btnSubtitle: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  emergencyTitle: {
    color: '#fecaca',
    fontFamily: theme.fontMono,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  emergencySubtitle: { color: '#fecaca99', fontSize: 11, marginTop: 2 },
  btnChevron: { color: theme.mutedSteel, fontSize: 22, marginLeft: 8 },
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
  roomTitle: { color: theme.text, fontWeight: '900', fontSize: 13 },
  roomSubtitle: { color: theme.textMuted, fontSize: 11, marginTop: 2, fontFamily: theme.fontMono },
  muted: { color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 11 },
  alertLine: { color: theme.textMuted, fontSize: 11, lineHeight: 17, fontFamily: theme.fontMono },
  alertStamp: { color: theme.mutedSteel, fontWeight: '700' },
  alertSpeaker: { color: theme.instrumentCyan, fontWeight: '800' },
  alertWarn: { color: theme.phosphorAmber, fontWeight: '800' },
  alertDanger: { color: theme.emergencyRed, fontWeight: '800' },
});
