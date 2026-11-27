import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { isOrgAdmin, isOrgBlobUrl } from "../../../lib/blobAccess";

/**
 * Clerk-auth'd blob cleanup.
 *
 * Called from the frontend when a user removes/replaces an asset image and on
 * asset delete, so old blobs don't leak. The FastAPI backend has no Blob token,
 * so cleanup lives here in the Next layer. `del` reads BLOB_READ_WRITE_TOKEN
 * from the environment.
 *
 * Only org admins can delete, and only photos inside their own org's folder
 * (`orgs/<orgId>/`). Older photos uploaded before org folders existed are
 * refused rather than risk deleting another org's file; a leaked blob is
 * harmless, a cross-org delete is not.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, orgId, orgRole } = getAuth(req);
  if (!userId || !orgId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!isOrgAdmin(orgRole)) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  const url = (req.body as { url?: unknown } | undefined)?.url;
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "url is required" });
  }

  // Only ever delete real Blob URLs inside this org's own folder — never
  // arbitrary user-supplied targets or another org's photos.
  if (!isOrgBlobUrl(url, orgId)) {
    return res.status(403).json({ error: "Not a photo owned by this organization" });
  }

  try {
    await del(url);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[assets] blob delete failed:", err);
    return res.status(500).json({ error: "Failed to delete blob" });
  }
}
