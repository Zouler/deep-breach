import type { CommanderProfile, StoryProgress } from './story';

export interface ResourceBalance {
  scrap: number;
  researchData: number;
}

/** Persistent surface warehouse — canonical scrap/research and recovered valuables. */
export interface BaseStorage {
  scrap: number;
  researchData: number;
  treasures: Treasure[];
  artifacts: number;
  samples: number;
  hullPatchKits: number;
  pressureSealant: number;
  emergencyBrace: number;
  oxygenCanisters: number;
}

/** Amounts moved from expedition → base in one return (delta). */
export interface CargoTransferSummary {
  scrap: number;
  /** Bonus paid on mission success (tracked separately for debrief clarity). */
  missionCompletionBonusScrap?: number;
  researchData: number;
  treasures: number;
  artifacts: number;
  samples: number;
  hullPatchKits: number;
  pressureSealant: number;
  emergencyBrace: number;
  oxygenCanisters: number;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastSavedAt: number;
}

export type SubmarineModuleType =
  | 'hull'
  | 'cargo'
  | 'sonar'
  | 'oxygen'
  | 'autoSeal';

export interface SubmarineModule {
  id: string;
  type: SubmarineModuleType;
  name: string;
  level: number;
  maxLevel: number;
}

export interface Submarine {
  modules: SubmarineModule[];
  /** 0–100 current hull condition */
  hullIntegrityPercent: number;
}

export type CrewRole = 'engineer' | 'navigator' | 'scientist';

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  hired: boolean;
  assignedToDive: boolean;
  repairSkill: number;
  navigationSkill: number;
  researchSkill: number;
  hireCostScrap: number;
}

export type RiskLevel = 'low' | 'medium' | 'medium-high' | 'high';

export interface Mission {
  id: string;
  name: string;
  targetDepthM: number;
  durationMinutes: number;
  risk: RiskLevel;
  expectedRewardsText: string;
  scrapRewardRange: [number, number];
  researchRewardRange: [number, number];
  treasureChance: number;
  specialEventChance: number;
  /** Act 1 — Experimental Trials: one-line purpose for mission board / context. */
  trialPurpose?: string;
}

export type CrackSeverity = 'hairline' | 'moderate' | 'critical';

export interface Crack {
  id: string;
  roomId: string;
  severity: CrackSeverity;
  leakRatePerSecond: number;
}

export type RoomStatus = 'ok' | 'damaged' | 'flooding';

export interface RoomLoot {
  id: string;
  kind: 'scrap' | 'research' | 'treasure' | 'repair_supply' | 'emergency_supply';
  name: string;
  amount?: number;
  treasure?: Treasure;
  /** Template id from `RepairItem.id` for staged pickups */
  repairTemplateId?: string;
  repairQuantity?: number;
  collected: boolean;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  cracks: Crack[];
  loot: RoomLoot[];
}

export type RepairItemKind = 'patch' | 'sealant' | 'brace' | 'oxygen';

export interface RepairItem {
  id: string;
  name: string;
  kind: RepairItemKind;
  /** Max severity this item can fully repair in one use */
  maxSeverity: CrackSeverity;
  /** Relative strength for success odds (higher is better). */
  power: number;
  quantity: number;
}

