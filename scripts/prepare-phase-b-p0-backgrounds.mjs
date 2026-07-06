/**
 * Visual Phase B.2 — convert generated background sources to portrait WebP.
 * Run: npx --yes -p sharp node scripts/prepare-phase-b-p0-backgrounds.mjs
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TARGET_W = 1080;
const TARGET_H = 2340;
const BG = { r: 3, g: 7, b: 18 };

const SOURCE_DIR =
  process.env.BG_SOURCE_DIR ??
  join(process.env.USERPROFILE ?? '', '.cursor/projects/c-Users-usuario-Proyectos-deep-breach/assets');

const OUTPUT_DIR = join(ROOT, 'assets/images/backgrounds');

const BACKGROUNDS = [
  {
    source: 'bg-command-hub-source.png',
    output: 'bg-command-hub.webp',
    /** Favor upper framing — plotting table visible, bottom dark for tiles */
    topFraction: 0.12,
  },
  {
    source: 'bg-briefing-room-source.png',
    output: 'bg-briefing-room.webp',
    topFraction: 0.1,
  },
  {
    source: 'bg-captains-log-source.png',
    output: 'bg-captains-log.webp',
    topFraction: 0.14,
  },
];

function vignetteSvg() {
  return Buffer.from(`<svg width="${TARGET_W}" height="${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#030712" stop-opacity="0.55"/>
      <stop offset="22%" stop-color="#030712" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="58%" stop-color="#030712" stop-opacity="0"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#top)"/>
  <rect width="100%" height="100%" fill="url(#bottom)"/>
</svg>`);
}

async function processBackground({ source, output, topFraction }) {
  const inputPath = join(SOURCE_DIR, source);
  const outputPath = join(OUTPUT_DIR, output);

  const resized = await sharp(inputPath)
    .resize(TARGET_W, null, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();
  const { height: imgH } = await sharp(resized).metadata();

  const topOffset = Math.round(TARGET_H * topFraction);
  const composites = [{ input: resized, top: topOffset, left: 0 }];

  if (imgH + topOffset < TARGET_H) {
    // Extra bottom fill is already BG via canvas; vignette handles UI scrim
  }

  await sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 3,
      background: BG,
    },
  })
    .composite([
      ...composites,
      { input: vignetteSvg(), top: 0, left: 0 },
    ])
    .webp({ quality: 85, effort: 6 })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  return {
    output: outputPath,
    source: inputPath,
    width: meta.width,
    height: meta.height,
    size: (await sharp(outputPath).toBuffer()).length,
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const results = [];
  for (const bg of BACKGROUNDS) {
    results.push(await processBackground(bg));
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
