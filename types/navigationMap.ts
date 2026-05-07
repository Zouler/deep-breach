/**
 * Tactical / map foundation types.
 *
 * Future (Act 2+; do not generate in Act 1):
 * - Military: enemy submarine, surface vessel, minefield, drone, missile threat
 * - Sci‑fi: alien signal, unknown vessel, leviathan contact, dimensional rift,
 *   extraterrestrial signature
 */

export type SonarContactType =
  | 'salvage'
  | 'signal'
  | 'thermal'
  | 'volcanic'
  | 'terrain'
  | 'wreck'
  | 'unknown'
  | 'hazard';

/** Active = tied to gameplay (e.g. pending discovery, hull stress). Ambient = atmosphere only. */
export type SonarContactSource = 'active' | 'ambient';

export interface SonarContact {
  id: string;
  type: SonarContactType;
  label: string;
  bearingDeg: number;
  distanceMeters: number;
  risk: 'low' | 'medium' | 'high';
  discovered: boolean;
  relatedDiscoveryId?: string;
  source: SonarContactSource;
}
