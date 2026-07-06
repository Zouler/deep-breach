# Visual Phase B — Asset Status

**Phase:** B.6 Device Visual QA & Polish  
**Branch:** `feature/visual-phase-b-device-qa-polish`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**P1 prompts:** [`phase-b-p1-art-prompts.md`](./phase-b-p1-art-prompts.md)  
**QA report:** [`phase-b-visual-qa.md`](./phase-b-visual-qa.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Integrated | B.6 polish |
|----------|------------|------------|
| P0 backgrounds / overlay / item icons | Yes (B.3) | Title scanline unified |
| Portraits ×5 | Yes (B.5) | Crop bias; captain log 72px |
| Room plates ×4 | Yes (B.5) | Per-room scrim tuning |
| Command tile icons ×6 | Partial (Ionicons) | Size 24px; solid tile fill |
| Classification stamps ×3 | Yes (B.5) | Lower opacity; debrief alignment |
| Panel readability on photo BGs | — | **document variant** on hub/mission/crew/briefing screens |

---

## Phase B.6 — Visual QA Status

**Screens manually checked:** title, base, mission select, story/assignment briefings, command briefings, captain's log, crew, room detail (×4), dive HUD, mission result, settings, upgrades, campaigns.

**Small fixes made:** scrim/scanline tuning, solid panels on image-heavy screens, portrait crop bias, stamp opacity/placement, command tile contrast, room scrims, dive HUD scanline softening.

**Remaining visual concerns:** Ionicons vs SVG command glyphs; mission result repair-dock bg; missing sensor/logistics portraits; sonar room plate; physical device color calibration not automated.

**Playtest ready:** **Yes** — Phase B visuals are suitable for external playtest with documented P2 backlog.

---

## P1 Integration Map (B.5, unchanged wiring)

### Portraits (`GAME_ASSETS.portraits.*`)

| Asset | Where used | Helper |
|-------|------------|--------|
| `robertsNeutral` | Captain's Log header | `robertsPortrait()` |
| `xoNeutral` | Department cards, story lead lines | `portraitForDepartmentLead` / `portraitForSpeakerId` |
| `engineerNeutral` | Department cards, crew roster, lead lines | same |
| `navigatorNeutral` | Department cards, crew roster, lead lines | same |
| `scientistNeutral` | Department cards, crew roster, lead lines | same |

Component: `PortraitFrame` (56–80px instrument frame; bust crop bias as of B.6)

### Room backgrounds (`GAME_ASSETS.*RoomBackground`)

| RoomId (incl. legacy) | Asset | Scrim (B.6) |
|-----------------------|-------|-------------|
| `command_center` / `bridge` | `bridgeRoomBackground` | 0.70 |
| `engineering` / `engine` | `engineRoomBackground` | 0.72 |
| `research_lab` / `lab` | `labRoomBackground` | 0.74 |
| `cargo_recovery` / `cargo` | `cargoRoomBackground` | 0.68 |
| other | `diveScreenBg` fallback | 0.68 |

Helper: `roomBackgroundForId` / `roomBackgroundScrimForId` in `game/roomBackgrounds.ts`

### Command icons

| Tile | Icon key | Runtime |
|------|----------|---------|
| Repair Dock | `dock` | Ionicons via `CommandTileIcon` (24px) |
| Trial schedule | `missions` | same |
| Command Briefings | `log` | same |
| Upgrades | `upgrades` | same |
| Crew | `crew` | same |
| Inventory | `inventory` | same |
| Service Record | — | text-only (no duplicate glyph) |

**Note:** Custom SVG masters in `assets/icons/command/*.svg` are production reference. `react-native-svg` file wiring deferred.

### Stamps (`GAME_ASSETS.stamps.*`)

| Variant | Where | Opacity (B.6) |
|---------|-------|---------------|
| `classified` | Briefings, failed/aborted result | 0.34 |
| `cleared` | Successful mission result | 0.40 |
| `vesselLost` | Catastrophic mission result | 0.46 |

Component: `ClassificationStamp` — decorative; supports `align="end"` on debrief.

---

## Remaining After Phase B.6

| Item | Priority |
|------|----------|
| Wire custom SVG command glyphs (`react-native-svg` + transformer) | P2 polish |
| Dedicated mission debrief background | P2 |
| Sensor / logistics portraits | P2 |
| Sonar room plate | P2 |
| Dive HUD chrome integration | P2 |
| Wordmark export | P2 |
| Physical device scrim calibration | Playtest follow-up |

---

## Next Steps

1. **External playtest** — run on iOS + Android hardware; spot-check narrow phones
2. Optional: add `react-native-svg` and replace Ionicons with SVG masters
3. P2 art pass — sonar room, extra portraits, debrief plate, dive HUD evaluation
