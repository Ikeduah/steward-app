// Sentry Edge runtime init (loaded by instrumentation.ts for middleware / edge routes).
// DSN comes from the server-only env var (unset => Sentry disabled).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // No `dataCollection` block: keeps sendDefaultPii=false (no user info / HTTP bodies).
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,
});
