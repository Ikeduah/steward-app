// Next.js server-side registration hook. Loads the runtime-appropriate Sentry
// config, and wires unhandled server request errors into Sentry.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture all unhandled server-side request errors (requires @sentry/nextjs >= 8.28.0).
export const onRequestError = Sentry.captureRequestError;
