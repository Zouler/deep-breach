/**
 * Visual Phase B.1 — P0 asset preparation (derived branding, scanline overlay, optimized item icons).
 * Run: npx --yes -p sharp node scripts/prepare-phase-b-p0-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BG = '#030712';

const PATHS = {
  iconMaster: join(ROOT, 'assets/branding/logo-deep-breach-icon.png'),
  logoMaster: join(ROOT, 'assets/images/logo-deep-breach.png'),
  brandingOut: join(ROOT, 'assets/branding'),
  overlaysOut: join(ROOT, 'assets/images/overlays'),
  itemsOptimizedOut: join(ROOT, 'assets/icons/items-optimized'),
  faviconOut: join(ROOT, 'assets/images/favicon.png'),
};

const ITEM_ICONS = [
  'icon-scrap',
  'icon-research-data',
  'icon-hull-patch-kit',
  'icon-pressure-sealant',
  'icon-oxygen-canister',
  'icon-artifact',
  'icon-scan-area',
  'icon-crack',
];

async function ensureDirs() {
  const dirs = [
    PATHS.brandingOut,
    PATHS.overlaysOut,
    join(ROOT, 'assets/images/backgrounds'),
    join(ROOT, 'assets/images/rooms'),
    join(ROOT, 'assets/images/portraits'),
    join(ROOT, 'assets/icons/items-optimized'),
    join(ROOT, 'assets/stamps'),
  ];
  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}

async function createExpoAppIcon() {
  const size = 1024;
  const inset = 0.12;
  const maxLogo = Math.round(size * (1 - inset * 2));
  const logo = await sharp(PATHS.iconMaster)
    .resize(maxLogo, maxLogo, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  const out = join(PATHS.brandingOut, 'expo-app-icon.png');
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function createExpoAdaptiveIcon() {
  const size = 1024;
  const safe = 0.66;
  const maxLogo = Math.round(size * safe);
  const logo = await sharp(PATHS.iconMaster)
    .resize(maxLogo, maxLogo, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);
  const out = join(PATHS.brandingOut, 'expo-adaptive-icon.png');
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function createExpoSplashPortrait() {
  const width = 1284;
  const height = 2778;
  const logoMaxWidth = Math.round(width * 0.62);
  const logo = await sharp(PATHS.logoMaster)
    .resize(logoMaxWidth, logoMaxWidth, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const left = Math.round((width - meta.width) / 2);
  const top = Math.round(height * 0.22 - meta.height / 2);
  const out = join(PATHS.brandingOut, 'expo-splash-portrait.png');
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function createFavicon() {
  const out = PATHS.faviconOut;
  await sharp(PATHS.iconMaster)
    .resize(64, 64, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

function createScanlineOverlayBuffer(width, height) {
  const channels = 4;
  const buffer = Buffer.alloc(width * height * channels);
  const rng = mulberry32(0xdbx07);

  for (let y = 0; y < height; y++) {
    const lineAlpha = y % 4 === 0 ? 10 + (y % 8 === 0 ? 4 : 0) : 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      let alpha = lineAlpha;
      const n = rng();
      if (n < 0.0015) alpha = Math.max(alpha, 6 + Math.floor(rng() * 10));
      if (n > 0.9992) alpha = Math.max(alpha, 4 + Math.floor(rng() * 6));
      buffer[i] = 176;
      buffer[i + 1] = 186;
      buffer[i + 2] = 192;
      buffer[i + 3] = alpha;
    }
  }
  return buffer;
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function createScanlineOverlay() {
  const width = 512;
  const height = 512;
  const out = join(PATHS.overlaysOut, 'overlay-scanline-noise.png');
  const buffer = createScanlineOverlayBuffer(width, height);
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  return out;
}

async function optimizeItemIcons() {
  const manifest = [];
  for (const name of ITEM_ICONS) {
    const src = join(ROOT, 'assets/icons', `${name}.png`);
    const out = join(PATHS.itemsOptimizedOut, `${name}.webp`);
    const srcMeta = await sharp(src).metadata();
    const srcStat = await sharp(src).stats();
    await sharp(src)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 80, alphaQuality: 80 })
      .toFile(out);
    const outMeta = await sharp(out).metadata();
    manifest.push({
      name: `${name}.webp`,
      source: `assets/icons/${name}.png`,
      sourceDimensions: `${srcMeta.width}x${srcMeta.height}`,
      outputDimensions: `${outMeta.width}x${outMeta.height}`,
      format: 'webp',
      quality: 80,
    });
    void srcStat;
  }
  const manifestPath = join(PATHS.itemsOptimizedOut, 'MANIFEST.json');
  await writeFile(manifestPath, `${JSON.stringify({ generated: new Date().toISOString(), icons: manifest }, null, 2)}\n`);
  return manifestPath;
}

async function main() {
  await ensureDirs();
  const results = {
    expoAppIcon: await createExpoAppIcon(),
    expoAdaptiveIcon: await createExpoAdaptiveIcon(),
    expoSplashPortrait: await createExpoSplashPortrait(),
    favicon: await createFavicon(),
    scanlineOverlay: await createScanlineOverlay(),
    manifest: await optimizeItemIcons(),
  };
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
