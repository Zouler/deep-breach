import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { gameAudio } from '@/game/audioManager';
import {
  loadAudioSettings,
  saveAudioSettings,
  type AudioUserSettings,
} from '@/storage/audioSettingsStorage';
import { clearGameState } from '@/storage/gameStorage';

export default function SettingsScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [haptics, setHaptics] = useState(true);
  const [audioPrefs, setAudioPrefs] = useState<AudioUserSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAudioSettings().then((s) => {
      if (!cancelled) setAudioPrefs(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistAudio = useCallback((next: AudioUserSettings) => {
    setAudioPrefs(next);
    gameAudio.applyUserSettings(next);
    void saveAudioSettings(next);
  }, []);

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>Settings</Text>
      <PanelCard>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Sound effects</Text>
            <Text style={styles.small}>Scans, repairs, alerts, and pickups.</Text>
          </View>
          <Switch
            value={audioPrefs?.sfxEnabled ?? true}
            disabled={!audioPrefs}
            onValueChange={(v) => {
              if (audioPrefs) persistAudio({ ...audioPrefs, sfxEnabled: v });
            }}
            thumbColor={theme.accent}
          />
        </View>
        <View style={[styles.row, styles.rowSpaced]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Submarine ambience</Text>
            <Text style={styles.small}>Low loop while on an active dive.</Text>
          </View>
          <Switch
            value={audioPrefs?.ambienceEnabled ?? true}
            disabled={!audioPrefs}
            onValueChange={(v) => {
              if (audioPrefs) persistAudio({ ...audioPrefs, ambienceEnabled: v });
            }}
            thumbColor={theme.accent}
          />
        </View>
      </PanelCard>
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
        <Text style={styles.label}>Story</Text>
        <Text style={styles.small}>Campaign overview and future acts (visual only in MVP).</Text>
        <PrimaryButton title="Campaigns / Service Record" variant="ghost" onPress={() => router.push('/campaigns' as never)} />
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
  rowSpaced: { marginTop: 14 },
  label: { color: theme.text, fontWeight: '700' },
  small: { color: theme.textMuted, marginTop: 4, fontSize: 12, lineHeight: 18 },
});
