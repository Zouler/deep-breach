# Deep Breach — Story Status

Operational snapshot for internal playtest (**P1.10**). Canon reference: `docs/source-of-truth/deep-breach-story-canon-sot-v0.2.md`.

---

## Merged story spine (main through P1.8)

| Phase | ID | Type | Status on main |
|-------|-----|------|----------------|
| P1.0 | Experimental Trials | Dive certification | ✅ Playable |
| P1.1 | Operational Integration | Briefing / acknowledge | ✅ Playable |
| P1.1 | Operation Dead Beacon | Story dive | ✅ Playable |
| P1.2 | Dead Beacon data decision | Single-use decision | ✅ Hardened (P1.10) |
| P1.3 | Return to DBX-03 Site | Story dive (first contact) | ✅ Playable |
| P1.4 | First Contact Analysis | Single-use decision | ✅ Hardened (P1.10) |
| P1.6 | Growing Ocean Anomaly | Story dive (monitoring) | ✅ Playable |
| P1.7 | Command Pressure | Single-use decision | ✅ Hardened (P1.10) |
| P1.8 | Abyssal Expansion Models | Single-use decision | ✅ Hardened (P1.10) |
| — | Expansion Model Deployment Hold | In-world lock | ✅ Placeholder (intentional) |

---

## Pending integration

| Phase | ID | Status |
|-------|-----|--------|
| P1.9 | Engineering Stress Response | **Not on main** at P1.10 branch — merge pending; QA helper and regression test extension to follow |

---

## Regression testing

- `game/__tests__/storyProgressionChain.test.ts` — full chain through P1.8 + decision idempotency + QA helper validation + save migration spot-check
- Phase-specific tests: `deadBeaconDecision.test.ts`, `firstContactAftermath.test.ts`, `commandPressure.test.ts`, `abyssalExpansionModels.test.ts`, `growingOceanAnomaly.test.ts`

---

## QA fast-forward helpers (`__DEV__` only)

| Helper | Target state |
|--------|----------------|
| Advance to Dead Beacon ready | Post–Operational Integration |
| Advance to Return to DBX-03 ready | Post–P1.2 data decision |
| Advance to Growing Ocean monitoring ready | Post–P1.4 analysis |
| Advance to Command Pressure ready | Post–Growing Ocean success |
| Advance to Abyssal Expansion Models ready | Post–Command Pressure (controlled observation auto-resolved) |

Documentation: `docs/dev/qa-fast-forward.md`

---

## Playtest docs

- [P1.10 internal playtest checklist](../playtest/p1.10-internal-playtest-checklist.md)
- [Known issues](../playtest/known-issues.md)
- Legacy: [P1.5 external checklist](../playtest/p1.5-playtest-checklist.md) (superseded for spine through P1.8)

---

## Out of scope (current build)

- New story chapters beyond deployment hold
- AI Story Director
- Full anomaly reveal / war / collapse acts
- Combat and weapons systems
- Visual redesign (see known issues)
