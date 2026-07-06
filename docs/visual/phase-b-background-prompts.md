# Visual Phase B — P0 Background Prompts & Review

**Phase:** B.2 P0 Background Generation  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**Output folder:** `assets/images/backgrounds/`  
**Conversion:** `node scripts/prepare-phase-b-p0-backgrounds.mjs` (requires `sharp`; run `npm install sharp --no-save` locally if missing)

---

## Global style block

> Painted cinematic realism, muted deep navy palette (#030712–#0a1628), single practical overhead or side light, hard sci-fi military submarine interior, film grain, classified Cold War naval research aesthetic, COLD HULL instrument mood, restrained composition, no cartoon, no anime, no cyberpunk neon, no fantasy, no glossy mobile-game UI look.

## Global negative prompt

> text, words, letters, watermark, logo, signature, anime, cartoon, 3d render, CGI, neon, cyberpunk, fantasy, steampunk, octopus, tentacles, alien, monster, creature, blood, gore, lens flare overload, oversaturated, low poly, isometric, emoji, humanoid alien, people, faces, crowd

---

## 1. bg-command-hub.webp

| Field | Value |
|-------|-------|
| **Filename** | `bg-command-hub.webp` |
| **Dimensions** | 1080×2340 portrait |
| **Format** | WebP q85 |
| **Purpose** | Base screen, command hub, future campaigns/mission planning |
| **Screens (integration later)** | `app/base.tsx`, upgrades/crew hub |

### Prompt

Submarine base operations room at night, painted cinematic realism, muted deep navy and steel palette, large backlit plotting table with sonar charts under glass, empty operator chairs, wall of dim status monitors with unreadable glow, single amber desk lamp, subtle smoke haze, heavy shadow, center-bottom third kept very dark and uncluttered for mobile UI overlay, hard sci-fi military submarine base operations atmosphere, classified Cold War naval research mood, film grain, single practical light source, no people, no text, no readable screens.

### Negative

(global) + busy foreground clutter, bright windows, daylight, ocean surface view, readable monitor text

### Post-process

- Source landscape → resize to 1080w, letterbox on `#030712` canvas 1080×2340
- Top offset 12%; top/bottom vignette gradient for UI scrim
- Regenerate script: `prepare-phase-b-p0-backgrounds.mjs`

### Review checklist (B.2)

| Check | Result | Notes |
|-------|--------|-------|
| COLD HULL style consistency | **Pass** | Navy/steel, amber + cyan monitor glow, film grain mood |
| UI readability (bottom 40%) | **Pass** | Heavy shadow + vignette; tile-safe lower third |
| No unwanted generated text | **Pass** | Charts/graphs abstract; no legible words |
| No people/creatures | **Pass** | Empty chairs only |
| No fantasy/neon drift | **Pass** | Practical military lighting |
| File size ≤ ~800 KB | **Pass** | ~55 KB |
| Dimensions 1080×2340 | **Pass** | |
| Mobile portrait crop | **Pass** | Letterboxed portrait with dark margins |

**Integration readiness:** Ready (not wired — Phase B integration PR)

---

## 2. bg-briefing-room.webp

| Field | Value |
|-------|-------|
| **Filename** | `bg-briefing-room.webp` |
| **Dimensions** | 1080×2340 portrait |
| **Format** | WebP q85 |
| **Purpose** | Story briefing, command briefings, operational memos |
| **Screens (integration later)** | `story-mission-briefing`, `assignment-briefing`, `command-briefings`, `assignment-memo` |

### Prompt

Classified submarine briefing room interior, painted cinematic realism, narrow metal bulkhead walls, muted deep navy palette, dim overhead practical light, faint projection screen glow without readable content, sealed folders on metal conference table, military scientific research atmosphere, restrained dread, top and bottom vignetted dark for text panels, hard sci-fi submarine, film grain, no people, no readable text or documents.

### Negative

(global) + whiteboard text, projector slides with text, windows, daylight

### Post-process

- Top offset 10%; vignette as above

### Review checklist (B.2)

| Check | Result | Notes |
|-------|--------|-------|
| COLD HULL style consistency | **Pass** | Narrow metal compartment, dim practical light |
| UI readability | **Pass** | Dark table foreground; top/bottom vignette |
| No unwanted generated text | **Pass** | Screen blank white; folder seals decorative only |
| No people/creatures | **Pass** | |
| No fantasy/neon drift | **Pass** | |
| File size ≤ ~800 KB | **Pass** | ~40 KB |
| Dimensions 1080×2340 | **Pass** | |
| Mobile portrait crop | **Pass** | |

**Integration readiness:** Ready (not wired)

---

## 3. bg-captains-log.webp

| Field | Value |
|-------|-------|
| **Filename** | `bg-captains-log.webp` |
| **Dimensions** | 1080×2340 portrait |
| **Format** | WebP q85 |
| **Purpose** | Captain's Log, administrative/archive tone |
| **Screens (integration later)** | `app/captains-log.tsx` |

### Prompt

Captain cabin desk inside experimental deep-sea submarine, painted cinematic realism, dark wood and steel desk, analog tape recorder, sealed classified folders, dim amber desk lamp, small porthole showing ocean pressure darkness outside, muted deep navy and bone accent tones, bureaucratic military archive mood, dark margins for log text UI, hard sci-fi classified document atmosphere, film grain, no people, no readable writing.

### Negative

(global) + modern office, laptop, bright paper text, readable labels

### Post-process

- Top offset 14%; vignette as above

### Review checklist (B.2)

| Check | Result | Notes |
|-------|--------|-------|
| COLD HULL style consistency | **Pass** | Archive nook, amber lamp, porthole pressure darkness |
| UI readability | **Pass** | Left/bottom shadow bands suitable for log text panels |
| No unwanted generated text | **Pass** | Folder labels illegible at mobile scale |
| No people/creatures | **Pass** | Empty chair edge only |
| No fantasy/neon drift | **Pass** | Analog equipment, no neon |
| File size ≤ ~800 KB | **Pass** | ~54 KB |
| Dimensions 1080×2340 | **Pass** | |
| Mobile portrait crop | **Pass** | |

**Integration readiness:** Ready (not wired)

---

## Regeneration workflow

1. Generate landscape source (~1536×1024) with prompts above + global blocks.
2. Save sources as `bg-*-source.png` (local; not required in repo).
3. Run conversion:
   ```bash
   npm install sharp --no-save
   node scripts/prepare-phase-b-p0-backgrounds.mjs
   ```
4. Re-run review checklist on device with `PanelCard` scrim at 50% opacity.
5. Update [`phase-b-asset-status.md`](./phase-b-asset-status.md).

## Manual art-review triggers (reject & regenerate)

- Any legible words, numbers, or UI chrome on screens/documents
- Human faces or silhouettes read as people
- Bright daylight, surface ocean view, or neon color cast
- Bottom third too busy for command tile grid
- Style drift vs other two backgrounds (re-batch all three together)

---

*Phase B.2 · generated 2026-07-06 · sources via Cursor image generation session*
