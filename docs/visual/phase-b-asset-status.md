# Visual Phase B — Asset Status

**Phase:** B.4 P1 Art Preparation  
**Branch:** `feature/visual-phase-b-p1-art-pack`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**P1 prompts:** [`phase-b-p1-art-prompts.md`](./phase-b-p1-art-prompts.md)  
**P1 review:** [`phase-b-p1-art-review.md`](./phase-b-p1-art-review.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Created (B.4) | Integrated | Ready for integration |
|----------|---------------|------------|----------------------|
| P0 backgrounds | 3 | Yes (B.3) | — |
| Scanline overlay | 1 | Yes (B.3) | — |
| Optimized item icons | 8 | Yes (B.3) | — |
| **Portraits** | **5** | No | **Pending art review** |
| **Room plates** | **4** | No | **Pending art review** |
| **Command tile icons** | **6 SVG** | No | **Yes** (SVG — review tint on device) |
| **Classification stamps** | **3 WebP + 3 SVG source** | No | **Yes** (programmatic text) |
| P2 extras | — | — | sonar room, wordmark, dive HUD, etc. |

**Regeneration:** `npm install sharp --no-save && node scripts/prepare-phase-b-p1-art.mjs`

---

## P0 Integration (B.3 — unchanged)

See prior sections in git history. Backgrounds, overlay, and optimized icons remain wired per B.3 map.

---

## P1 Assets Created (B.4)

### Portraits — `assets/images/portraits/`

| File | Source method | Dimensions | Size | Ready |
|------|---------------|------------|------|-------|
| `portrait-roberts-neutral.webp` | AI source → sharp crop | 768×768 | 51 KB | Pending review |
| `portrait-xo-neutral.webp` | AI source → sharp crop | 768×768 | 36 KB | Pending review |
| `portrait-engineer-neutral.webp` | AI source → sharp crop | 768×768 | 65 KB | Pending review |
| `portrait-navigator-neutral.webp` | AI source → sharp crop | 768×768 | 49 KB | Pending review |
| `portrait-scientist-neutral.webp` | AI source → sharp crop | 768×768 | 42 KB | Pending review |

### Room plates — `assets/images/rooms/`

| File | Source method | Dimensions | Size | Ready |
|------|---------------|------------|------|-------|
| `bg-room-bridge.webp` | AI source → letterbox + vignette | 1080×2340 | 49 KB | Pending review |
| `bg-room-engine.webp` | AI source → letterbox + vignette | 1080×2340 | 53 KB | Pending review |
| `bg-room-lab.webp` | AI source → letterbox + vignette | 1080×2340 | 89 KB | Pending review |
| `bg-room-cargo.webp` | AI source → letterbox + vignette | 1080×2340 | 56 KB | Pending review |

### Command tile icons — `assets/icons/command/`

| File | Source method | ViewBox | Size | Ready |
|------|---------------|---------|------|-------|
| `icon-dock.svg` | Hand-authored SVG | 24×24 | 363 B | Yes |
| `icon-missions.svg` | Hand-authored SVG | 24×24 | 391 B | Yes |
| `icon-crew.svg` | Hand-authored SVG | 24×24 | 355 B | Yes |
| `icon-inventory.svg` | Hand-authored SVG | 24×24 | 301 B | Yes |
| `icon-upgrades.svg` | Hand-authored SVG | 24×24 | 337 B | Yes |
| `icon-log.svg` | Hand-authored SVG | 24×24 | 289 B | Yes |

### Classification stamps — `assets/stamps/`

| File | Source method | Dimensions | Size | Ready |
|------|---------------|------------|------|-------|
| `stamp-classified.webp` | SVG → sharp export | 512×256 | 12 KB | Yes |
| `stamp-cleared.webp` | SVG → sharp export | 512×256 | 8 KB | Yes |
| `stamp-vessel-lost.webp` | SVG → sharp export | 512×256 | 10 KB | Yes |
| `stamp-*.svg` | Programmatic (source masters) | 512×256 | <1 KB each | Yes — editable source |

---

## Deferred / Not in B.4

| Asset | Reason |
|-------|--------|
| Sensor / Logistics portraits | P2 per production pack |
| Sonar room plate | P2 |
| Production-pack PNG tile icons | Superseded by SVG command set |
| `stamp-restricted` / `stamp-dbx-program` / `stamp-phos-restricted` names | B.4 uses classified/cleared/vessel-lost semantic set — map at integration |

---

## Next Steps

1. **Manual art review** — [`phase-b-p1-art-review.md`](./phase-b-p1-art-review.md)
2. **Phase B.5 integration PR** — wire portraits, room plates, command SVGs, stamps per prompts doc §Integration notes
3. **Device QA** — face at 64px, rooms behind room HUD, icons on base grid
