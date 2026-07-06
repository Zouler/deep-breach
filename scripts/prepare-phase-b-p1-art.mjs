/**
 * Visual Phase B.4 — convert P1 portrait/room sources and export stamp SVGs.
 * Run: npm install sharp --no-save && node scripts/prepare-phase-b-p1-art.mjs
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SOURCE_DIR =
  process.env.P1_SOURCE_DIR ??
  join(process.env.USERPROFILE ?? '', '.cursor/projects/c-Users-usuario-Proyectos-deep-breach/assets');

const PORTRAIT_W = 768;
const PORTRAIT_H = 768;
const ROOM_W = 1080;
const ROOM_H = 2340;
const BG = { r: 3, g: 7, b: 18 };

const PORTRAITS = [
  { source: 'portrait-roberts-source.png', output: 'portrait-roberts-neutral.webp' },
  { source: 'portrait-xo-source.png', output: 'portrait-xo-neutral.webp' },
  { source: 'portrait-engineer-source.png', output: 'portrait-engineer-neutral.webp' },
  { source: 'portrait-navigator-source.png', output: 'portrait-navigator-neutral.webp' },
  { source: 'portrait-scientist-source.png', output: 'portrait-scientist-neutral.webp' },
];

const ROOMS = [
  { source: 'bg-room-bridge-source.png', output: 'bg-room-bridge.webp', topFraction: 0.1 },
  { source: 'bg-room-engine-source.png', output: 'bg-room-engine.webp', topFraction: 0.12 },
  { source: 'bg-room-lab-source.png', output: 'bg-room-lab.webp', topFraction: 0.1 },
  { source: 'bg-room-cargo-source.png', output: 'bg-room-cargo.webp', topFraction: 0.11 },
];

const STAMPS = [
  { svg: 'stamp-classified.svg', output: 'stamp-classified.webp' },
  { svg: 'stamp-cleared.svg', output: 'stamp-cleared.webp' },
  { svg: 'stamp-vessel-lost.svg', output: 'stamp-vessel-lost.webp' },
];

function roomVignetteSvg() {
  return Buffer.from(`<svg width="${ROOM_W}" height="${ROOM_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#030712" stop-opacity="0.6"/>
      <stop offset="24%" stop-color="#030712" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="#030712" stop-opacity="0"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#top)"/>
  <rect width="100%" height="100%" fill="url(#bottom)"/>
</svg>`);
}

async function exportPortrait({ source, output }) {
  const input = join(SOURCE_DIR, source);
  const outPath = join(ROOT, 'assets/images/portraits', output);
  await sharp(input)
    .resize(PORTRAIT_W, PORTRAIT_H, { fit: 'cover', position: 'centre', kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 85, effort: 6 })
    .toFile(outPath);
  const meta = await sharp(outPath).metadata();
  const { size } = await sharp(outPath).toBuffer().then((b) => ({ size: b.length }));
  return { outPath, width: meta.width, height: meta.height, size };
}

async function exportRoom({ source, output, topFraction }) {
  const input = join(SOURCE_DIR, source);
  const outPath = join(ROOT, 'assets/images/rooms', output);
  const resized = await sharp(input)
    .resize(ROOM_W, null, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();
  const { height: imgH } = await sharp(resized).metadata();
  const topOffset = Math.round(ROOM_H * topFraction);
  await sharp({
    create: { width: ROOM_W, height: ROOM_H, channels: 3, background: BG },
  })
    .composite([
      { input: resized, top: topOffset, left: 0 },
      { input: roomVignetteSvg(), top: 0, left: 0 },
    ])
    .webp({ quality: 85, effort: 6 })
    .toFile(outPath);
  const meta = await sharp(outPath).metadata();
  const { size } = await sharp(outPath).toBuffer().then((b) => ({ size: b.length }));
  return { outPath, width: meta.width, height: meta.height, size };
}

async function exportStamp({ svg, output }) {
  const svgPath = join(ROOT, 'assets/stamps', svg);
  const outPath = join(ROOT, 'assets/stamps', output);
  const svgBuf = await readFile(svgPath);
  await sharp(svgBuf, { density: 144 })
    .resize(512, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 6, alphaQuality: 90 })
    .toFile(outPath);
  const meta = await sharp(outPath).metadata();
  const { size } = await sharp(outPath).toBuffer().then((b) => ({ size: b.length }));
  return { outPath, width: meta.width, height: meta.height, size };
}

async function main() {
  await mkdir(join(ROOT, 'assets/images/portraits'), { recursive: true });
  await mkdir(join(ROOT, 'assets/images/rooms'), { recursive: true });
  await mkdir(join(ROOT, 'assets/icons/command'), { recursive: true });
  await mkdir(join(ROOT, 'assets/stamps'), { recursive: true });

  const results = {
    portraits: [],
    rooms: [],
    stamps: [],
  };
  for (const p of PORTRAITS) results.portraits.push(await exportPortrait(p));
  for (const r of ROOMS) results.rooms.push(await exportRoom(r));
  for (const s of STAMPS) results.stamps.push(await exportStamp(s));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
