// Sentry browser/client runtime init.
// Runs in the browser; DSN comes from the public env var (unset => Sentry disabled).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // No `dataCollection` block on purpose: when omitted the SDK falls back to
  // sendDefaultPii=false, so user info / HTTP bodies are not sent. This is a
  // multi-tenant app, so we keep PII off.

  // 100% traces in dev for visibility, 10% in production to limit cost/overhead.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Forward application logs to Sentry (matches the backend's enable_logs).
  enableLogs: true,

  // Session Replay intentionally disabled (no replayIntegration / sample rates).
});

// Note: `onRouterTransitionStart` (App Router only) is intentionally not exported —
// this is a Pages Router app, where pageload/navigation spans are auto-instrumented.
