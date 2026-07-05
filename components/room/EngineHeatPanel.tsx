import { StyleSheet, Text } from 'react-native';

import { HudPanel, HudSectionTitle, StatusBarGauge, TacticalButton } from '@/components/hud/HudPrimitives';
import { theme } from '@/constants/theme';
import { ENGINE_HEAT_CRITICAL_PCT, ENGINE_HEAT_WARNING_PCT } from '@/game/engineHeat';
import { formatThreatLabel, threatForLowerIsBetter, threatToGaugeTone } from '@/game/threatLevels';

export function EngineHeatPanel({
  heatPercent,
  ventReady,
  ventCooldownLeftMs,
  onVent,
}: {
  heatPercent: number;
  ventReady: boolean;
  ventCooldownLeftMs: number;
  onVent: () => void;
}) {
  const threat = threatForLowerIsBetter(heatPercent);
  const critical = heatPercent >= ENGINE_HEAT_CRITICAL_PCT;
  const warning = heatPercent >= ENGINE_HEAT_WARNING_PCT;

  return (
    <HudPanel variant={critical ? 'emergency' : 'default'}>
      <HudSectionTitle>ENGINE HEAT</HudSectionTitle>
      <StatusBarGauge label="Core temperature" value={heatPercent} tone={threatToGaugeTone(threat)} />
      <Text style={styles.status}>{formatThreatLabel(threat)}</Text>
      {critical ? (
        <Text style={styles.warnLine}>
          Overheating — stressing the hull and oxygen scrubbers until vented.
        </Text>
      ) : warning ? (
        <Text style={styles.warnLine}>Running hot. Vent before it reaches critical.</Text>
      ) : null}
      <TacticalButton
        title={ventReady ? 'Vent Heat' : 'Venting Cooling'}
        subtitle={
          ventReady
            ? 'Bleed off excess heat (no repair kit required).'
            : `Cooling ${Math.max(1, Math.ceil(ventCooldownLeftMs / 1000))}s`
        }
        disabled={!ventReady}
        onPress={onVent}
      />
    </HudPanel>
  );
}

const styles = StyleSheet.create({
  status: { color: theme.textMuted, fontSize: 12, marginTop: 4, fontWeight: '700' },
  warnLine: { color: theme.warning, fontSize: 12, lineHeight: 17, marginTop: 8, marginBottom: 8 },
});
