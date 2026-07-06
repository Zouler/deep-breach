# Visual Phase B — Asset Status

**Phase:** B.2 P0 Background Generation  
**Branch:** `feature/visual-phase-b-p0-backgrounds`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**Prompts & review:** [`phase-b-background-prompts.md`](./phase-b-background-prompts.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Created | Ready for integration | Deferred |
|----------|---------|----------------------|----------|
| Derived branding | 4 | 4 (wired in `app.json`) | wordmark P2 |
| Scanline overlay | 1 | 1 | — |
| Optimized item icons | 8 | 8 (not wired in code) | WebP re-export |
| Favicon | 1 | 1 (wired in `app.json`) | — |
| **P0 backgrounds** | **3** | **3 (not wired)** | — |
| Room plates | 0 | — | 4 P1 AI assets |
| Portraits | 0 | — | 5 P1 AI assets |
| Command tile icons | 0 | — | 6 P1 assets |
| Classification stamps | 0 | — | 3 P1 assets |

**B.1 regeneration:** `powershell -ExecutionPolicy Bypass -File scripts/prepare-phase-b-p0-assets.ps1`  
**B.2 conversion:** `node scripts/prepare-phase-b-p0-backgrounds.mjs` (requires local `sharp`)

---

## Assets Created

### A — Derived branding exports (B.1)

| Asset | Source | Output | Format | Dimensions | Size | Integration |
|-------|--------|--------|--------|------------|------|-------------|
| Expo app icon | `assets/branding/logo-deep-breach-icon.png` | `assets/branding/expo-app-icon.png` | PNG | 1024×1024 | 791 KB | **Ready** — `app.json` icon |
| Expo adaptive icon | same | `assets/branding/expo-adaptive-icon.png` | PNG | 1024×1024 | 613 KB | **Ready** — `app.json` adaptive foreground |
| Expo splash portrait | `assets/images/logo-deep-breach.png` | `assets/branding/expo-splash-portrait.png` | PNG | 1284×2778 | 559 KB | **Ready** — `app.json` splash |
| Favicon | `assets/branding/logo-deep-breach-icon.png` | `assets/images/favicon.png` | PNG | 64×64 | 7 KB | **Ready** — `app.json` web favicon |

### B — Scanline / noise overlay (B.1)

| Asset | Source | Output | Format | Dimensions | Size | Integration |
|-------|--------|--------|--------|------------|------|-------------|
| Instrument scanline overlay | Procedural | `assets/images/overlays/overlay-scanline-noise.png` | PNG | 512×512 tile | 5 KB | **Ready** — not wired |

### C — P0 backgrounds (B.2)

| Asset | Source | Output | Format | Dimensions | Size | Integration |
|-------|--------|--------|--------|------------|------|-------------|
| Command hub | AI source → portrait conversion | `assets/images/backgrounds/bg-command-hub.webp` | WebP q85 | 1080×2340 | 55 KB | **Ready** — `base.tsx` (later) |
| Briefing room | AI source → portrait conversion | `assets/images/backgrounds/bg-briefing-room.webp` | WebP q85 | 1080×2340 | 40 KB | **Ready** — briefing flows (later) |
| Captain's Log | AI source → portrait conversion | `assets/images/backgrounds/bg-captains-log.webp` | WebP q85 | 1080×2340 | 54 KB | **Ready** — `captains-log.tsx` (later) |

**Processing:** Landscape AI sources letterboxed on `#030712` with top/bottom UI vignette. See `scripts/prepare-phase-b-p0-backgrounds.mjs`. All review checks passed — details in [`phase-b-background-prompts.md`](./phase-b-background-prompts.md).

### H — Optimized item icons (B.1)

Output folder: `assets/icons/items-optimized/`  
Manifest: `assets/icons/items-optimized/MANIFEST.json`

| Icon | Source size | Optimized size | Dimensions | Ready |
|------|-------------|----------------|------------|-------|
| `icon-scrap.png` | 1.94 MB | 133 KB | 256×256 | Yes (not wired) |
| `icon-research-data.png` | 1.64 MB | 137 KB | 256×256 | Yes |
| `icon-hull-patch-kit.png` | 2.03 MB | 142 KB | 256×256 | Yes |
| `icon-pressure-sealant.png` | 1.44 MB | 105 KB | 256×256 | Yes |
| `icon-oxygen-canister.png` | 1.38 MB | 107 KB | 256×256 | Yes |
| `icon-artifact.png` | 1.76 MB | 124 KB | 256×256 | Yes |
| `icon-scan-area.png` | 1.23 MB | 105 KB | 256×256 | Yes |
| `icon-crack.png` | 1.86 MB | 121 KB | 256×256 | Yes |

**Original masters** in `assets/icons/icon-*.png` are **unchanged**.

---

## Folder Structure

| Path | Status |
|------|--------|
| `assets/branding/` | Expo exports + logo masters |
| `assets/images/backgrounds/` | **3 P0 WebP backgrounds** |
| `assets/images/rooms/` | Empty (`.gitkeep`) |
| `assets/images/portraits/` | Empty (`.gitkeep`) |
| `assets/images/overlays/` | Scanline overlay |
| `assets/icons/items-optimized/` | 8 icons + manifest |
| `assets/stamps/` | Empty (`.gitkeep`) |

---

## Assets Deferred

| Priority | Asset | Reason |
|----------|-------|--------|
| P1 | Room plates ×4 | AI art — §5.4–5.7 |
| P1 | Portraits ×5 | AI art — §5.8–5.12 |
| P1 | Command tile icons ×6 | Glyph design |
| P1 | Classification stamps ×3 | Intentional text stamps |
| P2 | Wordmark, sonar room, gauge bezel, extra portraits | Per production pack |

---

## Integration Status

| Change | Status |
|--------|--------|
| `app.json` → expo branding paths | Done (B.1) |
| P0 backgrounds on screens | **Deferred** — integration PR |
| `constants/assets.ts` → backgrounds/icons/overlays | Deferred |
| Gameplay | **Unchanged** |

---

## Next Steps

1. **Phase B integration PR:** Wire backgrounds, scanline overlay, optimized icons per production pack §8.
2. **P1 art pass:** Portraits + room plates + command tile icons + stamps.
3. **Device QA:** Verify text legibility on all three backgrounds with `PanelCard` scrim on target phones.
