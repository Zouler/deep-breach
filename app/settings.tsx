import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { clearGameState } from '@/storage/gameStorage';

export default function SettingsScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [haptics, setHaptics] = useState(true);

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>Settings</Text>
      <PanelCard>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Haptic cues (mock)</Text>
            <Text style={styles.small}>Local-only preference — not persisted in MVP.</Text>
          </View>
          <Switch value={haptics} onValueChange={setHaptics} thumbColor={theme.accent} />
        </View>
      </PanelCard>
      <PanelCard>
        <Text style={styles.label}>Danger zone</Text>
        <Text style={styles.small}>
          Clears AsyncStorage save and resets the profile. No cloud, no accounts — local wipe only.
        </Text>
        <PrimaryButton
          title="Erase Local Save"
          variant="danger"
          onPress={async () => {
            await clearGameState();
            dispatch({ type: 'NEW_GAME' });
            router.replace('/');
          }}
        />
      </PanelCard>
      <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: theme.text, fontWeight: '700' },
  small: { color: theme.textMuted, marginTop: 4, fontSize: 12, lineHeight: 18 },
});
