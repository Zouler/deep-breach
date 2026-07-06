import type { CanonEra } from '@/game/canon';
import type { CompartmentSaveState, RoomId } from '@/game/rooms';
import type { RobertsState } from '@/game/roberts';

import type { CrewAlertAction } from './crewAlerts';
import type { CommanderProfile, NarrativeRecapState, StoryBeat, StoryProgress } from './story';
import type { CrewConditionState } from './internalCrewEvents';
import type { StoryDebriefAttachment, TrialDebriefAttachment, TrialProgress } from './trials';

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

export type CrewSpecializationId =
  | 'engineer_rapid_repairs'
  | 'engineer_heat_discipline'
  | 'navigator_efficient_routes'
  | 'navigator_hazard_sense'
  | 'scientist_deep_analysis'
  | 'scientist_steady_hands';

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
  /** Completed dives while assigned; gates the specialization choice. */
  divesCompleted: number;
  /** Permanent qualitative pick once unlocked; null while undecided. */
  specializationId: CrewSpecializationId | null;
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
  /** ms timestamp this crack appeared; used to gate escalation. */
  spawnedAt: number;
  /** ms timestamp this crack worsens to the next severity tier if still unrepaired; null if it won't escalate. */
  escalatesAt: number | null;
  /** True once the pre-escalation warning has fired, so it only fires once. */
  escalationWarned?: boolean;
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
  /** Optional department line (e.g. Engineering) for richer HUD. */
  department?: string;
  /** Contextual shortcuts — only on important alerts. */
  actions?: CrewAlertAction[];
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
  /** Id of the rolled mission modifier for this attempt, or null for standard conditions. */
  activeModifierId: string | null;
  /** Engine Bay's dedicated hazard meter (0-100), independent of the crack/leak system. */
  engineHeatPercent: number;
  lastEngineHeatVentAt: number;
  /** True once the pre-critical warning has fired for the current heat climb. */
  engineHeatWarned: boolean;
  /** Prevents double-transfer when returning to base multiple times. */
  cargoTransferredToBase?: boolean;
  /** Throttle Chief Engineer repair-stock depletion warnings. */
  lastRepairStockCrewWarningAt?: number;
  /** Last repair stock band we briefed (hull kits only; excludes O₂). */
  lastRepairStockBriefStatus?: 'healthy' | 'low' | 'empty' | 'critical_empty';
  /** Throttle actionable low-O₂ comms (HUD). */
  lastLowOxygenActionableAt?: number;
  /** Last oxygen band we used for actionable alert (crossing thresholds). */
  lastLowOxygenActionableBand?: 'warn' | 'crit';
  /** Throttle cargo-at-capacity actionable comms. */
  lastCargoFullActionableAt?: number;
  /** Throttle tac sonar hazard advisory. */
  lastSonarHazardAdvisoryAt?: number;
  /** Throttle tac sonar off-path signal advisory. */
  lastSonarSignalAdvisoryAt?: number;
  /** Dedupe breach room for repeated actionable breach lines. */
  lastActionableBreachSignature?: string;
  /** Non-repair canon catalog items recovered this expedition. */
  expeditionCatalogItems?: Record<string, number>;
  /** P1.3 return dive — contact interference zone active. */
  anomalyInterferenceActive?: boolean;
  /** Scans performed after anomaly interference began. */
  anomalyContactScans?: number;
  /** First anomaly contact event logged this dive. */
  anomalyFirstContactLogged?: boolean;
}

export interface MissionOutcome {
  success: boolean;
  /** Emergency / early surface protocol — shown as "trial aborted" in debrief copy. */
  trialAborted?: boolean;
  /** True when a mission ended via emergency extraction (survivable). */
  emergencyExtraction?: boolean;
  /** True when the vessel is considered lost/destroyed (presentation only). */
  catastrophicFailure?: boolean;
  failureType?:
    | 'submarine_lost'
    | 'oxygen_depletion'
    | 'hull_collapse'
    | 'emergency_extraction_failed'
    | 'unknown_catastrophe';
  failureTitle?: string;
  failureSummary?: string;
  commanderStatus?: string;
  vesselStatus?: string;
  crewStatus?: string;
  causeSummary?: string;
  finalDepth?: number;
  finalHull?: number;
  finalOxygen?: number;
  /** Mission id for progression / UI (matches `Mission.id`). */
  missionId?: string;
  missionName: string;
  targetDepthM: number;
  depthReachedM: number;
  /** Oxygen at end of dive (trial report). */
  oxygenRemainingPercent?: number;
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
  /** Experimental trial certification / unlock summary (Act 1). */
  trialDebrief?: TrialDebriefAttachment;
  /** Operational story recon debrief (Operation Dead Beacon, etc.). */
  storyDebrief?: StoryDebriefAttachment;
}

