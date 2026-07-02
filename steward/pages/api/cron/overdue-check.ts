import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "crypto";

const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** Constant-time string comparison that is safe against length leaks. */
function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!CRON_SECRET || !token || !secretsMatch(token, CRON_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/internal/overdue-check`, {
      method: "POST",
      headers: {
        "x-cron-secret": CRON_SECRET,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Backend error", detail: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[cron] overdue-check failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
