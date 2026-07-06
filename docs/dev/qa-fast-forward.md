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
import { advanceQaToMonitoringReady, advanceQaToCommandPressureReady } from '@/game/qaProgression';

const monitoringReady = advanceQaToMonitoringReady();
// or: reduceGame(state, { type: 'QA_FAST_FORWARD_TO_MONITORING' })

const commandPressureReady = advanceQaToCommandPressureReady();
// or: reduceGame(state, { type: 'QA_FAST_FORWARD_TO_COMMAND_PRESSURE' })
```

## Command Pressure ready (P1.7 testing)

1. Open **Settings**.
2. Under **Developer / QA**, tap **QA: Advance to Command Pressure ready**.
3. Open **Mission Select → Operational assignments → Command Pressure** (or use the base hub banner).
4. Select one strategic posture — no dive launches.

This action completes Growing Ocean monitoring via valid reducer paths and leaves the strategic decision pending.

## Not for production players

The Settings control is gated behind `__DEV__` and is not part of normal gameplay progression.
