import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
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
    <ScreenShell scroll backgroundImage={GAME_ASSETS.captainsLogBackground} backgroundScrimOpacity={0.65}>
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
        <Text style={styles.label}>Story</Text>
        <Text style={styles.small}>
          Campaign overview and service record for DBX-07 operational history.
        </Text>
        <PrimaryButton title="Campaigns / Service Record" variant="ghost" onPress={() => router.push('/campaigns' as never)} />
      </PanelCard>
      <PanelCard>
        <Text style={styles.label}>Narrative</Text>
        <Text style={styles.small}>Review XO-style operational summaries without raw event dumps.</Text>
        <PrimaryButton title="Captain’s Log" variant="ghost" onPress={() => router.push('/captains-log')} />
      </PanelCard>
      {__DEV__ ? (
        <PanelCard>
          <Text style={styles.label}>Developer / QA</Text>
          <Text style={styles.small}>
            Fast-forward saves for internal story testing. Does not start dives or auto-resolve
            decisions. For internal testing only — not part of normal gameplay.
          </Text>
          <PrimaryButton
            title="QA: Advance to Dead Beacon ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_DEAD_BEACON' })}
          />
          <PrimaryButton
            title="QA: Advance to Return to DBX-03 ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_RETURN_DIVE' })}
          />
          <PrimaryButton
            title="QA: Advance to Growing Ocean monitoring ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_MONITORING' })}
          />
          <PrimaryButton
            title="QA: Advance to Command Pressure ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_COMMAND_PRESSURE' })}
          />
          <PrimaryButton
            title="QA: Advance to Abyssal Expansion Models ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_EXPANSION_MODELS' })}
          />
          <PrimaryButton
            title="QA: Advance to Engineering Stress Response ready"
            variant="ghost"
            onPress={() => dispatch({ type: 'QA_FAST_FORWARD_TO_ENGINEERING_STRESS' })}
          />
        </PanelCard>
      ) : null}
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
