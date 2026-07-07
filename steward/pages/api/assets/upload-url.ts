import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

/**
 * Client-upload token endpoint for asset images.
 *
 * The browser PUTs the file straight to Vercel Blob using a short-lived token
 * minted here — this bypasses the 4.5 MB Vercel serverless body limit. We only
 * ever hold the returned public URL in the asset's `image_url` column.
 *
 * Blobs are public-read by default, which is acceptable for asset photos.
 * Auth, content-type and size are all enforced in `onBeforeGenerateToken`.
 */
const ALLOWED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async () => {
        // Reuse the app's Clerk server auth — same as other pages/api routes.
        const { userId, orgId } = getAuth(req);
        if (!userId || !orgId) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Called by Vercel via webhook after the browser finishes uploading.
      // Does not run against localhost (no public callback URL) — that's fine.
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return res.status(status).json({ error: message });
  }
}
