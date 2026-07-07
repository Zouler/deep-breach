# Deep Breach — Known Issues (Internal Playtest)

Last updated for **P1.10 internal playtest hardening**. This document is intentionally honest about deferred work — especially visuals.

---

## Visual style and UI composition

**Status: deferred — not a P1.10 blocker**

- Visual style may still look **inconsistent** after Phase B partial rollout. Background plates, scrims, and room art do not yet share a unified grade across all screens.
- **UI composition needs a later recovery pass.** HUD panels, briefing modals, and mission cards may overlap, clip, or feel cramped on smaller devices.
- Some screens use **legacy or interim assets** while Phase B production continues. See `docs/visual/phase-b-asset-status.md` and `docs/visual/phase-b-deferred.md`.
- **Campaign / Service Record** is functional narrative UI, not final visual treatment.
- Leadership portraits and command tile glyphs may not match the Phase B production pack spec on all routes.

**Recommendation:** Run internal playtest for **story progression, decisions, and dive flow**. Schedule a dedicated **visual recovery pass** before external marketing or store submission.

---

## Deferred P2 assets

Not expected in this playtest build:

- Full 10-room background plate set
- Sonar room plate (second dive-room priority after MVP four-room set)
- Dive HUD repaint (existing PNG set retained)
- War-era room art, weapons bay art, alien/anomaly creature art
- Animated VFX and full font licensing pass

See `docs/visual/phase-b-asset-production-pack.md` for the reconciled MVP vs P2 list.

---

## Story placeholders (intentional)

- **Expansion Model Deployment Hold** — appears after P1.8 model priority. Copy: *"Model confidence remains below deployment threshold."*
- **Engineering Stress Response (P1.9)** — base-side engineering posture decision after model priority. Playable through P1.9 on current branch.
- **Descent Authorization Hold** — appears after P1.9. Copy: *"Deployment profile not yet authorized."*
- **Reserved retrofit designations** on Campaigns screen — lore-only entries; authorization pending Command review.
- Full anomaly reveal, military escalation, and collapse-era content remain **future acts** — no supernatural or extraterrestrial reveal in current spine.

---

## Platform / build concerns

- **Local save only (v6)** — no cloud sync; erase save is destructive with no recovery.
- **Web vs native** — web is acceptable for story QA; performance and touch targets should be validated on a physical device before wider release.
- **`__DEV__` QA helpers** — must not ship to production players; gated in Settings behind development builds only.

---

## Gameplay / progression (addressed in P1.10)

These were hardening targets; report regressions if seen:

- Decision phases (Dead Beacon data, First Contact Analysis, Command Pressure, Abyssal Expansion Models, Engineering Stress Response) should be **single-use**
- QA fast-forward helpers should produce **valid states** without duplicate spine entries or reward farming
- Failed story dives should not grant spine events early

Regression coverage: `game/__tests__/storyProgressionChain.test.ts` (P1.10 block through P1.9) and `game/__tests__/engineeringStressResponse.test.ts`.

---

## Reporting new issues

Use the bug report template in [p1.10-internal-playtest-checklist.md](./p1.10-internal-playtest-checklist.md). Mark visual issues separately from progression blockers.
