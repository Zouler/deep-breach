import type { AVPlaybackSource } from 'expo-av';

/** Pack filename is `sona-ping.mp3` (studio spelling). */
import sonarPing from '@/assets/audio/sfx/sona-ping.mp3';
import scanStart from '@/assets/audio/sfx/scan-start.mp3';
import discoveryFound from '@/assets/audio/sfx/discovery-found.mp3';
import pickupReward from '@/assets/audio/sfx/pickup-reward.mp3';
import crackSmall from '@/assets/audio/sfx/crack-small.mp3';
import repairSuccess from '@/assets/audio/sfx/repair-success.mp3';
import repairFailed from '@/assets/audio/sfx/repair-failed.mp3';
import oxygenRestore from '@/assets/audio/sfx/oxygen-restore.mp3';
import warningAlert from '@/assets/audio/sfx/warning-alert.mp3';
import criticalAlert from '@/assets/audio/sfx/critical-alert.mp3';
import submarineAmbienceLoop from '@/assets/audio/ambience/submarine-ambience-loop.wav';

export type SfxId =
  | 'sonarPing'
  | 'scanStart'
  | 'discoveryFound'
  | 'pickupReward'
  | 'crackSmall'
  | 'repairSuccess'
  | 'repairFailed'
  | 'oxygenRestore'
  | 'warningAlert'
  | 'criticalAlert';

/** Central SFX registry (Metro static requires). */
export const AUDIO_SFX_SOURCES: Record<SfxId, AVPlaybackSource> = {
  sonarPing,
  scanStart,
  discoveryFound,
  pickupReward,
  crackSmall,
  repairSuccess,
  repairFailed,
  oxygenRestore,
  warningAlert,
  criticalAlert,
};

/** Looping underwater bed (low gain applied in audio manager). */
export const AUDIO_AMBIENCE_SOURCE: AVPlaybackSource = submarineAmbienceLoop;
