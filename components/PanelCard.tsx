import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { theme } from '@/constants/theme';

export type PanelCardVariant = 'instrument' | 'document' | 'danger';

type Props = ViewProps & {
  variant?: PanelCardVariant;
  /** Optional title rail above panel body */
  title?: string;
};

function variantStyle(variant: PanelCardVariant) {
  switch (variant) {
    case 'document':
      return styles.document;
    case 'danger':
      return styles.danger;
    default:
      return styles.instrument;
  }
}

function CornerTicks() {
  const tick = styles.cornerTick;
  return (
    <>
      <View style={[tick, styles.tickTL]} />
      <View style={[tick, styles.tickTR]} />
      <View style={[tick, styles.tickBL]} />
      <View style={[tick, styles.tickBR]} />
    </>
  );
}

export function PanelCard({ style, variant = 'instrument', title, children, ...rest }: Props) {
  return (
    <View style={[styles.wrap, variantStyle(variant), style]} {...rest}>
      <CornerTicks />
      {title ? (
        <View style={styles.titleRail}>
          <View style={styles.titleRailMark} />
          <Text style={styles.titleRailText}>{title.toUpperCase()}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const TICK = 8;
const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  instrument: {
    backgroundColor: theme.panelBg,
    borderColor: theme.panelBorderStrong,
    borderRadius: theme.radiusInstrument,
  },
  document: {
    backgroundColor: theme.panelBgSolid,
    borderColor: theme.mutedSteel,
    borderRadius: theme.radiusInstrument,
  },
  danger: {
    backgroundColor: theme.dangerBg,
    borderColor: theme.dangerBorder,
    borderRadius: theme.radiusInstrument,
  },
  cornerTick: {
    position: 'absolute',
    width: TICK,
    height: TICK,
    borderColor: theme.cornerTick,
  },
  tickTL: { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2 },
  tickTR: { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2 },
  tickBL: { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2 },
  tickBR: { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2 },
  titleRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: -2,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.panelBorderFaint,
  },
  titleRailMark: {
    width: 3,
    height: 14,
    backgroundColor: theme.instrumentCyan,
  },
  titleRailText: {
    color: theme.instrumentCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
});
