# Visual Phase B — Asset Status

**Phase:** B.1 P0 Asset Preparation  
**Branch:** `feature/visual-phase-b-p0-assets`  
**Spec:** [`phase-b-asset-production-pack.md`](./phase-b-asset-production-pack.md)  
**Last updated:** 2026-07-06  

---

## Summary

| Category | Created | Ready for integration | Deferred |
|----------|---------|----------------------|----------|
| Derived branding | 4 | 4 (wired in `app.json`) | wordmark P2 |
| Scanline overlay | 1 | 1 | — |
| Optimized item icons | 8 | 8 (not wired in code) | WebP re-export |
| Favicon | 1 | 1 (wired in `app.json`) | — |
| Backgrounds | 0 | — | 3 P0 AI assets |
| Room plates | 0 | — | 4 P1 AI assets |
| Portraits | 0 | — | 5 P1 AI assets |
| Command tile icons | 0 | — | 6 P1 assets |
| Classification stamps | 0 | — | 3 P1 assets |

**Regeneration:** `powershell -ExecutionPolicy Bypass -File scripts/prepare-phase-b-p0-assets.ps1`  
**Optional WebP pass:** `npx --yes -p sharp node scripts/prepare-phase-b-p0-assets.mjs` (requires network; not run in B.1)

---

## Assets Created

### A — Derived branding exports

| Asset | Source | Output | Format | Dimensions | Size | Integration |
|-------|--------|--------|--------|------------|------|-------------|
| Expo app icon | `assets/branding/logo-deep-breach-icon.png` | `assets/branding/expo-app-icon.png` | PNG | 1024×1024 | 791 KB | **Ready** — `app.json` icon |
| Expo adaptive icon | same | `assets/branding/expo-adaptive-icon.png` | PNG | 1024×1024 | 613 KB | **Ready** — `app.json` adaptive foreground |
| Expo splash portrait | `assets/images/logo-deep-breach.png` | `assets/branding/expo-splash-portrait.png` | PNG | 1284×2778 | 559 KB | **Ready** — `app.json` splash |
| Favicon | `assets/branding/logo-deep-breach-icon.png` | `assets/images/favicon.png` | PNG | 64×64 | 7 KB | **Ready** — `app.json` web favicon |

**Notes:** 12% safe margin on app icon; 66% safe zone on adaptive foreground; splash logo centered at upper ~22% on `#030712` field. Original logo masters untouched.

### B — Scanline / noise overlay

| Asset | Source | Output | Format | Dimensions | Size | Integration |
|-------|--------|--------|--------|------------|------|-------------|
| Instrument scanline overlay | Procedural (seeded RNG) | `assets/images/overlays/overlay-scanline-noise.png` | PNG | 512×512 tile | 5 KB | **Ready** — tile in `ScreenShell` (Phase B integration) |

**Notes:** Horizontal scanlines every 4px; sparse monochrome noise; alpha ~4–6%. Seamless tile. Procedural — no external art review required.

### H — Optimized item icons

Output folder: `assets/icons/items-optimized/`  
Manifest: `assets/icons/items-optimized/MANIFEST.json`

| Icon | Source size | Optimized size | Reduction | Dimensions | Ready |
|------|-------------|----------------|-----------|------------|-------|
| `icon-scrap.png` | 1.94 MB | 133 KB | −93% | 256×256 | Yes (not wired) |
| `icon-research-data.png` | 1.64 MB | 137 KB | −92% | 256×256 | Yes |
| `icon-hull-patch-kit.png` | 2.03 MB | 142 KB | −93% | 256×256 | Yes |
| `icon-pressure-sealant.png` | 1.44 MB | 105 KB | −93% | 256×256 | Yes |
| `icon-oxygen-canister.png` | 1.38 MB | 107 KB | −92% | 256×256 | Yes |
| `icon-artifact.png` | 1.76 MB | 124 KB | −93% | 256×256 | Yes |
| `icon-scan-area.png` | 1.23 MB | 105 KB | −91% | 256×256 | Yes |
| `icon-crack.png` | 1.86 MB | 121 KB | −94% | 256×256 | Yes |

**Total source icons:** ~14.3 MB → **~1.0 MB** optimized PNG set (−93%).  
**Format note:** Production pack targets WebP q80 (≤40 KB each). PNG used in B.1 because no local WebP encoder without `sharp`. Re-export recommended before integration PR.

**Original masters** in `assets/icons/icon-*.png` are **unchanged**.

---

## Folder Structure

| Path | Status |
|------|--------|
| `assets/branding/` | Contains expo exports + existing logo masters |
| `assets/images/backgrounds/` | Created (empty — `.gitkeep`) |
| `assets/images/rooms/` | Created (empty — `.gitkeep`) |
| `assets/images/portraits/` | Created (empty — `.gitkeep`) |
| `assets/images/overlays/` | Contains `overlay-scanline-noise.png` |
| `assets/icons/items-optimized/` | Contains 8 icons + `MANIFEST.json` |
| `assets/stamps/` | Created (empty — `.gitkeep`) |

---

## Assets Deferred (external generation / art review)

| Priority | Asset | Filename | Reason |
|----------|-------|----------|--------|
| P0 | Command hub background | `bg-command-hub.webp` | AI art — §5.1 prompt |
| P0 | Briefing room background | `bg-briefing-room.webp` | AI art — §5.2 |
| P0 | Captain's Log background | `bg-captains-log.webp` | AI art — §5.3 |
| P1 | Room plates ×4 | `room-*.webp` | AI art — §5.4–5.7 |
| P1 | Portraits ×5 | `portrait-*.webp` | AI art — §5.8–5.12 |
| P1 | Command tile icons ×6 | `icon-tile-*.png` | Glyph design / AI |
| P1 | Classification stamps ×3 | `stamp-*.png` | Intentional text stamps |
| P2 | Wordmark export | `logo-deep-breach-wordmark.png` | Derived trim — optional |
| P2 | Sonar room, gauge bezel, extra portraits | various | Per production pack §2 |

---

## Integration Status

| Change | Status |
|--------|--------|
| `app.json` → expo branding paths | **Done** (B.1) |
| `constants/assets.ts` → optimized icons | Deferred — integration PR |
| Background / portrait / overlay wiring | Deferred — integration PR |
| Gameplay | **Unchanged** |

---

## Next Steps

1. **Generate P0 backgrounds** (`bg-command-hub`, `bg-briefing-room`, `bg-captains-log`) using §5 prompts — external AI session with art review.
2. **Optional:** Re-run item icons as WebP via `sharp` script before integration.
3. **Phase B integration PR:** Wire assets per production pack §8.
