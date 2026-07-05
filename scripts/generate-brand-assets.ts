/**
 * Genera favicon, OG image y marcas UI desde public/images/logo.png
 * Ejecutar: npx tsx scripts/generate-brand-assets.ts
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public", "images");
const APP_DIR = path.join(process.cwd(), "src", "app");
const LOGO = path.join(ROOT, "logo.png");

const BRAND_CREAM = "#f5efe6";

async function ensureDirs() {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.mkdir(APP_DIR, { recursive: true });
}

/** Logo recortado, sin fondos extra (solo el PNG original). */
async function logoAtHeight(height: number) {
  return sharp(LOGO)
    .trim({ threshold: 12 })
    .resize({ height, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
}

async function writeLogoMarks() {
  const variants = [
    { name: "logo-mark-xs.png", height: 22 },
    { name: "logo-mark-sm.png", height: 28 },
    { name: "logo-mark-md.png", height: 34 },
    { name: "logo-mark-lg.png", height: 42 },
    { name: "logo-mark.png", height: 64 },
  ] as const;

  for (const { name, height } of variants) {
    const buf = await logoAtHeight(height);
    await fs.writeFile(path.join(ROOT, name), buf);
    console.log(`  ✓ ${name}`);
  }
}

async function writeIconVariants() {
  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "app-icon-192.png", size: 192 },
    { name: "app-icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ] as const;

  for (const { name, size } of sizes) {
    const buf = await sharp(LOGO)
      .trim({ threshold: 12 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await fs.writeFile(path.join(ROOT, name), buf);
    console.log(`  ✓ ${name}`);
  }

  const favicon32 = await fs.readFile(path.join(ROOT, "favicon-32x32.png"));
  await fs.writeFile(path.join(APP_DIR, "icon.png"), favicon32);
  const apple = await fs.readFile(path.join(ROOT, "apple-touch-icon.png"));
  await fs.writeFile(path.join(APP_DIR, "apple-icon.png"), apple);
  await fs.writeFile(path.join(process.cwd(), "public", "favicon.ico"), favicon32);
  console.log("  ✓ src/app/icon.png, apple-icon.png, public/favicon.ico");
}

async function writeOgImage() {
  const width = 1200;
  const height = 630;
  const logo = await logoAtHeight(220);

  const logoMeta = await sharp(logo).metadata();
  const lw = logoMeta.width ?? 220;
  const lh = logoMeta.height ?? 220;

  const bgSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND_CREAM}"/>
        <stop offset="45%" stop-color="#fffaf5"/>
        <stop offset="100%" stop-color="#f3ebe3"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <text x="520" y="300" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#402a14">Eventia</text>
    <text x="520" y="370" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#6b4a2e">Plataforma de gestión de eventos</text>
  </svg>`;

  const og = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logo,
        left: 120,
        top: Math.round((height - lh) / 2),
      },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(ROOT, "og-image.png"), og);
  await fs.writeFile(path.join(APP_DIR, "opengraph-image.png"), og);
  console.log("  ✓ og-image.png, src/app/opengraph-image.png");
}

async function main() {
  await ensureDirs();
  const stat = await fs.stat(LOGO).catch(() => null);
  if (!stat) {
    console.error("No se encontró public/images/logo.png");
    process.exit(1);
  }

  console.log("Generando assets de marca desde logo.png...");
  await writeLogoMarks();
  await writeIconVariants();
  await writeOgImage();

  // Legacy tile con fondo naranja — ya no se usa en UI
  const legacyTile = path.join(ROOT, "logo-tile.png");
  await fs.unlink(legacyTile).catch(() => undefined);

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
