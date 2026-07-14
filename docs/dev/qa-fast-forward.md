# QA Fast-Forward Helper

Internal dev tools for reaching major story states without replaying the full P1.0–P1.9 spine.

## In-app (development builds only)

Open **Settings → Developer / QA**. All controls are gated behind `__DEV__`.

| Button | Target state |
|--------|----------------|
| **QA: Advance to Dead Beacon ready** | Experimental Trials + Operational Integration complete; Operation Dead Beacon recon launchable |
| **QA: Advance to Return to DBX-03 ready** | Dead Beacon recon + P1.2 data decision resolved; return dive launchable |
| **QA: Advance to Growing Ocean monitoring ready** | Through First Contact Analysis; monitoring dive launchable |
| **QA: Advance to Command Pressure ready** | Growing Ocean monitoring complete; strategic decision pending |
| **QA: Advance to Abyssal Expansion Models ready** | Command Pressure resolved (controlled observation); model priority pending |
| **QA: Advance to Engineering Stress Response ready** | Abyssal Expansion Models resolved (current drift); engineering posture pending |

Helpers:
- Use valid reducer / resolution paths
- Clear active dive and pending debrief state
- Do **not** auto-start dives
- Auto-resolve prior decision only where noted (Command Pressure on Expansion Models helper; model priority on Engineering Stress helper)

## Programmatic (tests)

```typescript
import {
  advanceQaToDeadBeaconReady,
  advanceQaToReturnDiveReady,
  advanceQaToMonitoringReady,
  advanceQaToCommandPressureReady,
  advanceQaToAbyssalExpansionModelsReady,
  advanceQaToEngineeringStressResponseReady,
} from '@/game/qaProgression';

// or via reducer:
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_ENGINEERING_STRESS' })
```

## Engineering Stress Response ready (P1.9 testing)

1. Settings → **QA: Advance to Engineering Stress Response ready**
2. Open **Engineering Stress Response** from Mission Select or the base hub banner
3. Select one engineering posture — no dive launches

## Not for production players

The Settings controls are gated behind `__DEV__` and are not part of normal gameplay progression.

## Mid-spine safety (N-03)

Helpers may be tapped from a save that already completed earlier dives. Internal simulation **skips completed story dives and already-resolved decisions** so `START_MISSION` is not re-attempted on finished assignments. Failed fast-forwards log a `__DEV__` console warning instead of failing silently without a reason.
