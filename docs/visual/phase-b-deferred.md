# COLD HULL — Phase B deferred assets

Phase A is code-only using existing assets. The following remain for Phase B (art production).

## Known visual gaps (Phase A left unchanged)

| Issue | Current state | Phase B action |
|-------|---------------|----------------|
| Captain's Log background | Reuses `base-repair-dock-bg.png` | Dedicated log/document background |
| Most base screens | Flat `theme.bg` or repair dock bg | Command hub, briefing room backgrounds |
| Item icons | ~1254×1254 PNG (~1.5–2 MB each) | Export 256×256 WebP/PNG optimized set |
| Dive HUD chrome | `assets/ui/dive-hud/*.png` exist but unwired | Wire panels or replace with 9-slice |
| Expo icon/splash | Using `logo-deep-breach-icon.png` (may need resize) | Proper 1024×1024 icon, 1284×2778 splash |
| Room interiors | Text-only room detail | Per-room background plates |
| Command tiles | Text-only | Station icons / pictograms |

## Recommended Phase B MVP asset list (15)

From Fable audit scope — production art to ship next:

1. **Deep Breach wordmark** — transparent PNG for HUD headers  
2. **App icon** — 1024×1024 classified insignia  
3. **Splash plate** — full-bleed title with logo lockup  
4. **Command hub background** — base screen atmosphere  
5. **Captain's Log background** — document/archive texture  
6. **Briefing room background** — story assignment screens  
7. **Dive HUD frame** — main status panel 9-slice or composite  
8. **Gauge bezel** — instrument overlay for hull/O₂/water  
9. **Alert feed strip** — comms channel chrome  
10. **Command tile icons set** (6) — repair, trials, crew, upgrades, inventory, briefings  
11. **Optimized item icons** (8) — 256px scrap, research, patch, sealant, O₂, artifact, scan, crack  
12. **Engine room plate** — room detail background  
13. **Sonar room plate** — room detail background  
14. **Classification strip** — reusable RESTRICTED/DBX header overlay  
15. **Scanline/noise overlay** — subtle full-screen instrument texture  

## Dive HUD files (on disk, not bundled)

Files under `assets/ui/dive-hud/` are retained for Phase B wiring. They were removed from `constants/assets.ts` in Phase A to avoid bundling ~15 MB of unused PNGs.

## Item icon optimization note

Automated downscale was not run in Phase A (no image pipeline in repo). When producing Phase B icons, target **256×256 WebP** at ~80% quality; update `constants/assets.ts` imports to `@/assets/icons/opt/` paths.
