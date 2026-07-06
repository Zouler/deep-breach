# Visual Phase B — MVP Asset Production Pack

**Direction:** COLD HULL — Classified Abyssal Instrumentation  
**Scope:** Production specification only — no code integration, no image generation in this phase  
**Reconciles:** Fable visual audit (15 MVP assets) + `docs/visual/phase-b-deferred.md`  
**Cap:** 17 logical asset entries · 35 individual deliverable files  

---

## 1. Objective

Phase A applied **code-only** instrument styling (panels, mono readouts, command tiles, logo on title screen). The game still reads as a functional prototype because:

- Most screens use **flat navy** or a **single repair-dock plate** reused everywhere (including Captain's Log).
- **Room detail** is text-only — compartments do not feel like places aboard DBX-07.
- **Crew** speak without faces — briefings and alerts lack human anchor.
- **Item icons** ship at ~1254×1254 (~1.5–2 MB each) for ~20 px UI slots.
- **Expo branding** uses oversized logo PNGs without proper export sizes or safe margins.
- **Dive HUD chrome** exists on disk (`assets/ui/dive-hud/`) but is unwired and stylistically unvalidated against COLD HULL.

Phase B fixes this with a **controlled MVP art pass**: backgrounds and overlays that lift many screens, five leadership portraits, command tile glyphs, optimized item icons, and derived store/splash exports — **without** expanding scope into war-era rooms, full HUD replacement art, or new gameplay.

**Out of scope for Phase B MVP:** new story content, AI Story Director UI, combat/weapons room art, alien/anomaly creature art, full 10-room plate set, animated VFX, font licensing.

---

## 2. Final MVP Asset List

**17 entries · 35 files** (sets list internal filenames)

| # | Asset name | Filename(s) | Folder path | Format | Dimensions | Transparent | Priority | Screen usage | Why it matters | Implementation notes |
|---|------------|-------------|-------------|--------|------------|-------------|----------|--------------|----------------|----------------------|
| **A — Branding exports** |
| 1 | Expo app icon | `expo-app-icon.png` | `assets/branding/` | PNG | 1024×1024 | No | P0 | OS home screen, stores | First impression; removes template/oversized logo | **Derived** from `logo-deep-breach-icon.png`; 12% safe margin inside circle mask |
| 2 | Expo adaptive icon foreground | `expo-adaptive-icon.png` | `assets/branding/` | PNG | 1024×1024 | Yes | P0 | Android launcher | Adaptive mask compliance | Center insignia only; transparent outside; test circle + squircle masks |
| 3 | Expo splash plate | `expo-splash-portrait.png` | `assets/branding/` | PNG or WebP | 1284×2778 | No | P0 | App launch splash | Professional boot; not stretched logo | Logo centered upper-third; `#030712` field; optional faint grid at 4% opacity |
| **B — Scanline / noise overlay** |
| 4 | Instrument scanline overlay | `overlay-scanline-noise.png` | `assets/images/overlays/` | PNG | 1080×1920 (tile-safe) | Yes | P0 | Title, base, dive, mission result (via `ScreenShell`) | Unifies COLD HULL “classified instrument” feel across screens | Tileable; alpha 3–6%; no text; multiply/overlay blend in code |
| **C — Command / base background** |
| 5 | Command hub background | `bg-command-hub.webp` | `assets/images/backgrounds/` | WebP q85 | 1080×1920 | No | P0 | `app/base.tsx`, optionally upgrades/crew hub | Replaces “stacked settings” feel with submarine command center | Dark center for tile legibility; practical overhead light; no readable screens |
| **D — Briefing / log backgrounds** |
| 6 | Briefing room background | `bg-briefing-room.webp` | `assets/images/backgrounds/` | WebP q85 | 1080×1920 | No | P0 | `story-mission-briefing`, `assignment-briefing`, `command-briefings`, `assignment-memo` | Story assignments feel like classified memos, not generic cards | Conference table or bulkhead briefing wall; top/bottom darkened for text |
| 7 | Captain's Log background | `bg-captains-log.webp` | `assets/images/backgrounds/` | WebP q85 | 1080×1920 | No | P0 | `app/captains-log.tsx` | Fixes wrong reuse of repair-dock bg | Archive binder / dim chart table aesthetic; warmer bone accent in highlights |
| **E — Room plates (4 MVP compartments)** |
| 8 | Room plate set ×4 | See set below | `assets/images/rooms/` | WebP q85 | 1080×640 each | No | P1 | `app/room/[roomId].tsx` for mapped ids | Makes dive compartments visually distinct | Top 40% clear for HUD text; bottom shows machinery |
| | → Command Center (bridge) | `room-command-center.webp` | | | | | | `command_center` | Primary command deck | Maps legacy id `bridge` |
| | → Engineering | `room-engineering.webp` | | | | | | `engineering` | Engine heat context | Maps legacy id `engine` |
| | → Research Lab | `room-research-lab.webp` | | | | | | `research_lab` | Samples/anomaly tone | Maps legacy id `lab` |
| | → Cargo & Recovery | `room-cargo-recovery.webp` | | | | | | `cargo_recovery` | Logistics/salvage | Maps legacy id `cargo` |
| **F — Character portraits (5 leadership)** |
| 9 | Portrait set ×5 | See set below | `assets/images/portraits/` | WebP q85 | 512×512 each | No | P1 | Briefings, `DepartmentBriefingCard`, cut-ins, crew comms | Humanizes DBX-07 command chain | Bust framing; consistent neutral backdrop; same lighting direction |
| | → Commander Roberts | `portrait-commander-roberts.webp` | | | | | | Player commander / memorial | Story anchor | `SUBMARINE_IDENTITY.commanderName` |
| | → Executive Officer | `portrait-xo.webp` | | | | | | XO lines, command briefings | Second-in-command | `crewLeads` id `xo` |
| | → Chief Engineer | `portrait-chief-engineer.webp` | | | | | | Engineering alerts, repair | Hull/engine voice | id `chief_engineer` |
| | → Navigation Officer | `portrait-navigation-officer.webp` | | | | | | Route/depth advisories | Navigator role | id `navigation_officer` |
| | → Research Lead | `portrait-research-lead.webp` | | | | | | Anomaly/science briefings | Scientific restraint | id `research_lead` |
| **G — Command tile icon set** |
| 10 | Command tile icons ×6 | See set below | `assets/icons/command-tiles/` | PNG | 128×128 each | Yes | P1 | `CommandTile` on `app/base.tsx` | Base nav reads as command stations | Simple glyphs; 2 px stroke; readable at 24–32 px |
| | → Repair Dock | `icon-tile-repair-dock.png` | | | | | | Repair Dock tile | Primary maintenance | Wrench/hull plate motif |
| | → Trial schedule | `icon-tile-trial-schedule.png` | | | | | | Mission select | Operations tempo | Calendar/depth gauge motif |
| | → Command Briefings | `icon-tile-briefings.png` | | | | | | Command briefings | Department status | Document/stack motif |
| | → Upgrades | `icon-tile-upgrades.png` | | | | | | Upgrades | Module refit | Hex module motif |
| | → Crew | `icon-tile-crew.png` | | | | | | Crew roster | Personnel | Silhouette roster motif |
| | → Inventory | `icon-tile-inventory.png` | | | | | | Inventory / storage | Loadout | Crate/containment motif |
| **H — Optimized item icons** |
| 11 | Item icons optimized ×8 | See set below | `assets/icons/items-optimized/` | WebP q80 | 256×256 each | Yes | P0 | HUD, inventory, mission result, base resources | Removes ~12 MB bundle bloat | Visual match to existing icons; do not redesign |
| | → Scrap | `icon-scrap.webp` | | | | | | Economy UI | High frequency | Source: `assets/icons/icon-scrap.png` |
| | → Research Data | `icon-research-data.webp` | | | | | | Research rewards | High frequency | Source: `icon-research-data.png` |
| | → Hull Patch Kit | `icon-hull-patch-kit.webp` | | | | | | Repair UI | | Source: `icon-hull-patch-kit.png` |
| | → Pressure Sealant | `icon-pressure-sealant.webp` | | | | | | Repair UI | | Source: `icon-pressure-sealant.png` |
| | → Oxygen Canister | `icon-oxygen-canister.webp` | | | | | | O₂ UI | | Source: `icon-oxygen-canister.png` |
| | → Artifact / Relic | `icon-artifact.webp` | | | | | | Treasures | | Source: `icon-artifact.png` |
| | → Scan Area | `icon-scan-area.webp` | | | | | | Dive scan actions | | Source: `icon-scan-area.png` |
| | → Crack / Hull stress | `icon-crack.webp` | | | | | | Damage alerts | | Source: `icon-crack.png` |
| **I — Classification / stamp overlays** |
| 12 | Stamp set ×3 | See set below | `assets/stamps/` | PNG | 512×128 each | Yes | P1 | Briefings, mission result debrief, story cards | Reinforces RESTRICTED bureaucracy | Text is intentional on stamps only |
| | → RESTRICTED | `stamp-restricted.png` | | | | | | Generic classified headers | | Red/amber ink; distressed |
| | → DBX PROGRAM | `stamp-dbx-program.png` | | | | | | Program missives | | Cyan/black stamp |
| | → PHOS / compartment | `stamp-phos-restricted.png` | | | | | | First-contact / anomaly docs | | Matches canon RESTRICTED/DBX-07/PHOS |
| **Polish (deferred from Fable — integration or P2 art)** |
| 13 | Gauge bezel overlay | `overlay-gauge-bezel.png` | `assets/images/overlays/` | PNG | 400×48 | Yes | P2 | `StatusBarGauge` in dive HUD | Instrument tick chrome without full HUD PNG | Optional; code ticks may suffice |
| 14 | Wordmark header export | `logo-deep-breach-wordmark.png` | `assets/branding/` | PNG | 1200×400 | Yes | P2 | HUD headers, briefings | **Derived** from existing logo | Trim whitespace; no regen if source sufficient |
| 15 | Sonar room plate | `room-sonar-room.webp` | `assets/images/rooms/` | WebP q85 | 1080×640 | No | P2 | `sonar_room` | Second dive room priority | Add after MVP 4-room set validates |
| 16 | Dive HUD integration | *Existing files* | `assets/ui/dive-hud/` | PNG | various | Mixed | P2 | `app/dive.tsx` | ~15 MB already on disk | **Do not repaint** for MVP; evaluate wire vs replace after backgrounds land |
| 17 | Sensor / Logistics portraits | `portrait-sensor-officer.webp`, `portrait-logistics-officer.webp` | `assets/images/portraits/` | WebP q85 | 512×512 | No | P2 | Extended briefings | Complete department set | Add only if leadership set succeeds |

**Reconciliation notes (Fable ↔ Phase A deferred):**

| Fable item | Phase B decision |
|------------|------------------|
| Wordmark | Entry #14 — derived, P2 |
| App icon / splash | Entries #1–3 — derived exports, P0 |
| Command hub bg | Entry #5 |
| Captain's Log bg | Entry #7 (separate from briefing) |
| Briefing room bg | Entry #6 |
| Dive HUD frame / gauge / alert strip | Entry #16 — **integrate existing** `dive-hud/` first; #13 optional |
| Command tile icons ×6 | Entry #10 |
| Item icons ×8 optimized | Entry #11 |
| Engine + Sonar room | Engine in #8; Sonar deferred #15 |
| Classification strip | Entry #12 stamp set |
| Scanline overlay | Entry #4 |

---

## 3. Folder Structure

```
assets/
├── branding/
│   ├── expo-app-icon.png
│   ├── expo-adaptive-icon.png
│   ├── expo-splash-portrait.png
│   ├── logo-deep-breach-wordmark.png      (P2 derived)
│   ├── logo-deep-breach-icon.png          (existing — source)
│   └── README.txt                         (update paths)
├── images/
│   ├── backgrounds/
│   │   ├── bg-command-hub.webp
│   │   ├── bg-briefing-room.webp
│   │   └── bg-captains-log.webp
│   ├── rooms/
│   │   ├── room-command-center.webp
│   │   ├── room-engineering.webp
│   │   ├── room-research-lab.webp
│   │   └── room-cargo-recovery.webp
│   ├── portraits/
│   │   ├── portrait-commander-roberts.webp
│   │   ├── portrait-xo.webp
│   │   ├── portrait-chief-engineer.webp
│   │   ├── portrait-navigation-officer.webp
│   │   └── portrait-research-lead.webp
│   ├── overlays/
│   │   ├── overlay-scanline-noise.png
│   │   └── overlay-gauge-bezel.png        (P2)
│   ├── base-repair-dock-bg.png            (existing — repair dock only)
│   ├── dive-screen-bg.png                 (existing — dive)
│   └── splash-title-bg.png                (existing — title)
├── icons/
│   ├── items-optimized/                   (NEW — Phase B WebP set)
│   ├── command-tiles/                     (NEW — Phase B PNG set)
│   └── icon-*.png                         (existing — keep as source masters)
├── stamps/
│   ├── stamp-restricted.png
│   ├── stamp-dbx-program.png
│   └── stamp-phos-restricted.png
└── ui/
    └── dive-hud/                          (existing — integration pass later)
```

---

## 4. Asset Naming Rules

- **kebab-case** only: `bg-command-hub.webp`, not `CommandHub.webp`
- **Type prefixes** (required for new art):
  - `bg-` — full-screen backgrounds
  - `room-` — compartment plates
  - `portrait-` — character busts
  - `icon-tile-` — base command tile glyphs
  - `icon-` — economy/item icons (optimized folder)
  - `overlay-` — transparent full-screen or widget overlays
  - `stamp-` — classification stamps with text
  - `expo-` — store/splash derived exports
  - `fx-` — reserved for future animated/static effect sheets
- **No spaces**, no camelCase, no version suffixes (`-v2`, `-final`)
- **Room filenames** match `RoomId` in `game/rooms.ts` where possible
- **Portrait filenames** match `portraitKey` in `data/crewLeads.ts` (with `commander-roberts` for player)
- **Do not** embed dimensions in filenames

---

## 5. Ready-to-use Image Generation Prompts

Global style block (prepend mentally to every prompt):

> Painted cinematic realism, muted deep navy palette (#030712–#0a1628), single practical overhead or side light, hard sci-fi military submarine interior, film grain, classified Cold War naval research aesthetic, COLD HULL instrument mood, restrained composition, no cartoon, no anime, no cyberpunk neon, no fantasy, no glossy mobile-game UI look.

Global negative prompt:

> text, words, letters, watermark, logo, signature, anime, cartoon, 3d render, CGI, neon, cyberpunk, fantasy, steampunk, octopus, tentacles, alien, monster, creature, blood, gore, lens flare overload, oversaturated, low poly, isometric, emoji, humanoid alien

---

### 5.1 Command hub background

| Field | Value |
|-------|-------|
| Filename | `bg-command-hub.webp` |
| Aspect ratio | 9:16 |
| Dimensions | 1080×1920 |
| Prompt | Painted cinematic realism of a classified deep-sea submarine command hub interior at rest in dock, muted deep navy and steel, central dim console glow, bulkhead pipes and instrument panels out of focus, single practical overhead light, empty operator chairs, film grain, hard sci-fi military atmosphere, dark lower third for UI tiles, no people, no readable text on screens |
| Negative | (global) + busy foreground clutter, bright windows, daylight, ocean surface view |
| Notes | Leave center-lower 60% dark for 2-column command grid |

---

### 5.2 Briefing room background

| Field | Value |
|-------|-------|
| Filename | `bg-briefing-room.webp` |
| Aspect ratio | 9:16 |
| Dimensions | 1080×1920 |
| Prompt | Painted cinematic realism of a small military submarine briefing room, steel conference table edge visible, bulkhead-mounted classified document trays, muted navy walls, single practical lamp pool of light, film grain, hard sci-fi, top and bottom vignetted dark for scrolling text panels, no people, no readable documents |
| Negative | (global) + whiteboard text, projector slides, windows |
| Notes | Used on story assignment and command briefing flows |

---

### 5.3 Captain's Log background

| Field | Value |
|-------|-------|
| Filename | `bg-captains-log.webp` |
| Aspect ratio | 9:16 |
| Dimensions | 1080×1920 |
| Prompt | Painted cinematic realism of a captain's log archive nook aboard a research submarine, open metal binder and chart table, muted bone and navy tones, single desk lamp practical light, film grain, bureaucratic military archive mood, dark margins for log text, no people, no readable writing |
| Negative | (global) + modern office, laptop, bright paper text |
| Notes | Must feel distinct from repair dock and briefing room |

---

### 5.4 Bridge / Command Center room plate

| Field | Value |
|-------|-------|
| Filename | `room-command-center.webp` |
| Aspect ratio | 16:9 |
| Dimensions | 1080×640 |
| Prompt | Painted cinematic realism of a submarine command center interior cross-section, helm chairs and plotting table silhouettes, muted deep navy, instrument panels with unreadable amber glow, single overhead practical light, film grain, hard sci-fi, top portion darker for HUD overlay, no people faces |
| Negative | (global) |
| Notes | Maps to `command_center` |

---

### 5.5 Engineering room plate

| Field | Value |
|-------|-------|
| Filename | `room-engineering.webp` |
| Aspect ratio | 16:9 |
| Dimensions | 1080×640 |
| Prompt | Painted cinematic realism of a submarine engineering bay, diesel-electric machinery, pipe runs, heat shimmer suggestion, muted navy and steel, single side practical light, film grain, hard sci-fi industrial, no people, top dark band for UI |
| Negative | (global) + fire, explosion |
| Notes | Engine heat narrative context |

---

### 5.6 Research Lab room plate

| Field | Value |
|-------|-------|
| Filename | `room-research-lab.webp` |
| Aspect ratio | 16:9 |
| Dimensions | 1080×640 |
| Prompt | Painted cinematic realism of a compact submarine science lab, sample racks and sealed specimen containers, muted navy, cool cyan secondary light on bench, single practical overhead light, film grain, hard sci-fi research mood, no readable labels, no people |
| Negative | (global) + alien specimens, glowing green goo |
| Notes | Anomaly tone without revealing truth |

---

### 5.7 Cargo room plate

| Field | Value |
|-------|-------|
| Filename | `room-cargo-recovery.webp` |
| Aspect ratio | 16:9 |
| Dimensions | 1080×640 |
| Prompt | Painted cinematic realism of a submarine cargo and recovery bay, netting, sealed crates, salvage winch silhouette, muted deep navy, single hanging practical work light, film grain, hard sci-fi logistics, no people, dark upper band |
| Negative | (global) |
| Notes | Salvage/economy context |

---

### 5.8 Commander Roberts portrait

| Field | Value |
|-------|-------|
| Filename | `portrait-commander-roberts.webp` |
| Aspect ratio | 1:1 |
| Dimensions | 512×512 |
| Prompt | Painted cinematic realism portrait bust of a middle-aged male submarine commander, short military hair, calm severe expression, dark navy uniform with subtle DBX program insignia without readable text, muted deep navy background, single practical side light, film grain, hard sci-fi military, Phillip Roberts energy, not celebrity likeness |
| Negative | (global) + smile, medal text, name tag text |
| Notes | Player commander; memorial screen reuse |

---

### 5.9 XO portrait

| Field | Value |
|-------|-------|
| Filename | `portrait-xo.webp` |
| Aspect ratio | 1:1 |
| Dimensions | 512×512 |
| Prompt | Painted cinematic realism portrait bust of a female executive officer in submarine navy uniform, disciplined expression, muted deep navy background, single practical side light, film grain, hard sci-fi, no readable insignia text |
| Negative | (global) |

---

### 5.10 Chief Engineer portrait

| Field | Value |
|-------|-------|
| Filename | `portrait-chief-engineer.webp` |
| Aspect ratio | 1:1 |
| Dimensions | 512×512 |
| Prompt | Painted cinematic realism portrait bust of a male chief engineer, oil-smudged practical coveralls over navy undershirt, tired competent expression, muted deep navy background, single practical side light, film grain, hard sci-fi industrial submarine |
| Negative | (global) |

---

### 5.11 Navigation Officer portrait

| Field | Value |
|-------|-------|
| Filename | `portrait-navigation-officer.webp` |
| Aspect ratio | 1:1 |
| Dimensions | 512×512 |
| Prompt | Painted cinematic realism portrait bust of a female navigation officer, headset around neck, focused expression, muted deep navy background, single practical side light, film grain, hard sci-fi submarine service |
| Negative | (global) |

---

### 5.12 Research Lead portrait

| Field | Value |
|-------|-------|
| Filename | `portrait-research-lead.webp` |
| Aspect ratio | 1:1 |
| Dimensions | 512×512 |
| Prompt | Painted cinematic realism portrait bust of a male research lead scientist in subdued navy lab coat, guarded analytical expression, muted deep navy background, single practical side light, film grain, hard sci-fi, no lab equipment logos |
| Negative | (global) + mad scientist, glowing vials |

---

### 5.13 Scanline / noise overlay

| Field | Value |
|-------|-------|
| Filename | `overlay-scanline-noise.png` |
| Aspect ratio | 9:16 |
| Dimensions | 1080×1920 (tileable vertically) |
| Prompt | Subtle full-frame analog scanline and film grain overlay texture, monochrome cyan-gray on transparent background, very low contrast horizontal lines, fine noise, classified CRT instrument aesthetic, seamless tile, no objects, no text |
| Negative | (global) + objects, scene, people, heavy vignette |
| Notes | Export PNG with alpha; target 3–6% visible opacity in app |

---

### 5.14 Classification stamp set (generated as art plates)

Generate three separate stamp images with **intentional text** (only category where text is allowed):

| Filename | Dimensions | Prompt |
|----------|------------|--------|
| `stamp-restricted.png` | 512×128 | Distressed military rubber stamp reading RESTRICTED, red-amber ink on transparent background, slightly uneven impression, hard sci-fi bureaucratic, no other words |
| `stamp-dbx-program.png` | 512×128 | Distressed stamp reading DBX PROGRAM, cyan-black ink, transparent background, classified document aesthetic |
| `stamp-phos-restricted.png` | 512×128 | Distressed stamp reading PHOS · RESTRICTED, muted red ink, transparent background, narrow classified marking |

Negative for stamps: extra sentences, paragraph text, barcode, QR code

---

### 5.15 Anomaly static overlay (optional P2)

| Field | Value |
|-------|-------|
| Filename | `overlay-anomaly-static.png` |
| Aspect ratio | 16:9 |
| Dimensions | 1080×640 |
| Prompt | Abstract subtle electromagnetic static interference texture, faint horizontal banding and soft cyan noise, transparent background, hard sci-fi sensor artifact, no shapes, no symbols, no creatures |
| Negative | (global) + face, eye, creature |
| Notes | P2 only; use sparingly on anomaly mission debrief or dive event flash |

---

## 6. Non-generated / Derived Assets

| Output | Source file | Output path | Dimensions | Safe margins | Notes |
|--------|-------------|-------------|------------|--------------|-------|
| Expo app icon | `assets/images/logo-deep-breach-icon.png` | `assets/branding/expo-app-icon.png` | 1024×1024 | 12% inset from edges | Downscale + center; test iOS/Android preview |
| Adaptive icon foreground | Same | `assets/branding/expo-adaptive-icon.png` | 1024×1024 | Center 66% safe zone | Transparent outside insignia |
| Splash portrait | `assets/images/logo-deep-breach.png` | `assets/branding/expo-splash-portrait.png` | 1284×2778 | Logo in upper 35%; `#030712` fill | `resizeMode: contain` compatible |
| Title lockup / wordmark | `assets/images/logo-deep-breach.png` | `assets/branding/logo-deep-breach-wordmark.png` | ~1200×400 | Trim transparent padding | Optional P2; Phase A already uses full logo |
| Item icons ×8 | `assets/icons/icon-*.png` | `assets/icons/items-optimized/icon-*.webp` | 256×256 | N/A | Lanczos/bicubic downscale; **do not AI-regenerate** |
| Favicon (web) | `logo-deep-breach-icon.png` | `assets/images/favicon.png` | 48×48 or 64×64 | Center | Replace 1 KB placeholder |

**Do not AI-regenerate:** Deep Breach logo, Barracuda Games logo, existing item icon artwork (optimize only).

---

## 7. Optimization Requirements

| Asset type | Format | Quality | Max file size (guideline) |
|------------|--------|---------|---------------------------|
| Full-screen backgrounds | WebP | q85 | ≤ 350 KB each |
| Room plates | WebP | q85 | ≤ 200 KB each |
| Portraits | WebP | q85 | ≤ 120 KB each |
| Item icons | WebP | q80 | ≤ 40 KB each (256×256) |
| Command tile icons | PNG | n/a | ≤ 25 KB each (128×128); SVG acceptable if added later |
| Overlays (scanline) | PNG | n/a | ≤ 150 KB |
| Stamps | PNG | n/a | ≤ 80 KB each |
| Expo icon/splash | PNG | n/a | Icon ≤ 500 KB; splash ≤ 800 KB |

**Rules:**

- Never ship 1254×1254 icons for 20 px UI — use `items-optimized/` only in app after integration
- Keep masters (`assets/icons/icon-*.png`) in repo for future re-export but **exclude from Metro bundle** after swap
- Prefer WebP for opaque art; PNG only for alpha overlays/icons
- Run `npx expo export` or bundle size check after integration phase

---

## 8. Integration Plan for Later

**Do not implement in Phase B production pass.** Checklist for Phase B integration PR:

- [ ] Add all new paths to `constants/assets.ts` (`backgrounds`, `rooms`, `portraits`, `overlays`, `stamps`, `commandTiles`, optimized icons)
- [ ] Update `app.json` to `assets/branding/expo-*` exports
- [ ] Screen background map:
  - [ ] `base.tsx` → `bg-command-hub.webp`
  - [ ] `captains-log.tsx` → `bg-captains-log.webp`
  - [ ] `story-mission-briefing.tsx`, `assignment-briefing.tsx`, `command-briefings.tsx` → `bg-briefing-room.webp`
  - [ ] Keep `base-repair-dock-bg` for repair-dock / mission-result only
  - [ ] Keep `dive-screen-bg` for dive
  - [ ] Keep `splash-title-bg` for title (optional swap to briefing/command plate variant)
- [ ] `ScreenShell`: optional `overlay-scanline-noise.png` at `theme.scanlineOpacity`
- [ ] `app/room/[roomId].tsx`: map `RoomId` → `room-*.webp` with fallback panel
- [ ] `data/crewLeads.ts` / briefing components: map `portraitKey` → `portrait-*.webp`
- [ ] `CommandTile`: optional `icon-tile-*.png` prop
- [ ] Swap `GAME_ASSETS.icons.*` to `items-optimized/` WebP paths
- [ ] Briefing / mission result: optional `stamp-*.png` header decoration
- [ ] Evaluate wiring existing `assets/ui/dive-hud/*.png` vs lightweight overlays
- [ ] Test cold start: icon, splash, adaptive icon on device
- [ ] Run `npm run check`
- [ ] Playtest: text legibility on all new backgrounds (WCAG contrast on panels)

---

## 9. Phase B Priority Order

1. **First impression (P0 derived + overlays)**  
   `#1–3` Expo exports → `#4` scanline overlay → `#11` optimized item icons (quick win, no AI)

2. **Most screens (P0 backgrounds)**  
   `#5` command hub → `#6` briefing room → `#7` captain's log

3. **Humanize (P1 portraits)**  
   `#9` Roberts + XO first, then engineer / nav / research

4. **Base navigation (P1 tiles)**  
   `#10` command tile icon set

5. **Room identity (P1 plates)**  
   `#8` command center + engineering first, then lab + cargo

6. **Polish (P1 stamps → P2 extras)**  
   `#12` stamps → `#13–17` gauge bezel, sonar room, extra portraits, dive HUD wire-up

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Inconsistent AI art style | Same global prompt block; same artist/session; reference plate collage before batch 2 |
| Unreadable busy backgrounds | Dark lower/third vignette; always place `PanelCard` scrim; legibility test on device |
| Accidental text in images | Global negative prompt; QA reject any readable screen text except stamp assets |
| Portrait inconsistency | Fixed lighting direction (camera left, 45°); shared neutral backdrop reference |
| File size bloat | WebP q85/q80 caps; optimized icons mandatory; do not bundle dive-hud until wired |
| Icons too detailed at mobile size | Command tiles: 2 px stroke, simple silhouettes; test at 24 px |
| Expo icon clipping | Test Android adaptive mask + iOS rounded square before ship |
| Scope creep | This doc caps at 17 entries; defer sonar room, sensor/logistics portraits, HUD repaint |

---

## 11. Final Recommendation

| Metric | Value |
|--------|--------|
| **MVP asset entries** | **17** (12 P0/P1 production + 5 P2/integration/deferred) |
| **Individual files to create (P0+P1)** | **28** (3 derived + 1 overlay + 3 bg + 4 rooms + 5 portraits + 6 tiles + 8 icons + 3 stamps − icons are derived = **20 AI + 8 derived/icon + 3 derived/expo**) |
| **Exact P0+P1 file count** | **35** total deliverables listed in §2 (including 3 expo derived, 8 icon derived, 20 generated art) |

### First 5 assets to create

1. **`bg-command-hub.webp`** — lifts base immediately  
2. **`overlay-scanline-noise.png`** — cheap multi-screen COLD HULL unify  
3. **`bg-briefing-room.webp`** — story spine presentations  
4. **`expo-app-icon.png`** (derived) — store/home screen credibility  
5. **`icon-scrap.webp`** (+ batch the other 7 optimized icons from existing art)

### Next prompt — generate assets

> Using `docs/visual/phase-b-asset-production-pack.md` §5 prompts and global style/negative blocks, generate Phase B P0 assets in order: `bg-command-hub.webp`, `overlay-scanline-noise.png`, `bg-briefing-room.webp`, `bg-captains-log.webp`, then portrait set #9. Save to the folder paths in §3. Do not modify app code.

### Next prompt — integrate assets (after files exist)

> Visual Phase B integration: wire assets from `docs/visual/phase-b-asset-production-pack.md` into `constants/assets.ts`, map backgrounds per §8, add portraits to briefing components, command tile icons to `CommandTile`, optimized item icons, scanline overlay on `ScreenShell`, and update `app.json` branding paths. Run `npm run check`. Do not add new gameplay.

---

*Document version: Phase B production pack v1 · reconciled with Fable 15-asset audit and Phase A deferred list*
