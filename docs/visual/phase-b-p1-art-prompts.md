# Visual Phase B — P1 Art Production Pack

**Phase:** B.4 P1 Art Preparation  
**Direction:** COLD HULL — Classified Abyssal Instrumentation  
**Spec baseline:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**Review:** [`phase-b-p1-art-review.md`](./phase-b-p1-art-review.md)  
**Conversion:** `node scripts/prepare-phase-b-p1-art.mjs` (requires local `sharp`)

---

## Global style block

> Painted cinematic realism / semi-realism with visible brushwork, muted deep navy palette (#030712–#0a1628), single practical light source, hard sci-fi military submarine interior, film grain, classified Cold War naval research aesthetic, cyan instrument glow, phosphor amber and paper-bone accents, restrained composition. No cartoon, anime, cyberpunk neon, fantasy, glossy mobile-game UI, aliens, monsters, tentacles.

## Global negative prompt

> text, words, letters, watermark, logo, signature, anime, cartoon, 3d render, CGI, neon, cyberpunk, fantasy, steampunk, octopus, tentacles, alien, monster, creature, blood, gore, celebrity likeness, glamour portrait, lens flare overload, oversaturated, low poly, isometric

---

## 1. Character portraits (768×768 WebP q85)

| Output | Role | Production-pack alias | portraitKey |
|--------|------|----------------------|-------------|
| `portrait-roberts-neutral.webp` | Commander Roberts | `portrait-commander-roberts.webp` | player commander |
| `portrait-xo-neutral.webp` | Executive Officer | `portrait-xo.webp` | `xo` |
| `portrait-engineer-neutral.webp` | Chief Engineer | `portrait-chief-engineer.webp` | `chief_engineer` |
| `portrait-navigator-neutral.webp` | Navigation Officer | `portrait-navigation-officer.webp` | `navigation_officer` |
| `portrait-scientist-neutral.webp` | Research Lead | `portrait-research-lead.webp` | `research_lead` |

### Roberts

**Prompt:** Painted semi-realism 3/4 bust portrait, male naval submarine commander early 40s, controlled exhausted expression, responsible procedural quietly under pressure, dark navy working fatigues, subdued rank insignia without readable text, short regulation hair, tired weathered eyes, cool cyan instrument glow from below-left, slight amber rim, muted deep navy background, visible brushwork, hard sci-fi military.

### XO

**Prompt:** Painted semi-realism 3/4 bust portrait, disciplined female executive officer submarine navy, older than crew average, upright posture controlled skepticism moral mirror of command, dark fatigues, steel-gray accent light, blank tablet shape without readable text, muted deep navy background, visible brushwork.

### Engineer

**Prompt:** Painted semi-realism 3/4 bust portrait, male chief engineer mid-50s, blunt solid skeptical brow, navy coveralls rolled sleeves, faint grease marks, amber engine-room glow, muted deep navy background, visible brushwork, industrial submarine.

### Navigator

**Prompt:** Painted semi-realism 3/4 bust portrait, younger female navigation officer, precise watchful, dark fatigues, chart pencil or navigation tool detail, teal cyan chart-table glow, muted deep navy background, visible brushwork.

### Scientist

**Prompt:** Painted semi-realism 3/4 bust portrait, civilian research lead male 30s-40s aboard military submarine, sleep-deprived curiosity faint unease, navy jacket over civilian layer, pale violet-white specimen light, not fully military uniform, muted deep navy background, visible brushwork.

**Post-process:** Centre crop to 768×768 · WebP q85 · folder `assets/images/portraits/`

---

## 2. Room plates (1080×2340 WebP q85)

| Output | RoomId | Production-pack alias |
|--------|--------|----------------------|
| `bg-room-bridge.webp` | `command_center` | `room-command-center.webp` |
| `bg-room-engine.webp` | `engineering` | `room-engineering.webp` |
| `bg-room-lab.webp` | `research_lab` | `room-research-lab.webp` |
| `bg-room-cargo.webp` | `cargo_recovery` | `room-cargo-recovery.webp` |

### Bridge

**Prompt:** Painted cinematic realism submarine bridge command center interior, tiered command consoles, main command chair silhouette, dark instrument panels cyan console glow, controlled military atmosphere, muted deep navy, top dark band for HUD UI, no people, no readable text.

### Engine

**Prompt:** Painted cinematic realism cramped submarine engine bay, turbine machinery hydraulic lines, amber heat glow wet steel steam haze, industrial pressure, muted deep navy, top dark for UI, no people, no text.

### Lab

**Prompt:** Painted cinematic realism compact submarine research lab, specimen cases cold white cyan lighting, old research equipment, clean tense faint unease without creatures or glowing goo, muted deep navy, top dark for UI, no people, no readable labels.

### Cargo

**Prompt:** Painted cinematic realism submarine cargo storage hold, netted crates chain hoist stenciled cases without readable text, sparse warm tungsten work light dark steel shadows, muted deep navy, top dark for UI, no people.

**Post-process:** Letterbox on `#030712` 1080×2340 · top/bottom UI vignette · WebP q85 · folder `assets/images/rooms/`

---

## 3. Command tile icons (SVG 24×24)

Folder: `assets/icons/command/`

| File | Tile | Notes |
|------|------|-------|
| `icon-dock.svg` | Repair Dock | Hull plate + wrench motif |
| `icon-missions.svg` | Trial schedule | Calendar + depth gauge |
| `icon-crew.svg` | Crew | Dual silhouette roster |
| `icon-inventory.svg` | Inventory | Crate / containment |
| `icon-upgrades.svg` | Upgrades | Hex module + chevron |
| `icon-log.svg` | Captain's Log / Service Record | Document folio |

**Rules:** 24×24 viewBox · single-weight stroke · `currentColor` · no gradients · tint via React Native `color` prop or SVG fill override at integration.

---

## 4. Classification stamps (512×256)

| Output | Source | Use |
|--------|--------|-----|
| `stamp-classified.webp` | `stamp-classified.svg` | Briefings, restricted headers |
| `stamp-cleared.webp` | `stamp-cleared.svg` | Cleared / declassified debrief |
| `stamp-vessel-lost.webp` | `stamp-vessel-lost.svg` | Catastrophic mission result |

**Method:** Programmatic SVG (Arial Black) → sharp export WebP with alpha. **Text allowed on stamps only.**

---

## Integration notes (B.5 — not in this phase)

- Map portraits by `portraitKey` in briefing components
- Map room plates in `app/room/[roomId].tsx` by `RoomId`
- Pass SVG command icons to `CommandTile` optional `icon` prop
- Optional stamp decoration on briefing / mission result headers

---

*Phase B.4 · generated 2026-07-06*
