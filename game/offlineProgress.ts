export { calculateOfflineProgress, MAX_OFFLINE_CALC_MS } from '@/game/offlineExploration';
export type {
  OfflineExplorationParams,
  OfflineExplorationResult,
} from '@/game/offlineExploration';
export {
  canEnableOfflineExploration,
  getOfflineExplorationGuard,
  offlineExplorationBlockMessage,
  type OfflineExplorationGuard,
  type OfflineExplorationReasonCode,
} from '@/game/offlineGuards';
