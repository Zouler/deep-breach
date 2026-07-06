/**
 * COLD HULL — Classified Abyssal Instrumentation
 * Visual tokens for submarine command UI. Legacy keys preserved for compatibility.
 */
export const theme = {
  bg: '#030712',
  bgElevated: '#0a1628',
  surface: '#0c1a2e',
  border: '#1e3a5f',
  text: '#e8f1ff',
  textMuted: '#8ba3c4',
  accent: '#22d3ee',
  accentDim: '#0e7490',
  danger: '#f87171',
  critical: '#fb7185',
  warning: '#fbbf24',
  ok: '#4ade80',
  radar: '#1d4ed8',
  /** @deprecated Prefer radiusInstrument for new panels */
  cardRadius: 14,
  fontMono: 'SpaceMono' as const,

  // —— COLD HULL tokens (Phase A) ——
  radiusInstrument: 4,
  cornerTick: '#f59e0b88',
  phosphorAmber: '#fbbf24',
  paperBone: '#e8e4d9',
  mutedSteel: '#64748b',
  instrumentCyan: '#22d3ee',
  emergencyRed: '#f87171',
  panelRailBg: '#0a1628ee',
  scanlineOpacity: 0.035,
  /** Display / section headers — system sans, heavy weight */
  fontDisplay: undefined as string | undefined,
  /** Body copy — system sans */
  fontBody: undefined as string | undefined,

  // Translucent panel/border tokens
  panelBorderFaint: '#38bdf822',
  panelBorder: '#38bdf833',
  panelBorderStrong: '#38bdf855',
  panelBgFaint: '#02061799',
  panelBgSoft: '#020617aa',
  panelBg: '#020617cc',
  panelBgSolid: '#020617f2',
  overlayBg: '#000b18ee',
  dangerBorder: '#fb718566',
  dangerBg: '#450a0a66',
  warningBorder: '#b4530944',
  warningBg: '#451a0344',
  okBorder: '#14532d55',
  okBg: '#052e1644',
  okBgStrong: '#052e1655',
};

/** Mono/data readout style helper */
export const monoData = {
  fontFamily: theme.fontMono,
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  letterSpacing: 0.4,
};
