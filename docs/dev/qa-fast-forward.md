# QA Fast-Forward Helper

Internal dev tool for reaching the **Growing Ocean Anomaly monitoring-ready** state without replaying the full P1.0–P1.4 spine (~90–150 minutes).

## In-app (development builds only)

1. Open **Settings**.
2. Under **Developer / QA**, tap **QA: Advance to Growing Ocean monitoring ready**.
3. Open **Mission Select → Operational assignments → Growing Ocean Anomaly**.
4. Launch the passive monitoring dive.

This action:
- Completes Experimental Trials through First Contact Aftermath via valid reducer paths
- Clears any active dive and pending mission result
- Does **not** mark `growing_ocean_anomaly` or start a dive automatically

## Programmatic (tests)

```typescript
import { advanceQaToMonitoringReady, advanceQaToCommandPressureReady, advanceQaToAbyssalExpansionModelsReady } from '@/game/qaProgression';

const monitoringReady = advanceQaToMonitoringReady();
// or: reduceGame(state, { type: 'QA_FAST_FORWARD_TO_MONITORING' })

const commandPressureReady = advanceQaToCommandPressureReady();
// or: reduceGame(state, { type: 'QA_FAST_FORWARD_TO_COMMAND_PRESSURE' })

const expansionModelsReady = advanceQaToAbyssalExpansionModelsReady();
// or: reduceGame(state, { type: 'QA_FAST_FORWARD_TO_EXPANSION_MODELS' })
```

## Command Pressure ready (P1.7 testing)

1. Open **Settings**.
2. Tap **QA: Advance to Command Pressure ready**.
3. Open **Command Pressure** from Mission Select or the base hub banner.
4. Select one strategic posture — no dive launches.

## Abyssal Expansion Models ready (P1.8 testing)

1. Open **Settings**.
2. Under **Developer / QA**, tap **QA: Advance to Abyssal Expansion Models ready**.
3. Open **Mission Select → Operational assignments → Abyssal Expansion Models** (or use the base hub banner).
4. Prioritize one expansion model — no dive launches.

This action completes Command Pressure (controlled observation) and leaves the model priority decision pending.

## Not for production players

The Settings control is gated behind `__DEV__` and is not part of normal gameplay progression.