export interface Treasure {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export type GameEventType =
  | 'pressure_spike'
  | 'sonar_contact'
  | 'system_failure'
  | 'wreck_sighting'
  | 'bio_signature'
  | 'special_signal'
  | 'repair_complete'
  | 'repair_failed'
  | 'loot_secured'
  | 'external_discovery'
  | 'discovery_ignored'
  | 'discovery_recovery';

export interface GameEvent {
  id: string;
  type: GameEventType;
  message: string;
  timestamp: number;
  roomId?: string;
}

export type OfflineMissionStatus =
  | 'still_active'
  | 'completed'
  | 'failed'
  | 'emergency_extraction';

export interface OfflineReport {
  id: string;
  /** Raw wall-clock gap before capping (e.g. 4h max). */
  timeAwayMs: number;
  /** Simulated away time used for calculations (≤ timeAwayMs). */
  effectiveAwayMs: number;
  depthStartM: number;
  depthEndM: number;
  /** Deepest simulated depth after offline interval (same as depthEndM when forward-only). */
  depthReachedM: number;
  /** 0–100 progress toward contract target depth at end of interval. */
  explorationProgressPercent: number;
  explorationSummary: string;
  scrapCollected: number;
  researchCollected: number;
  treasuresFound: Treasure[];
  hullDamagePercent: number;
  oxygenUsedPercent: number;
  waterIngressPercent: number;
  events: GameEvent[];
  /** Human-readable special discoveries (mirrors key events). */
  specialEventsDiscovered: string[];
  crewNotes: string[];
  recommendedAction: string;
  generatedAt: number;
  missionStatus: OfflineMissionStatus;
  /** True when margins forced surface protocol; mission ends with partial haul. */
  emergencyExtraction: boolean;
  /** Extra stress applied to surface hull when extraction fires (applied on return to base). */
  surfaceHullPenaltyPercent: number;
  /** Salvage yield was throttled by cargo headroom. */
  cargoAtCapacity: boolean;
}

export type DiveStatus = 'active' | 'success' | 'failed';

export type DiveRoute =
  | 'push_deeper'
  | 'search_salvage'
  | 'follow_signal'
  | 'avoid_hazards'
  | 'stabilize_systems';

/** Abstract vertical motion for HUD / future map (not manual piloting). */
export type VerticalMovementState = 'descending' | 'ascending' | 'holding_depth';

/** Abstract horizontal / sweep motion for HUD / future map. */
export type HorizontalMovementState =
  | 'advancing'
  | 'reversing'
  | 'holding_position'
  | 'drifting';

export type DiscoveryProvenance = 'passive' | 'scan';

export type DiscoveryCategory =
  | 'salvage'
  | 'research_signal'
  | 'treasure_cache'
  | 'thermal_anomaly'
  | 'biological_contact'
  | 'volcanic_rock'
  | 'unknown_artifact';

export type DiscoveryRiskBand = 'low' | 'medium' | 'high';

export interface ExternalDiscovery {
  id: string;
  category: DiscoveryCategory;
  title: string;
  description: string;
  riskBand: DiscoveryRiskBand;
  rewardHint: string;
  scanned: boolean;
  /** 0–1 rough hazard likelihood shown to player */
  hazardChanceDisplay: number;
  /** 0–1 rough reward quality */
  rewardQualityDisplay: number;
  createdAt: number;
  provenance: DiscoveryProvenance;
  /** Populated after "Scan first" — brief captain-facing summary */
  scanNarrative?: string;
}

export interface DiscoveryJournalEntry {
  id: string;
  category: DiscoveryCategory;
  title: string;
  choice: 'ignored' | 'attempted';
  outcomeSummary: string;
  hazardTriggered: boolean;
  specialEventNoted: boolean;
  source: DiscoveryProvenance;
}

/**
 * Crew comms speaker token: canonical lead id (`CrewLeadMessageSpeakerId`) or legacy
 * HUD labels (`Engineer`, `Navigator`, `Scientist`, `System`) from older saves.
 */
export type CrewMessageSpeaker = string;

export interface CrewMessage {
  id: string;
  speaker: CrewMessageSpeaker;
  text: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'danger';
}

/** Shown after resolving an external contact (attempt / ignore). */
export interface DiscoveryOutcomeBanner {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface DiveSession {
  /** When true, terminal outcome has been copied to `lastMissionOutcome` */
  outcomeRecorded?: boolean;
  missionId: string;
  missionName: string;
  targetDepthM: number;
  missionDurationMs: number;
  startedAt: number;
  /** Progress clock for mission completion (foreground + optional offline sim) */
  missionElapsedMs: number;
  currentDepthM: number;
  oxygenPercent: number;
  waterLevelPercent: number;
  hullIntegrityPercent: number;
  rooms: Room[];
  continueExplorationWhileAway: boolean;
  /** When app went to background with offline exploration enabled */
  backgroundedAt: number | null;
  /** Set after offline sim forces extraction; used for base salvage if report was cleared. */
  offlineEmergencyExtraction?: boolean;
  /** Extra tug / extract stress applied when returning to base after emergency offline. */
  offlineSurfaceHullPenalty?: number;
  status: DiveStatus;
  collectedScrap: number;
  collectedResearch: number;
  collectedTreasures: Treasure[];
  /** Count of distinct artifact recoveries this dive (cargo-heavy). */
  collectedArtifacts: number;
  /** Biological / mineral samples secured this dive. */
  collectedSamples: number;
  /** Paid when a mission succeeds; transferred once with the expedition cargo. */
  missionCompletionBonusScrap?: number;
  /** Repair kits & oxygen canisters carried on this expedition (not base drydock stock). */
  expeditionRepairInventory: RepairItem[];
  /** Cleared when the player dismisses the outcome card. */
  discoveryOutcomeBanner: DiscoveryOutcomeBanner | null;
  repairSuppliesConsumedThisDive: number;
  repairSuppliesRecoveredThisDive: number;
  oxygenCanisterUsesThisDive: number;
  /** Human-readable cargo overflow notes (capacity). */
  cargoLeftBehindNotes: string[];
  /** Human-readable lines for debrief (repair pickups, notable haul). */
  supplyLog: string[];
  eventLog: GameEvent[];
  pendingDiscovery: ExternalDiscovery | null;
  discoveryJournal: DiscoveryJournalEntry[];
  lastCrackSpawnAt: number;
  lastAmbientAt: number;
  lastDiscoveryOfferAt: number;
  nextCrackGapMs: number;
  nextAmbientGapMs: number;
  nextDiscoveryGapMs: number;
  /** Strategic navigation intent while descending */
  currentRoute: DiveRoute;
  /** Cumulative ms spent on each route (for debrief). */
  routeTimeMs: Record<DiveRoute, number>;
  /** Abstract forward distance travelled this dive (km) — sonar/track space, not a full map yet. */
  horizontalDistanceKm: number;
  verticalMovementState: VerticalMovementState;
  horizontalMovementState: HorizontalMovementState;
  /** Smoothed descent rate for display (m/min). */
  descentRateMPerMin: number;
  /** Smoothed forward / sweep rate for display (km/min, abstract). */
  horizontalSpeedKmPerMin: number;
  lastAreaScanAt: number;
  scansPerformed: number;
  emergencyOxygenChargesRemaining: number;
  emergencyOxygenUsesThisDive: number;
  crewMessages: CrewMessage[];
  lastReactiveCrewAt: number;
  /** Prevents double-transfer when returning to base multiple times. */
  cargoTransferredToBase?: boolean;
}

export interface MissionOutcome {
  success: boolean;
  /** Emergency / early surface protocol — shown as "trial aborted" in debrief copy. */
  trialAborted?: boolean;
  missionName: string;
  targetDepthM: number;
  depthReachedM: number;
  rewards: ResourceBalance;
  /** Paid on success, separate from salvage/loot recovered during the dive. */
  missionCompletionBonusScrap?: number;
  treasures: Treasure[];
  hullDamageTakenApprox: number;
  /** Supplies and notable recoveries surfaced during the dive */
  itemsCollectedSummary: string[];
  events: GameEvent[];
  externalDiscoveriesAttempted: number;
  externalDiscoveriesIgnored: number;
  externalDiscoveryHazardsTriggered: number;
  externalDiscoverySpecialEvents: number;
  externalDiscoverySummaries: string[];
  dominantRoute: DiveRoute;
  scansPerformed: number;
  discoveriesFromScan: number;
  discoveriesFromPassive: number;
  emergencyOxygenUses: number;
  crewMessageCount: number;
  cargoLimit: number;
  cargoUsedApprox: number;
  repairSuppliesConsumed: number;
  repairSuppliesRecovered: number;
  oxygenCanisterUses: number;
  cargoLeftBehindLines: string[];
  treasuresRecovered: number;
  artifactsRecovered: number;
  samplesRecovered: number;
  discoveriesResolvedViaScan: number;
  discoveriesResolvedPassive: number;
  /** Preview of what will move into Base Storage on return (same math as transfer). */
  storageTransferPreview?: CargoTransferSummary;
}

export const GAME_STATE_VERSION = 1 as const;

export interface GameState {
  version: typeof GAME_STATE_VERSION;
  profile: PlayerProfile;
  /** Narrative commander (Act 1: Phillip Roberts). */
  commander: CommanderProfile;
  story: StoryProgress;
  resources: ResourceBalance;
  /** Surface warehouse — canonical economy for scrap/research/loot (mirrored into resources for legacy UI paths). */
  baseStorage: BaseStorage;
  submarine: Submarine;
  crew: CrewMember[];
  repairInventory: RepairItem[];
  treasureInventory: Treasure[];
  missions: Mission[];
  dive: DiveSession | null;
  pendingOfflineReport: OfflineReport | null;
  lastMissionOutcome: MissionOutcome | null;
}

export type {
  CampaignDef,
  CampaignId,
  CampaignStatus,
  CommanderProfile,
  StoryProgress,
} from './story';

export type { CrewLead, CrewLeadMessageSpeakerId, CrewLeadTone } from './crew';
