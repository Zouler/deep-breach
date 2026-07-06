# Visual Phase B — Asset Status

**Phase:** B.5 P1 Asset Integration  
**Branch:** `feature/visual-phase-b-p1-integration`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**P1 prompts:** [`phase-b-p1-art-prompts.md`](./phase-b-p1-art-prompts.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Integrated (B.5) | Notes |
|----------|------------------|-------|
| P0 backgrounds / overlay / item icons | Yes (B.3) | — |
| Portraits ×5 | **Yes** | Cards + briefings |
| Room plates ×4 | **Yes** | Dive room detail |
| Command tile icons ×6 | **Partial** | Ionicons runtime; SVG masters on disk |
| Classification stamps ×3 | **Yes** | Briefings + mission result |

---

## P1 Integration Map (B.5)

### Portraits (`GAME_ASSETS.portraits.*`)

| Asset | Where used | Helper |
|-------|------------|--------|
| `robertsNeutral` | Captain's Log header | `robertsPortrait()` |
| `xoNeutral` | Department cards, story lead lines | `portraitForDepartmentLead` / `portraitForSpeakerId` |
| `engineerNeutral` | Department cards, crew roster, lead lines | same |
| `navigatorNeutral` | Department cards, crew roster, lead lines | same |
| `scientistNeutral` | Department cards, crew roster, lead lines | same |

Component: `PortraitFrame` (64–80px instrument frame)

### Room backgrounds (`GAME_ASSETS.*RoomBackground`)

| RoomId (incl. legacy) | Asset | Screen |
|-----------------------|-------|--------|
| `command_center` / `bridge` | `bridgeRoomBackground` | `room/[roomId].tsx` |
| `engineering` / `engine` | `engineRoomBackground` | same |
| `research_lab` / `lab` | `labRoomBackground` | same |
| `cargo_recovery` / `cargo` | `cargoRoomBackground` | same |
| other | `diveScreenBg` fallback | same |

Helper: `roomBackgroundForId` / `roomBackgroundScrimForId` in `game/roomBackgrounds.ts`

### Command icons

| Tile | Icon key | Runtime |
|------|----------|---------|
| Repair Dock | `dock` | Ionicons via `CommandTileIcon` |
| Trial schedule | `missions` | same |
| Command Briefings | `log` | same |
| Upgrades | `upgrades` | same |
| Crew | `crew` | same |
| Inventory | `inventory` | same |
| Service Record | — | text-only (no duplicate glyph) |

**Note:** Custom SVG masters in `assets/icons/command/*.svg` are production reference. `react-native-svg` file wiring deferred to avoid new dependency; swap `CommandTileIcon` when added.

### Stamps (`GAME_ASSETS.stamps.*`)

| Variant | Where |
|---------|-------|
| `classified` | Story mission briefing, assignment briefing/memo, failed/aborted result |
| `cleared` | Successful mission result |
| `vesselLost` | Catastrophic mission result |

Component: `ClassificationStamp` (decorative, low opacity)

---

## Manual Visual QA Checklist (B.5)

- [ ] **Crew roster** — engineer/navigator/scientist portraits visible at 72px
- [ ] **Department briefing cards** — lead portraits at 64px; text readable
- [ ] **Story briefing lead lines** — speaker portraits match role
- [ ] **Captain's Log** — Roberts portrait; not repair-dock bg (uses captains log bg)
- [ ] **Room detail** — bridge/engine/lab/cargo distinct backgrounds; repair UI readable
- [ ] **Command tiles** — icons tinted cyan/amber; readable at mobile size
- [ ] **Stamps** — subtle on briefings; cleared/vessel-lost on result; no text overlap
- [ ] **No gameplay regression** — hire, repair, dive, missions unchanged
- [ ] **No missing assets** — no red error screens

---

## Remaining After Phase B.5

| Item | Priority |
|------|----------|
| Wire custom SVG command glyphs (`react-native-svg` + transformer) | P2 polish |
| Sensor / logistics portraits | P2 |
| Sonar room plate | P2 |
| Dive HUD chrome integration | P2 |
| Wordmark export | P2 |

---

## Next Steps

1. Device playtest — run checklist above
2. Optional: add `react-native-svg` and replace Ionicons with SVG masters
3. P2 art pass — sonar room, extra portraits, dive HUD evaluation
