import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@deep_breach/audio_prefs_v1';

export type AudioUserSettings = {
  sfxEnabled: boolean;
  ambienceEnabled: boolean;
  /** 0–1 master multiplier applied to SFX and ambience. */
  masterVolume: number;
};

const DEFAULTS: AudioUserSettings = {
  sfxEnabled: true,
  ambienceEnabled: true,
  masterVolume: 1,
};

export async function loadAudioSettings(): Promise<AudioUserSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AudioUserSettings>;
    return {
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : DEFAULTS.sfxEnabled,
      ambienceEnabled:
        typeof parsed.ambienceEnabled === 'boolean' ? parsed.ambienceEnabled : DEFAULTS.ambienceEnabled,
      masterVolume:
        typeof parsed.masterVolume === 'number' &&
        Number.isFinite(parsed.masterVolume) &&
        parsed.masterVolume >= 0 &&
        parsed.masterVolume <= 1
          ? parsed.masterVolume
          : DEFAULTS.masterVolume,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveAudioSettings(settings: AudioUserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
