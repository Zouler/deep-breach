export type InternalCrewEventCategory =
  | 'health'
  | 'discipline'
  | 'morale'
  | 'fatigue'
  | 'department_performance'
  | 'logistics'
  | 'research'
  | 'maintenance';

export type InternalCrewEventTone = 'negative' | 'neutral' | 'positive' | 'urgent';

export type InternalCrewEventImportance = 'low' | 'medium' | 'high';

/** Option-level mechanical deltas (applied as additive adjustments). */
export interface InternalCrewEventEffects {
  moraleDelta?: number;
  stressDelta?: number;
  disciplineDelta?: number;
  readinessDelta?: number;
  repairEfficiencyDelta?: number;
  researchEfficiencyDelta?: number;
  logisticsEfficiencyDelta?: number;
}

export interface InternalCrewEventOption {
  id: string;
  label: string;
  description?: string;
  outcomeText: string;
  /** One-line Captain’s Log / recap summary (commander-facing). */
  storyBeatSummary: string;
  effects?: InternalCrewEventEffects;
}

export interface InternalCrewEvent {
  id: string;
  title: string;
  category: InternalCrewEventCategory;
  tone: InternalCrewEventTone;
  speakerId: string;
  speakerName: string;
  department?: string;
  description: string;
  options: InternalCrewEventOption[];
  canRepeat: boolean;
  minMissionsCompleted?: number;
  allowedDuringDive?: boolean;
  allowedAtBase?: boolean;
  importance: InternalCrewEventImportance;
}

/** Aggregate crew condition (0–100 for core stats; mods are small balance offsets). */
export interface CrewConditionState {
  morale: number;
  stress: number;
  discipline: number;
  readiness: number;
  repairEfficiencyMod: number;
  researchEfficiencyMod: number;
  logisticsEfficiencyMod: number;
}

export function defaultCrewConditionState(): CrewConditionState {
  return {
    morale: 70,
    stress: 20,
    discipline: 75,
    readiness: 75,
    repairEfficiencyMod: 0,
    researchEfficiencyMod: 0,
    logisticsEfficiencyMod: 0,
  };
}
