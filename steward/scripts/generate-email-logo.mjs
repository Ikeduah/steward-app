/**
 * One-off: rasterize the white mono lockup to a transparent PNG for emails.
 *
 * Emails can't use SVG (Gmail/Outlook strip it), so we ship a committed PNG.
 * The source lockup is "mono white on ink" — it carries a full-canvas ink
 * background rect meant for dark surfaces. We strip that rect so the PNG is
 * transparent and sits cleanly on the emerald header bar.
 *
 * Run from steward/:  node scripts/generate-email-logo.mjs
 * The output PNG is committed, so this only needs re-running if the logo changes.
 *
 * Primary tool: sharp (already present via Next). If sharp can't rasterize SVG
 * on this machine, fall back to the repo's Playwright + a screenshot.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../public/email/steward-logo.svg");
const OUT = resolve(__dirname, "../public/email/steward-logo@2x.png");

// Export at 2× the 420×120 artboard → 840×240.
const WIDTH = 840;
const HEIGHT = 240;

// Strip the full-canvas ink background rect so the raster is transparent.
const svg = readFileSync(SRC, "utf8").replace(
  /<rect\s+width="420"\s+height="120"\s+fill="#06140E"\s*><\/rect>/,
  ""
);

async function withSharp() {
  const sharp = (await import("sharp")).default;
  await sharp(Buffer.from(svg), { density: 288 })
    .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(OUT);
}

async function withPlaywright() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.setViewportSize({ width: 420, height: 120 });
  await page.setContent(
    `<body style="margin:0;background:transparent;">${svg}</body>`,
    { waitUntil: "networkidle" }
  );
  const el = await page.$("svg");
  await el.screenshot({ path: OUT, omitBackground: true });
  await browser.close();
}

try {
  await withSharp();
  console.log(`✓ wrote ${OUT} via sharp (${WIDTH}×${HEIGHT}, transparent)`);
} catch (err) {
  console.warn(`sharp failed (${err.message}); falling back to Playwright…`);
  await withPlaywright();
  console.log(`✓ wrote ${OUT} via Playwright`);
}
