// Sentry Node.js server runtime init (loaded by instrumentation.ts).
// DSN comes from the server-only env var (unset => Sentry disabled).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // No `dataCollection` block: keeps sendDefaultPii=false (no user info / HTTP bodies).
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to server-side stack frames.
  includeLocalVariables: true,

  enableLogs: true,
});
