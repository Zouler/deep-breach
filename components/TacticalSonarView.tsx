import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { sonarBlipEmphasis, sonarLegendLabel } from '@/game/sonarContacts';
import type { DiveRoute } from '@/types';
import type { SonarContact, SonarContactType } from '@/types/navigationMap';

function blipColor(type: SonarContactType, risk: SonarContact['risk'], source: SonarContact['source']): string {
  if (source === 'ambient' && type === 'terrain') return '#5eead4aa';
  if (type === 'hazard') return risk === 'high' ? '#fb7185' : '#fbbf24';
  if (type === 'volcanic' || type === 'thermal') return '#fb923c';
  if (type === 'signal' || type === 'unknown') return '#a78bfa';
  if (type === 'salvage' || type === 'wreck') return theme.accent;
  return '#38bdf8cc';
}

type Props = {
  contacts: SonarContact[];
  route: DiveRoute;
  size?: number;
};

export function TacticalSonarView({ contacts, route, size = 280 }: Props) {
  const rings = useMemo(() => [0.28, 0.52, 0.76], []);
  const center = size / 2;
  const maxM = 2800;

  return (
    <View style={styles.wrap}>
      <View style={[styles.radar, { width: size, height: size, borderRadius: size / 2 }]}>
        {rings.map((r) => (
          <View
            key={r}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: size * r,
                height: size * r,
                borderRadius: (size * r) / 2,
                left: (size * (1 - r)) / 2,
                top: (size * (1 - r)) / 2,
              },
            ]}
          />
        ))}
        <View pointerEvents="none" style={[styles.axisV, { left: center - 0.5, height: size * 0.92, top: size * 0.04 }]} />
        <View pointerEvents="none" style={[styles.axisH, { top: center - 0.5, width: size * 0.92, left: size * 0.04 }]} />
        <View
          style={[
            styles.centerVessel,
            {
              width: 14,
              height: 14,
              borderRadius: 7,
              left: center - 7,
              top: center - 7,
            },
          ]}
        />
        {contacts.map((c) => {
          const t = Math.min(1, c.distanceMeters / maxM);
          const rad = (0.14 + t * 0.34) * (size / 2);
          const br = (c.bearingDeg * Math.PI) / 180;
          const ex = Math.sin(br) * rad;
          const ey = -Math.cos(br) * rad;
          const em = sonarBlipEmphasis(c.type, route);
          const w = Math.max(7, 10 * em);
          const opacity = 0.55 + 0.45 * Math.min(1.2, em);
          return (
            <View
              key={c.id}
              style={[
                styles.blip,
                {
                  width: w,
                  height: w,
                  borderRadius: w / 2,
                  left: center + ex - w / 2,
                  top: center + ey - w / 2,
                  backgroundColor: blipColor(c.type, c.risk, c.source),
                  opacity,
                  borderWidth: c.source === 'active' ? 1.5 : 0,
                  borderColor: '#e2e8f0',
                },
              ]}
            />
          );
        })}
        <Text style={[styles.north, { top: 6 }]}>N</Text>
        <Text style={[styles.mark, { bottom: 8, alignSelf: 'center' }]}>S</Text>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        {(
          [
            'salvage',
            'signal',
            'thermal',
            'volcanic',
            'terrain',
            'wreck',
            'unknown',
            'hazard',
          ] as SonarContactType[]
        ).map((t) => (
          <View key={t} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: blipColor(t, 'low', 'ambient') }]} />
            <Text style={styles.legendText}>{sonarLegendLabel(t)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 14,
  },
  radar: {
    backgroundColor: 'rgba(2, 8, 20, 0.96)',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.45)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.22)',
  },
  axisV: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  axisH: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  centerVessel: {
    position: 'absolute',
    backgroundColor: '#22d3ee',
    borderWidth: 1,
    borderColor: '#0c4a6e',
  },
  blip: {
    position: 'absolute',
  },
  north: {
    position: 'absolute',
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '900',
    alignSelf: 'center',
  },
  mark: {
    position: 'absolute',
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  legend: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(6, 14, 28, 0.92)',
  },
  legendTitle: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: theme.textMuted,
    fontSize: 12,
    fontFamily: theme.fontMono,
  },
});
