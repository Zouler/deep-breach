export type ThreatLevel = 'safe' | 'warning' | 'danger' | 'critical';

export type GaugeTone = 'neutral' | 'warning' | 'danger' | 'critical' | 'ok';

/** Higher is better (hull %, oxygen %). */
export function threatForHigherIsBetter(value: number): ThreatLevel {
  if (value >= 72) return 'safe';
  if (value >= 50) return 'warning';
  if (value >= 28) return 'danger';
  return 'critical';
}

/** Lower is better (water %). */
export function threatForLowerIsBetter(value: number): ThreatLevel {
  if (value <= 22) return 'safe';
  if (value <= 45) return 'warning';
  if (value <= 68) return 'danger';
  return 'critical';
}

export function threatToGaugeTone(level: ThreatLevel): GaugeTone {
  switch (level) {
    case 'safe':
      return 'ok';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    case 'critical':
      return 'critical';
    default:
      return 'neutral';
  }
}

export function formatThreatLabel(level: ThreatLevel): string {
  switch (level) {
    case 'safe':
      return 'NOMINAL';
    case 'warning':
      return 'ELEVATED';
    case 'danger':
      return 'HAZARD';
    case 'critical':
      return 'CRITICAL';
    default:
      return 'UNKNOWN';
  }
}
