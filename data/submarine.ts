/** Narrative identity for the player vessel (gameplay stats live on `Submarine` in types). */
export interface SubmarineNarrativeIdentity {
  designation: string;
  callsign: string;
  /** e.g. DBX-07 "Deep Breach" */
  displayName: string;
  className: string;
  programName: string;
  currentVariant: string;
  commanderName: string;
}

export const SUBMARINE_IDENTITY: SubmarineNarrativeIdentity = {
  designation: 'DBX-07',
  callsign: 'Deep Breach',
  displayName: 'DBX-07 "Deep Breach"',
  className: 'Experimental Abyssal Submarine',
  programName: 'DBX Experimental Abyssal Program',
  currentVariant: 'Prototype',
  commanderName: 'Phillip Roberts',
};
