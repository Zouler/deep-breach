/** Optional codex: prior DBX units (read-only lore, not tutorial-critical). */
export interface DbxPrototypeLoreEntry {
  designation: string;
  summary: string;
}

export const DBX_PROTOTYPE_LORE: DbxPrototypeLoreEntry[] = [
  {
    designation: 'DBX-01',
    summary: 'Initial pressure platform. Retired after structural instability.',
  },
  {
    designation: 'DBX-02',
    summary: 'Scanner and retrieval testbed. Lost during an unmanned deep trial.',
  },
  {
    designation: 'DBX-03',
    summary: 'Crewed prototype. Survived trials, but deemed unfit for operational deployment.',
  },
  {
    designation: 'DBX-04',
    summary: 'Classified.',
  },
  {
    designation: 'DBX-05',
    summary: 'Destroyed during a pressure cascade event.',
  },
  {
    designation: 'DBX-06',
    summary: 'Converted into a remote support platform.',
  },
  {
    designation: 'DBX-07 "Deep Breach"',
    summary: 'First candidate for full operational certification.',
  },
];

/**
 * Planned hull narrative variants by act (data only — no mechanical retrofit yet).
 * Labels are story-facing, not loadout IDs.
 */
export const DBX_FUTURE_ACT_VARIANTS = [
  { act: 1, label: 'Act 1 — DBX-07 Prototype' },
  { act: 2, label: 'Act 2 — DBX-07A Research Retrofit' },
  { act: 3, label: 'Act 3 — DBX-07B Covert Operations Retrofit' },
  { act: 4, label: 'Act 4 — DBX-07C Combat Retrofit' },
  { act: 5, label: 'Act 5 — DBX-07N Strategic Variant' },
  { act: 6, label: 'Act 6 — DBX-07X Abyssal Experimental Platform' },
] as const;
