# QA Fast-Forward Helper

Internal dev tools for reaching major story states without replaying the full P1.0–P1.8 spine.

## In-app (development builds only)

Open **Settings → Developer / QA**. All controls are gated behind `__DEV__`.

| Button | Target state |
|--------|----------------|
| **QA: Advance to Dead Beacon ready** | Experimental Trials + Operational Integration complete; Operation Dead Beacon recon launchable |
| **QA: Advance to Return to DBX-03 ready** | Dead Beacon recon + P1.2 data decision resolved; return dive launchable |
| **QA: Advance to Growing Ocean monitoring ready** | Through First Contact Analysis; monitoring dive launchable |
| **QA: Advance to Command Pressure ready** | Growing Ocean monitoring complete; strategic decision pending |
| **QA: Advance to Abyssal Expansion Models ready** | Command Pressure resolved (controlled observation); model priority pending |

Helpers:
- Use valid reducer / resolution paths
- Clear active dive and pending debrief state
- Do **not** auto-start dives or auto-resolve pending decisions (except Command Pressure auto-resolve on the Expansion Models helper only)

**P1.9 Engineering Stress Response** — helper to be added when P1.9 merges to main.

## Programmatic (tests)

```typescript
import {
  advanceQaToDeadBeaconReady,
  advanceQaToReturnDiveReady,
  advanceQaToMonitoringReady,
  advanceQaToCommandPressureReady,
  advanceQaToAbyssalExpansionModelsReady,
} from '@/game/qaProgression';

// or via reducer:
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_DEAD_BEACON' })
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_RETURN_DIVE' })
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_MONITORING' })
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_COMMAND_PRESSURE' })
// reduceGame(state, { type: 'QA_FAST_FORWARD_TO_EXPANSION_MODELS' })
```

## Command Pressure ready (P1.7 testing)

1. Settings → **QA: Advance to Command Pressure ready**
2. Open **Command Pressure** from Mission Select or base hub banner
3. Select one strategic posture — no dive launches

## Abyssal Expansion Models ready (P1.8 testing)

1. Settings → **QA: Advance to Abyssal Expansion Models ready**
2. Open **Abyssal Expansion Models** from Mission Select or base hub banner
3. Prioritize one expansion model — no dive launches

## Not for production players

The Settings controls are gated behind `__DEV__` and are not part of normal gameplay progression.
