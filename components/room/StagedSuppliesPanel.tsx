import { StyleSheet, Text, View } from 'react-native';

import { HudPanel, HudSectionTitle } from '@/components/hud/HudPrimitives';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import type { RoomLoot } from '@/types';

export function StagedSuppliesPanel({
  staged,
  onCollect,
}: {
  staged: RoomLoot[];
  onCollect: (lootId: string) => void;
}) {
  return (
    <HudPanel>
      <HudSectionTitle>STAGED EMERGENCY SUPPLIES</HudSectionTitle>
      {staged.length === 0 ? (
        <Text style={styles.muted}>
          No supplies staged in this room. External recoveries may deposit supplies here.
        </Text>
      ) : (
        staged.map((l) => (
          <View key={l.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{l.name}</Text>
              <Text style={styles.meta}>
                {l.kind === 'emergency_supply' ? 'Emergency supply' : 'Repair supply'}
              </Text>
            </View>
            <PrimaryButton title="Collect" variant="ghost" disabled={l.collected} onPress={() => onCollect(l.id)} />
          </View>
        ))
      )}
    </HudPanel>
  );
}

const styles = StyleSheet.create({
  muted: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  name: { color: theme.text, fontWeight: '800' },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
});
