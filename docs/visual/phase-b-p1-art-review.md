# Visual Phase B — P1 Art Review Checklist

**Phase:** B.4 P1 Art Preparation  
**Assets:** portraits ×5 · room plates ×4 · command icons ×6 · stamps ×3  
**Prompts:** [`phase-b-p1-art-prompts.md`](./phase-b-p1-art-prompts.md)  
**Status doc:** [`phase-b-asset-status.md`](./phase-b-asset-status.md)

Run this checklist on device before P1 integration (Phase B.5).

---

## Global COLD HULL

| Check | Status | Notes |
|-------|--------|-------|
| Style matches P0 backgrounds (navy, practical light, film grain mood) | **Review** | Batch generated same session |
| No cyberpunk neon / fantasy / cartoon drift | **Review** | Reject if saturated neon appears |
| File sizes within mobile budget | **Pass** | All WebP ≤ ~90 KB except lab room ~89 KB |

---

## Portraits (768×768)

| Check | Status | Notes |
|-------|--------|-------|
| Consistent lighting direction (camera-left / instrument below-left) | **Review** | Adjust batch if one outlier |
| No celebrity likeness | **Review** | Generic military/scientific faces |
| No glamour / anime / cartoon style | **Review** | Semi-realism with brushwork |
| Face readable at 64px thumbnail | **Review** | Test in `DepartmentBriefingCard` mock |
| No generated text / insignia readable | **Review** | Reject readable name tags |
| Neutral expression set (not smiling action poses) | **Review** | Roberts exhausted; XO disciplined |
| Background dark enough for UI card overlay | **Pass** | Navy instrument backdrop |

### Per portrait

| File | Ready | Review notes |
|------|-------|--------------|
| `portrait-roberts-neutral.webp` | Pending review | Commander anchor |
| `portrait-xo-neutral.webp` | Pending review | Moral mirror tone |
| `portrait-engineer-neutral.webp` | Pending review | Amber engine glow |
| `portrait-navigator-neutral.webp` | Pending review | Cyan chart glow |
| `portrait-scientist-neutral.webp` | Pending review | Civilian-military mix |

---

## Room plates (1080×2340)

| Check | Status | Notes |
|-------|--------|-------|
| Not too bright (HUD text legible with scrim 0.68–0.74) | **Review** | Test on `room/[roomId].tsx` |
| Not too busy in upper HUD band | **Review** | Top 40% should be darker |
| No people / creatures | **Review** | Empty compartments only |
| No readable text / screen UI | **Review** | Reject legible labels |
| Consistent with P0 background palette | **Review** | Same navy family |
| Correct dimensions 1080×2340 | **Pass** | |

### Per room

| File | RoomId | Ready | Review notes |
|------|--------|-------|--------------|
| `bg-room-bridge.webp` | `command_center` | Pending review | Cyan console glow |
| `bg-room-engine.webp` | `engineering` | Pending review | Amber heat |
| `bg-room-lab.webp` | `research_lab` | Pending review | Largest file — watch bundle |
| `bg-room-cargo.webp` | `cargo_recovery` | Pending review | Tungsten work light |

---

## Command tile icons (SVG 24×24)

| Check | Status | Notes |
|-------|--------|-------|
| Readable at 24px on `CommandTile` | **Review** | Test cyan + amber tints |
| Single-weight stencil (no gradients) | **Pass** | Stroke-only SVG |
| Works with `currentColor` tint | **Pass** | |
| Distinct silhouettes at mobile size | **Review** | Compare dock vs inventory |
| Paths match production pack tile set | **Pass** | 6/6 files present |

---

## Classification stamps (512×256)

| Check | Status | Notes |
|-------|--------|-------|
| Text readable (not AI-garbled) | **Pass** | Programmatic SVG source |
| Distressed military document feel | **Review** | May refine SVG noise in B.5 |
| Transparent background | **Pass** | WebP alpha export |
| Correct dimensions | **Pass** | 512×256 |
| Color intent: classified=red/amber, cleared=bone, lost=red | **Pass** | |

---

## Path alignment vs production pack

| B.4 filename | Production pack §2 name | Integration alias |
|--------------|-------------------------|-------------------|
| `portrait-*-neutral.webp` | `portrait-*.webp` | Map in `constants/assets.ts` B.5 |
| `bg-room-*.webp` | `room-*.webp` | Map by `RoomId` |
| `assets/icons/command/*.svg` | `assets/icons/command-tiles/icon-tile-*.png` | SVG preferred over PNG |
| `stamp-classified.webp` | `stamp-restricted.png` | Semantic rename |
| `stamp-cleared.webp` | *(new)* | Debrief cleared state |
| `stamp-vessel-lost.webp` | *(new)* | Catastrophic result |

---

## Reject / regenerate triggers

- Legible words anywhere except stamp assets
- Human faces that read as celebrity likeness
- Room or portrait brighter than P0 briefing background without scrim
- Icon strokes collapse at 24px
- Style outlier vs rest of batch — **regenerate full batch together**

---

## Sign-off (manual)

- [ ] Art lead approves portrait batch
- [ ] Art lead approves room batch
- [ ] UI lead confirms icon readability on base grid
- [ ] Ready for Phase B.5 integration PR
