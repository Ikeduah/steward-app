import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

/**
 * Clerk-auth'd blob cleanup.
 *
 * Called from the frontend when a user removes/replaces an asset image and on
 * asset delete, so old blobs don't leak. The FastAPI backend has no Blob token,
 * so cleanup lives here in the Next layer. `del` reads BLOB_READ_WRITE_TOKEN
 * from the environment.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, orgId } = getAuth(req);
  if (!userId || !orgId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = (req.body as { url?: unknown } | undefined)?.url;
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "url is required" });
  }

  // Only ever delete real Blob URLs — never arbitrary user-supplied targets
  // (e.g. leftover base64 data: URLs from before the migration).
  if (!url.includes(".blob.vercel-storage.com/")) {
    return res.status(400).json({ error: "Not a Vercel Blob URL" });
  }

  try {
    await del(url);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[assets] blob delete failed:", err);
    return res.status(500).json({ error: "Failed to delete blob" });
  }
}
