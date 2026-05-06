import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import {
  AUDIO_AMBIENCE_SOURCE,
  AUDIO_SFX_SOURCES,
  type SfxId,
} from '@/constants/audioAssets';
import type { AudioUserSettings } from '@/storage/audioSettingsStorage';

const WARNING_COOLDOWN_MS = 10_000;
const CRITICAL_COOLDOWN_MS = 6_000;
/** User-requested ambience bed level (~0.25–0.35). */
const AMBIENCE_RELATIVE_GAIN = 0.32;

function devWarn(...args: unknown[]) {
  if (__DEV__) console.warn('[gameAudio]', ...args);
}

class GameAudioManager {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private sfxEnabled = true;
  private ambienceEnabled = true;
  private masterVolume = 1;
  private sfxCache = new Map<SfxId, Audio.Sound>();
  private ambience: Audio.Sound | null = null;
  private ambienceActive = false;
  private lastWarningAt = 0;
  private lastCriticalAt = 0;
  private disabled = false;

  applyUserSettings(settings: AudioUserSettings): void {
    this.sfxEnabled = settings.sfxEnabled;
    this.ambienceEnabled = settings.ambienceEnabled;
    this.masterVolume = settings.masterVolume;
    void this.refreshAmbienceGain();
    if (!this.ambienceEnabled) void this.stopAmbience();
  }

  setSfxEnabled(value: boolean): void {
    this.sfxEnabled = value;
  }

  setAmbienceEnabled(value: boolean): void {
    this.ambienceEnabled = value;
    void this.refreshAmbienceGain();
    if (!value) void this.stopAmbience();
  }

  setMasterVolume(value: number): void {
    if (!Number.isFinite(value)) return;
    this.masterVolume = Math.max(0, Math.min(1, value));
    void this.refreshAmbienceGain();
  }

  async ensureInitialized(): Promise<void> {
    if (this.disabled) return;
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (Platform.OS === 'web') {
        this.disabled = true;
        devWarn('Audio disabled on web (expo-av limitations).');
        return;
      }
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        this.initialized = true;
      } catch (e) {
        this.disabled = true;
        devWarn('Failed to init audio mode', e);
      }
    })();

    return this.initPromise;
  }

  private effectiveSfxVolume(extraScale = 1): number {
    if (!this.sfxEnabled || this.disabled) return 0;
    return Math.max(0, Math.min(1, this.masterVolume * extraScale));
  }

  private effectiveAmbienceVolume(): number {
    if (!this.ambienceEnabled || this.disabled) return 0;
    return Math.max(
      0,
      Math.min(1, this.masterVolume * AMBIENCE_RELATIVE_GAIN),
    );
  }

  /** Fire-and-forget SFX; never throws to callers. */
  playSfx(id: SfxId, volumeScale = 1): void {
    void this.playSfxAsync(id, volumeScale);
  }

  playSfxDelayed(id: SfxId, delayMs: number, volumeScale = 1): void {
    setTimeout(() => {
      this.playSfx(id, volumeScale);
    }, delayMs);
  }

  tryPlayWarningAlert(): void {
    const now = Date.now();
    if (now - this.lastWarningAt < WARNING_COOLDOWN_MS) return;
    this.lastWarningAt = now;
    this.playSfx('warningAlert');
  }

  tryPlayCriticalAlert(): void {
    const now = Date.now();
    if (now - this.lastCriticalAt < CRITICAL_COOLDOWN_MS) return;
    this.lastCriticalAt = now;
    this.playSfx('criticalAlert');
  }

  private async playSfxAsync(id: SfxId, volumeScale: number): Promise<void> {
    await this.ensureInitialized();
    if (this.disabled || !this.sfxEnabled) return;
    const vol = this.effectiveSfxVolume(volumeScale);
    if (vol <= 0) return;

    try {
      const src = AUDIO_SFX_SOURCES[id];
      if (!src) {
        devWarn('Missing SFX source for', id);
        return;
      }

      let sound = this.sfxCache.get(id);
      if (!sound) {
        const created = await Audio.Sound.createAsync(src, {
          shouldPlay: false,
          volume: vol,
        });
        sound = created.sound;
        this.sfxCache.set(id, sound);
      } else {
        await sound.setVolumeAsync(vol);
      }

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      try {
        await sound.replayAsync();
      } catch {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (e) {
      if (__DEV__) devWarn('playSfx failed', id, e);
    }
  }

  private async refreshAmbienceGain(): Promise<void> {
    if (!this.ambience) return;
    try {
      const v = this.effectiveAmbienceVolume();
      await this.ambience.setVolumeAsync(v);
      if (v <= 0) await this.ambience.pauseAsync();
      else if (this.ambienceActive) await this.ambience.playAsync();
    } catch {
      /* ignore */
    }
  }

  async startAmbience(): Promise<void> {
    await this.ensureInitialized();
    if (this.disabled || !this.ambienceEnabled) return;
    const vol = this.effectiveAmbienceVolume();
    if (vol <= 0) return;

    try {
      if (!this.ambience) {
        const { sound } = await Audio.Sound.createAsync(AUDIO_AMBIENCE_SOURCE, {
          shouldPlay: false,
          isLooping: true,
          volume: vol,
        });
        this.ambience = sound;
      } else {
        await this.ambience.setVolumeAsync(vol);
        await this.ambience.setIsLoopingAsync(true);
      }

      const st = await this.ambience.getStatusAsync();
      if (st.isLoaded && 'isPlaying' in st && st.isPlaying) {
        this.ambienceActive = true;
        return;
      }

      this.ambienceActive = true;
      if (st.isLoaded) {
        await this.ambience.playAsync();
      }
    } catch (e) {
      if (__DEV__) devWarn('startAmbience failed', e);
    }
  }

  async stopAmbience(): Promise<void> {
    this.ambienceActive = false;
    if (!this.ambience) return;
    try {
      await this.ambience.stopAsync();
      await this.ambience.setPositionAsync(0);
    } catch {
      /* ignore */
    }
  }

  async pauseAmbienceForBackground(): Promise<void> {
    await this.stopAmbience();
  }

  /** Optional cleanup when tearing down the app shell (e.g. tests). */
  async unloadAll(): Promise<void> {
    await this.stopAmbience();
    const sounds = [...this.sfxCache.values()];
    this.sfxCache.clear();
    for (const s of sounds) {
      try {
        await s.unloadAsync();
      } catch {
        /* ignore */
      }
    }
    if (this.ambience) {
      try {
        await this.ambience.unloadAsync();
      } catch {
        /* ignore */
      }
      this.ambience = null;
    }
  }
}

export const gameAudio = new GameAudioManager();
