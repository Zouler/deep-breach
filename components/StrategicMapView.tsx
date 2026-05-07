import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { ROUTE_OPTIONS } from '@/game/navigation';
import type { DiveRoute } from '@/types';

type Props = {
  missionName: string;
  targetDepthM: number;
  currentDepthM: number;
  rangeKm: number;
  route: DiveRoute;
};

export function StrategicMapView({ missionName, targetDepthM, currentDepthM, rangeKm, route }: Props) {
  const depthPct = targetDepthM > 0 ? Math.min(1, Math.max(0, currentDepthM / targetDepthM)) : 0;
  const rangeLabel = rangeKm.toFixed(1);
  const routeLabel = ROUTE_OPTIONS.find((r) => r.id === route)?.label ?? '—';

  return (
    <View style={styles.card}>
      <Text style={styles.mission}>{missionName}</Text>
      <Text style={styles.meta}>Intent: {routeLabel}</Text>

      <View style={styles.trackRow}>
        <View style={styles.baseDot}>
          <Text style={styles.baseLbl}>Base</Text>
        </View>
        <View style={styles.lineWrap}>
          <View style={styles.line} />
          <View style={[styles.posMarker, { left: `${Math.min(92, Math.max(8, depthPct * 100))}%` }]} />
          <View style={[styles.objMarker, { right: 0 }]} />
        </View>
        <View style={styles.objDot}>
          <Text style={styles.objLbl}>Objective</Text>
        </View>
      </View>

      <Text style={styles.abstract}>Abstract track · not to scale</Text>

      <View style={styles.stats}>
        <Text style={styles.statLine}>
          Depth: {Math.round(currentDepthM)}m / Target: {Math.round(targetDepthM)}m
        </Text>
        <Text style={styles.statLine}>Range from launch: {rangeLabel} km</Text>
        <Text style={styles.statLine}>Progress (depth): {Math.round(depthPct * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(4, 10, 24, 0.95)',
  },
  mission: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 14,
    fontFamily: theme.fontMono,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  baseDot: {
    width: 52,
    alignItems: 'center',
  },
  baseLbl: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  objDot: {
    width: 64,
    alignItems: 'center',
  },
  objLbl: {
    color: theme.ok,
    fontSize: 10,
    fontWeight: '800',
  },
  lineWrap: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  line: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(34, 211, 238, 0.35)',
  },
  posMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22d3ee',
    borderWidth: 1,
    borderColor: '#0c4a6e',
    marginLeft: -6,
    top: 8,
  },
  objMarker: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.ok,
    top: 9,
    marginRight: -5,
  },
  abstract: {
    color: theme.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  stats: {
    gap: 6,
  },
  statLine: {
    color: theme.text,
    fontSize: 14,
    fontFamily: theme.fontMono,
  },
});
