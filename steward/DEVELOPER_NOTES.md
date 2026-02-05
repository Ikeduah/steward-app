# Developer Notes & Troubleshooting Guide

This document contains critical technical details, gotchas, and configuration info for future engineers and support staff working on the Steward application.

## Authentication (Clerk)

### JWT Token Structure & Roles
The application uses Clerk for authentication. We encountered specific behaviors regarding how Organization roles are passed in the JWT claims that differ from some documentation.

**Critical Finding:**
When using Clerk's "minified" claims (which is common in production/dev tokens), the Organization claim (`o`) uses the key `rol` for the role, **NOT** `r` as might be expected from some abbreviated formats.

**Token Structure Example:**
```json
{
  "o": {
    "id": "org_...",
    "rol": "admin",      <-- "rol" is the key, NOT "r"
    "slg": "org-slug"
  },
  "org_role": "org:admin" // detailed claim (may or may not be present)
}
```

**Role Checking Logic:**
In `api/app/routers/assets.py` (and other secured endpoints), the `require_admin` dependency checks for admin privileges using multiple paths to ensure robustness:
1.  `claims.get("org_role")` -> Expects `"org:admin"`
2.  `claims["o"].get("rol")` -> Expects `"admin"` 

**Valid Admin Roles:**
The application accepts both `"org:admin"` and `"admin"` as valid admin role strings.

## Caching (Redis)

### Local vs. Production
*   **Local Development**: Uses a local Redis instance running on `redis://localhost:6379`.
    *   Ensure Redis is installed and running (`winget install Redis.Redis` on Windows).
*   **Production (Vercel)**: Uses the `REDIS_URL` environment variable provided by the cloud Redis provider (e.g., Redis Cloud).

### Connection Handling
The Redis client (`api/app/core/cache.py`) is configured **lazily**:
*   It does **NOT** ping/connect immediately on startup.
*   This prevents the application from crashing or hanging (blocking startup) if Redis is temporarily unavailable.
*   If Redis is down, the cache `get/set` methods are designed to fail gracefully (log error and proceed without cache), ensuring the app remains usable.

## Database Migrations (Alembic)

### Production Deployment (Vercel)
Vercel is a serverless environment and does not support running long-lived migration commands during the standard build process easily.

**Recommended Migration Strategy:**
Run migrations **externally** before or during deployment:
1.  **Local Machine**: Connect to production DB and run `alembic upgrade head`.
2.  **CI/CD (GitHub Actions)**: Create a workflow to install dependencies and run `alembic upgrade head` on push to main.

*Do not rely on app startup events to run migrations in serverless production environments as this can lead to concurrency issues.*
