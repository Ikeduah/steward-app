/**
 * One-off, run-once: migrate legacy base64 `data:` image_url rows to Vercel Blob.
 *
 * Before this branch, asset images were stored as base64 data URLs inside the
 * `image_url` column. This script finds those rows, uploads the decoded binary
 * to Vercel Blob, and rewrites the column to the public Blob URL.
 *
 * Idempotent: it only touches rows whose image_url starts with `data:`, so
 * re-running after a successful pass is a no-op. Run against STAGING first.
 *
 * Requirements:
 *   - BLOB_READ_WRITE_TOKEN  (Vercel Blob store token)
 *   - DATABASE_URL           (same connection string the app uses; the
 *                             SQLAlchemy `+psycopg` suffix is stripped here)
 *   - the `pg` driver, installed just for this run:  npm i -D pg
 *
 * Usage (from steward/):
 *   BLOB_READ_WRITE_TOKEN=... DATABASE_URL=... node scripts/backfill-blob.mjs
 * or with an env file:
 *   node --env-file=api/.env --env-file=.env.local scripts/backfill-blob.mjs
 */
import { put } from "@vercel/blob";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("✗ BLOB_READ_WRITE_TOKEN is not set.");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("✗ DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set.");
  process.exit(1);
}

// SQLAlchemy uses e.g. `postgresql+psycopg://…`; node-postgres wants `postgres://…`.
const pgUrl = DATABASE_URL.replace(/^postgresql\+\w+:\/\//, "postgresql://");

const EXT_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

let Client;
try {
  ({ Client } = await import("pg"));
} catch {
  console.error("✗ The 'pg' driver is not installed. Run: npm i -D pg");
  process.exit(1);
}

const client = new Client({ connectionString: pgUrl });
await client.connect();

let migrated = 0;
let skipped = 0;
try {
  const { rows } = await client.query(
    "SELECT id, image_url FROM assets WHERE image_url LIKE 'data:%'"
  );
  console.log(`Found ${rows.length} base64 row(s) to migrate.`);

  for (const row of rows) {
    const match = /^data:([^;]+);base64,(.*)$/s.exec(row.image_url);
    if (!match) {
      console.warn(`  · asset ${row.id}: not a base64 data URL — skipping`);
      skipped++;
      continue;
    }
    const [, mime, b64] = match;
    const ext = EXT_BY_MIME[mime] || "bin";
    const buffer = Buffer.from(b64, "base64");

    const blob = await put(`assets/backfill-${row.id}.${ext}`, buffer, {
      access: "public",
      contentType: mime,
      addRandomSuffix: true,
    });

    await client.query("UPDATE assets SET image_url = $1 WHERE id = $2", [
      blob.url,
      row.id,
    ]);
    migrated++;
    console.log(`  ✓ asset ${row.id} → ${blob.url}`);
  }
} finally {
  await client.end();
}

console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}.`);
