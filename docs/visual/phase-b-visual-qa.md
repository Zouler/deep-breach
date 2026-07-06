# Visual Phase B.6 — Device Visual QA & Polish Pass

**Phase:** B.6 Device QA & Polish  
**Branch:** `feature/visual-phase-b-device-qa-polish`  
**Base:** main @ B.5 merge (`7831782`)  
**Last updated:** 2026-07-06  

---

## Checklist (manual code review + integration pass)

| Screen | Checked | Background | Text read | Scrim | Scanline | Portraits | Stamps | Panels | Notes |
|--------|---------|------------|-----------|-------|----------|-----------|--------|--------|-------|
| Title (`index.tsx`) | Yes | OK | OK | Adjusted 0.78→0.74 | Fixed asset tile | — | — | — | Fake cyan overlay replaced with shared scanline PNG |
| Base (`base.tsx`) | Yes | OK | OK | 0.58 kept | OK | — | — | document variant | Command tiles use solid panel fill |
| Mission select | Yes | OK | OK | 0.6 kept | OK | — | — | document variant | Highlight card uses solid bg |
| Story briefing | Yes | OK | OK | 0.62→0.64 | OK | OK | Reduced opacity/size | document variant | Lead cards no longer translucent |
| Assignment briefing/memo | Yes | OK | OK | 0.64 kept | OK | — | OK | memo frame | No code change needed |
| Command briefings | Yes | OK | OK | 0.62 kept | — | OK | — | solid dept cards | Dept cards use panelBgSolid |
| Captain's log | Yes | OK | OK | 0.62 kept | — | OK (72px) | — | document variant | Header spacing OK |
| Crew roster | Yes | OK | OK | 0.6 kept | — | OK | — | document variant | Bust crop bias added |
| Room detail ×4 | Yes | OK | OK | Per-room bump | — | — | — | existing HUD | Lab 0.74, engine 0.72, bridge 0.7 |
| Dive HUD | Yes | OK | OK | 0.68 kept | Softer HUD opacity | — | — | gauges OK | scanlineOpacityHud 0.022 |
| Mission result | Yes | OK | OK | 0.74 kept | OK | — | Right-aligned, softer | hero cards OK | Stamp no longer crowds title |
| Settings | Yes | OK | OK | 0.65 kept | — | — | — | OK | No change |
| Upgrades / campaigns | Yes | OK | OK | 0.6 kept | — | — | — | OK | No change |

---

## Findings

### Fixed in B.6

1. **Title scanline inconsistency** — Title screen used a cyan flat overlay at ~0.35 effective opacity instead of the shared `overlay-scanline-noise.png` tile. Replaced with the same asset used by `ScreenShell`.
2. **Translucent panels on photo backgrounds** — Base, mission select, crew, captain's log, and briefing memo cards used semi-transparent `panelBg`, letting command-hub/briefing plates bleed through mission stats and roster text.
3. **Portrait bust cropping** — Neutral portraits at 56–72px cropped faces too tight with default `cover`. Added slight scale + top bias in `PortraitFrame`.
4. **Classification stamps too loud** — Stamps at 0.42–0.50 competed with briefing kickers and debrief headlines. Reduced per-variant opacity; mission result stamps right-aligned above doc title.
5. **Command tile icon size** — 22px glyphs felt small against solid tiles; bumped to 24px.
6. **Command tile / dept card contrast** — Tiles and department briefing cards now use `panelBgSolid` on photographic backgrounds.
7. **Dive HUD scanline** — Full-strength scanline on active dive could muddy gauge labels; added `scanlineOpacityHud` token and per-screen override.
8. **Room scrims** — Lab plate (brightest) and engine room (amber glow) needed slightly stronger scrims for HUD/repair panel legibility.

### Unresolved (acceptable for playtest)

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Command tile icons are Ionicons, not custom SVG masters | Low | P2: wire `react-native-svg` + `assets/icons/command/*.svg` |
| Service Record tile has no icon (intentional dedup) | Low | Add distinct glyph when SVG wiring lands |
| Mission result still uses repair-dock background | Low | Consider dedicated debrief plate in P2 |
| Sensor / logistics portraits missing | Low | P2 art |
| Sonar room uses dive fallback bg | Low | P2 room plate |
| Physical device color calibration not verified in CI | Medium | Run external playtest on iOS + Android hardware |
| Wordmark-only title on very narrow phones untested | Low | Device spot-check during playtest |

---

## Fixes made (code)

| File | Change |
|------|--------|
| `constants/theme.ts` | `scanlineOpacity` 0.03; add `scanlineOpacityHud` 0.022 |
| `components/ScreenShell.tsx` | Optional `scanlineOpacity` prop |
| `components/PortraitFrame.tsx` | Bust-friendly crop bias (scale + top offset) |
| `components/ClassificationStamp.tsx` | Lower opacity; `align` prop for debrief |
| `components/CommandTileIcon.tsx` | Default size 22→24 |
| `components/CommandTile.tsx` | `panelBgSolid` tile fill |
| `components/DepartmentBriefingCard.tsx` | `panelBgSolid` |
| `app/index.tsx` | Shared scanline asset; scrim 0.74 |
| `app/base.tsx` | PanelCard `variant="document"` on hub |
| `app/mission-select.tsx` | document panels; solid highlight card |
| `app/crew.tsx` | document panels |
| `app/captains-log.tsx` | document panels; portrait 72px |
| `app/story-mission-briefing.tsx` | scrim 0.64; document panels; softer stamp |
| `app/mission-result.tsx` | Right-aligned stamps, smaller widths |
| `app/dive.tsx` | `scanlineOpacityHud` on dive shell |
| `game/roomBackgrounds.ts` | Lab 0.74, engine 0.72, bridge 0.7 scrims |

---

## Playtest readiness

**Verdict: Ready for external playtest** with known P2 polish backlog.

Phase B assets are integrated and readability issues from the integration pass are addressed. No gameplay behavior was changed. Remaining items are cosmetic backlog (SVG glyphs, extra portraits, sonar room, debrief background).

---

## Recommended future visual backlog

1. Wire custom SVG command glyphs (`react-native-svg` + transformer)
2. Dedicated mission debrief background plate
3. Sonar compartment room plate + scrim tuning
4. Sensor / logistics officer portraits
5. Dive HUD chrome evaluation (gauge bezels, alert feed rail)
6. Physical device pass on OLED vs LCD for scrim calibration
