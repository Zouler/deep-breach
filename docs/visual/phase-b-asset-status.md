# Visual Phase B — Asset Status

**Phase:** B.3 P0 Asset Integration  
**Branch:** `feature/visual-phase-b-p0-integration`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**Prompts & review:** [`phase-b-background-prompts.md`](./phase-b-background-prompts.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Created | Integrated | Pending |
|----------|---------|------------|---------|
| Derived branding | 4 | 4 (`app.json`) | wordmark P2 |
| Scanline overlay | 1 | **Yes** (`ScreenShell`) | — |
| Optimized item icons | 8 | **Yes** (`constants/assets.ts`) | WebP re-export optional |
| P0 backgrounds | 3 | **Yes** (screen map below) | — |
| Room plates | 0 | — | 4 P1 |
| Portraits | 0 | — | 5 P1 |
| Command tile icons | 0 | — | 6 P1 |
| Classification stamps | 0 | — | 3 P1 |

---

## Integration Map (B.3)

### Backgrounds

| Asset | Screens | Scrim |
|-------|---------|-------|
| `commandHubBackground` | `base`, `mission-select`, `campaigns`, `crew`, `upgrades` | 0.58–0.60 |
| `briefingRoomBackground` | `story-mission-briefing`, `command-briefings`, `assignment-briefing`, `assignment-memo` | 0.62–0.64 |
| `captainsLogBackground` | `captains-log`, `settings` | 0.62–0.65 |
| `baseRepairDockBg` | `repair-dock`, `base-storage`, `inventory` (base), `mission-result` | unchanged |
| `diveScreenBg` | `dive`, `inventory` (dive), `room/[roomId]` | unchanged |

### Scanline overlay (`scanlineOverlay` prop on `ScreenShell`)

Enabled on: `base`, `mission-select`, `story-mission-briefing`, `dive`, `mission-result`  
Opacity: `theme.scanlineOpacity` (0.035) · tile repeat · `pointerEvents="none"`

### Optimized item icons

All `GAME_ASSETS.icons.*` now resolve to `assets/icons/items-optimized/icon-*.png` (256×256).  
Original masters in `assets/icons/` remain untouched and unbundled.

### Asset registry (`constants/assets.ts`)

- `commandHubBackground`
- `briefingRoomBackground`
- `captainsLogBackground`
- `scanlineNoiseOverlay`
- `icons.*` → optimized set

---

## Manual Visual QA Checklist

Run on device or simulator after merge:

- [ ] **Base screen** — command hub background visible; tiles and panels readable; not over-darkened
- [ ] **Mission select** — command hub background; trial cards readable
- [ ] **Story briefing** — briefing room background; memo panels readable
- [ ] **Command briefings** — briefing room background; department cards readable
- [ ] **Captain’s Log** — uses captain’s log background (not repair dock)
- [ ] **Settings** — captain’s log / archive tone
- [ ] **Item icons** — render correctly in base resources, dive HUD, repair dock, mission result
- [ ] **Scanline overlay** — subtle on base/dive/briefing/result; not noisy; touches work
- [ ] **Title / splash / app icon** — unchanged (`app/index`, cold start)
- [ ] **Repair dock / mission result** — still use repair-dock plate where intended

---

## Assets Deferred (P1+)

| Priority | Asset | Reason |
|----------|-------|--------|
| P1 | Room plates ×4 | AI art |
| P1 | Portraits ×5 | AI art |
| P1 | Command tile icons ×6 | Glyph design |
| P1 | Classification stamps ×3 | Intentional text stamps |
| P2 | Wordmark, sonar room, gauge bezel, dive HUD wire-up | Per production pack |

---

## Next Steps

1. **Device playtest** — run manual QA checklist above
2. **P1 art pass** — portraits + room plates + command tile icons + stamps
3. **Optional** — re-export item icons as WebP for further bundle savings