export const GAME_STATE_VERSION = 6 as const;

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
  /** Narrative operational beats for Captain's Log and XO briefings. */
  storyBeats: StoryBeat[];
  narrativeRecap: NarrativeRecapState;
  /** One-shot cut-in ids waiting for the NarrativeCutIn provider. */
  pendingNarrativeCutInIds: string[];
  /** Cut-in ids already shown (non-repeating). */
  seenCutInIds: string[];
  /** Crew morale / stress / discipline aggregate (foundation; lightly surfaced in UI). */
  crewState: CrewConditionState;
  /** Internal leadership event awaiting commander decision at base. */
  pendingInternalCrewEventId: string | null;
  /** One-shot internal crew events already resolved (when canRepeat is false). */
  resolvedInternalCrewEventIds: string[];
  /** Count of trial returns after `outcomeRecorded` (completed debrief pipeline). */
  completedTrialReturnsCount: number;
  /** Returns since last internal crew event check threshold (spacing). */
  internalCrewReturnsSinceLastEvent: number;
  /** Target spacing: fire roll when `internalCrewReturnsSinceLastEvent` reaches this (3–5). */
  internalCrewNextEventAtReturns: number;
  lastInternalCrewEventAt: number | null;
  /** Experimental Trials progression (mission id → progress). */
  trialProgressByMissionId: Record<string, TrialProgress>;
  /** Fixed campaign era — gates story, unlocks, and reveal caps. */
  canonEra: CanonEra;
  /** Current narrative reveal progress (0–7); clamped to era cap. */
  revealLevel: number;
  /** Completed fixed-spine event ids (deduplicated). */
  completedSpineEvents: string[];
  /** Story reward / progression flags (e.g. deadBeaconData, hull_reinforcement_mk1). */
  storyFlags: string[];
  /** Commander Phillip Roberts — RPG protagonist tracks. */
  roberts: RobertsState;
  /** DBX-07 compartment unlock registry (canon-gated). */
  compartments: Record<RoomId, CompartmentSaveState>;
  /** Canon salvage catalog counts at base (taxonomy item id → quantity). */
  catalogItems: Record<string, number>;
}

export type { CommandStance, RobertsState } from '@/game/roberts';
export type { CompartmentSaveState, RoomDefinition, RoomId, RoomSystem } from '@/game/rooms';
export type { ItemDefinition, ItemGroup, ItemRarity } from '@/game/items';

export type {
  CampaignDef,
  CampaignId,
  CampaignStatus,
  CommanderProfile,
  NarrativeRecapState,
  StoryBeat,
  StoryBeatImportance,
  StoryBeatType,
  StoryProgress,
} from './story';

export type { CrewLead, CrewLeadMessageSpeakerId, CrewLeadTone } from './crew';

export type {
  CutInDismissMode,
  CutInNavAction,
  CutInNavActionId,
  CutInPriority,
  CutInTone,
  CutInType,
  NarrativeCutIn,
} from './cutins';

export type { CrewAlertAction, CrewAlertActionStyle, CrewAlertActionType } from './crewAlerts';

export type {
  DepartmentBriefing,
  DepartmentLeadId,
  DepartmentStatus,
  DepartmentStatusTone,
} from './departmentBriefings';

export type {
  CrewConditionState,
  InternalCrewEvent,
  InternalCrewEventCategory,
  InternalCrewEventEffects,
  InternalCrewEventImportance,
  InternalCrewEventOption,
  InternalCrewEventTone,
} from './internalCrewEvents';

export { defaultCrewConditionState } from './internalCrewEvents';

export type { SonarContact, SonarContactSource, SonarContactType } from './navigationMap';

export type { StoryDebriefAttachment, TrialDebriefAttachment, TrialLastOutcome, TrialProgress, TrialStatus } from './trials';
