# Steward — Project Reference

Steward is a multi-tenant asset management SaaS application for organizations. It lets teams track physical equipment — check assets in and out, report incidents, view audit logs, and monitor inventory health — with QR code scanning for fast field operations.

---

## Version History

| Tag | Branch | Summary |
|-----|--------|---------|
| `v1.0.0` | initial commit | Core asset management: assets, assignments, incidents, activity, billing |
| `v2.0.0` | main | Enhanced dashboard with analytics charts (Recharts), Redis caching, `/dashboard/summary` API |
| — | dev | Teams, team members, organization settings, users list, settings pages, org invite |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.1.3, React 19, TypeScript 5, Tailwind CSS 4 |
| Auth | Clerk (`@clerk/nextjs` v6) — handles auth, org management, JWT |
| Backend | FastAPI 0.115, Python, SQLAlchemy 2, Pydantic 2 |
| Database | PostgreSQL (Neon, pooled), SQLite fallback for local dev |
| Caching | Redis (optional, added in v2 — not present in v1) |
| Deployment | Vercel (frontend + serverless API proxy) |
| Migrations | Alembic (added in v2 — v1 uses `create_all` at startup) |

---

## Repository Layout

```
Steward-app/
└── steward/                    # Entire application lives here
    ├── pages/                  # Next.js pages router
    │   ├── _app.tsx            # ClerkProvider wrapper
    │   ├── _document.tsx       # HTML document shell
    │   ├── index.tsx           # Landing / marketing page
    │   ├── dashboard.tsx       # Main dashboard
    │   ├── assets/index.tsx    # Asset inventory
    │   ├── assignments/        # Checkouts & check-ins
    │   ├── incidents/          # Issue tracking
    │   ├── activity/           # Audit log
    │   ├── organization/       # Org/team management
    │   ├── select-org/         # Org picker
    │   ├── platform.tsx        # Marketing page
    │   ├── pricing.tsx
    │   ├── privacy.tsx
    │   └── terms.tsx
    ├── components/             # Shared React components
    ├── lib/                    # API client helpers (added v2)
    ├── types/                  # TypeScript interfaces (added v2)
    ├── styles/globals.css      # Tailwind base + CSS variables
    ├── public/                 # Static assets (logo, icons)
    ├── next.config.ts          # Next.js config + API rewrite
    ├── tsconfig.json
    ├── package.json
    ├── docker-compose.yml      # Local dev services
    ├── requirements.txt        # Python deps (root-level copy)
    └── api/                    # FastAPI backend
        ├── index.py            # App entrypoint, router registration
        ├── requirements.txt    # Authoritative Python deps
        ├── alembic/            # DB migrations (v2+)
        │   └── versions/
        └── app/
            ├── core/
            │   ├── config.py   # DATABASE_URL resolution
            │   ├── db.py       # SQLAlchemy engine + session
            │   ├── debs.py     # get_db() dependency
            │   ├── security.py # Clerk JWT guard
            │   ├── billing.py  # Plan limits + Clerk plan fetch
            │   └── cache.py    # Redis utilities (v2+)
            ├── models/         # SQLAlchemy ORM models
            ├── routers/        # FastAPI route handlers
            └── schemas/        # Pydantic request/response models
```

---

## Frontend

### Commands

```bash
npm run dev     # Next.js dev server on http://localhost:3000
npm run build   # TypeScript compile + production build
npm run start   # Serve production build
npm run lint    # ESLint
```

The backend must also be running separately:
```bash
cd api
uvicorn index:app --reload --port 8000
```

### API Proxy

`next.config.ts` rewrites all `/api/*` calls:
- **Development**: proxied to `http://127.0.0.1:8000`
- **Production**: proxied to `/api` (Vercel serverless)

### Pages & Routes

| Route | File | Auth | Admin Only | Description |
|-------|------|------|-----------|-------------|
| `/` | `pages/index.tsx` | No | No | Landing / marketing page |
| `/dashboard` | `pages/dashboard.tsx` | Yes | No | Inventory stats, recent activity, plan info |
| `/assets` | `pages/assets/index.tsx` | Yes | Yes | Asset CRUD, QR codes, image upload |
| `/assignments` | `pages/assignments/index.tsx` | Yes | No | Checkout/check-in with QR scanner |
| `/incidents` | `pages/incidents/index.tsx` | Yes | Yes | Issue tracking and lifecycle management |
| `/activity` | `pages/activity/index.tsx` | Yes | Yes | Paginated audit log |
| `/organization` | `pages/organization/index.tsx` | Yes | Yes | Embeds Clerk's `OrganizationProfile` component |
| `/select-org` | `pages/select-org/index.tsx` | Yes | No | Org picker; redirect here when no org active |
| `/platform` | `pages/platform.tsx` | No | No | Product marketing page |
| `/pricing` | `pages/pricing.tsx` | No | No | Pricing tiers |
| `/privacy` | `pages/privacy.tsx` | No | No | Privacy policy |
| `/terms` | `pages/terms.tsx` | No | No | Terms of service |

> Pages in the `dev` branch add: `/organization` (custom Users/Teams UI), `/organization/invite`, `/settings/*` (7 sub-pages).

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `Layout` | `components/Layout.tsx` | Page wrapper with Sidebar; validates org/user session |
| `Sidebar` | `components/Sidebar.tsx` | Nav menu with role badge and user avatar |
| `StatCard` | `components/StatCard.tsx` | Metric card with variants: default / success / warning / danger |
| `AssetFormModal` | `components/AssetFormModal.tsx` | Create/edit asset — name, description, status, QR, image upload |
| `CheckoutModal` | `components/CheckoutModal.tsx` | Assign asset to org member with return date and notes |
| `ScanModal` | `components/ScanModal.tsx` | Camera-based QR scanner using `html5-qrcode` |
| `IncidentModal` | `components/IncidentModal.tsx` | Report a new incident on an asset |
| `IncidentDetailsModal` | `components/IncidentDetailsModal.tsx` | View incident, update status, add timeline notes |

> `dev` branch adds: `TeamFormModal`, `AddMemberModal`.

### Auth Pattern (Clerk)

```tsx
// Wrap the app — _app.tsx
<ClerkProvider>...</ClerkProvider>

// Get token for API calls
const { getToken, isLoaded, userId } = useAuth();
const token = await getToken();
fetch("/api/assets", { headers: { Authorization: `Bearer ${token}` } });

// Current org context
const { organization, memberships } = useOrganization();

// Role-based rendering
<Protect permission="org:admin">  {/* admin-only UI */}  </Protect>

// Redirect when no org selected
if (isLoaded && !organization) router.push("/select-org");
```

Clerk JWT token structure (important — see Gotchas below):
```json
{
  "sub": "user_xxx",
  "o": { "id": "org_xxx", "rol": "admin" },
  "org_id": "org_xxx",
  "org_role": "org:admin"
}
```

### State Management

- **No global state store** — only Clerk context + local `useState`/`useRef`
- **Data fetching**: SWR (`useSWR`) with token-keyed cache keys
- **Cache invalidation**: `mutate()` after creates/updates
- **Filtered lists**: `useMemo` for search and status filters

### Styling

- **Tailwind CSS 4** (PostCSS plugin, not CDN)
- **Primary color**: Emerald/green (`#10B981`, `#22c55e`)
- **Status colors**: green = available, yellow = warning/overdue, red = danger/missing, blue = info
- **Border radius**: `xl` (12px), `2xl` (16px), `3xl` (24px)
- **Landing page**: dark theme (`#020617`), gradient headings, glass-morphism cards, animated liquid background
- **App pages**: white backgrounds, `gray-100/200` borders, `gray-500` secondary text

---

## Backend (FastAPI)

### Entry Point

`api/index.py` — creates the FastAPI app, registers routers, adds CORS middleware, creates all tables via `Base.metadata.create_all()` at startup (v1 only; v2+ uses Alembic).

### API Endpoints

#### Assets — `/assets`

| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| `GET` | `/assets` | No | List assets for org; filter by `?status=` and `?search=` |
| `POST` | `/assets` | **Yes** | Create asset; enforces plan `max_assets` limit |
| `GET` | `/assets/{id}` | No | Get single asset |
| `PUT` | `/assets/{id}` | **Yes** | Update asset; logs field changes to activity |
| `DELETE` | `/assets/{id}` | **Yes** | Delete asset; logs deletion before removal |

#### Assignments — `/assignments`

| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| `POST` | `/assignments/checkout` | No | Checkout asset (must be Available); creates assignment, sets asset → Checked Out |
| `POST` | `/assignments/checkin/{asset_id}` | No | Return asset; sets assignment → Returned, asset → Available |
| `GET` | `/assignments/active` | No | Active assignments (admins: all; users: own only) |
| `GET` | `/assignments/history` | No | Returned assignments history (same role filtering) |
| `GET` | `/assignments/history/{asset_id}` | **Yes** | Full checkout history for one asset |

#### Incidents — `/incidents`

| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| `POST` | `/incidents` | No | Report incident; High/Critical severity auto-sets asset → Maintenance |
| `GET` | `/incidents` | **Yes** | List incidents with automated lifecycle processing; plan history limits apply |
| `GET` | `/incidents/{id}` | **Yes** | Get incident with notes timeline |
| `PUT` | `/incidents/{id}` | **Yes** | Update status/severity/notes; reverts asset to Available when all resolved |

**Incident lifecycle automation:**
- Open → Resolved (7 days idle) → Closed → Archived (`is_archived=True`, 2 days after closed)
- High/Critical reported → asset status = `Maintenance`
- All incidents resolved → asset reverts to `Available` (if it was `Maintenance`)

#### Activity — `/activity`

| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| `GET` | `/activity` | **Yes** | Paginated audit log; `?skip=`, `?limit=`, `?asset_id=`, `?event_type=`; plan history limits apply |

#### Billing — `/billing`

| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| `GET` | `/billing/plan` | No | Returns current plan and feature limits |

**Plan response shape:**
```json
{
  "plan": "starter",
  "max_assets": 100,
  "max_people": 25,
  "history_days": 30,
  "has_photos": false,
  "has_advanced_reporting": false
}
```

#### Root Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check → `{"status": "ok"}` |
| `GET` | `/me` | Yes | Returns `user_id`, `org_id`, `org_role` from JWT |

> **Added in v2 (not in v1):** `GET /dashboard/summary` — aggregated analytics with Redis caching
> **Added in dev branch:** `GET/PUT /settings`, `GET/POST/PUT/DELETE /teams`, `GET /users`

### Database Schema

All tables include `org_id` (Clerk Org ID) for multi-tenant isolation — every query filters by `org_id`.

#### `assets`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `org_id` | String (indexed) | Clerk Org ID |
| `name` | String (indexed) | |
| `description` | Text | nullable |
| `status` | String | `Available` \| `Checked Out` \| `Maintenance` \| `Retired` |
| `qr_code` | String (unique) | nullable; auto-generated on frontend |
| `image_url` | String | nullable |
| `created_by` | String | Clerk User ID |
| `updated_by` | String | Clerk User ID |
| `created_at` | DateTime (tz) | server default |
| `updated_at` | DateTime (tz) | auto-update on write |

> `estimated_value` Float column added in v2 migration `1b8713a1df77`.

#### `assignments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `org_id` | String (indexed) | |
| `asset_id` | Integer FK → `assets.id` | |
| `assigned_to` | String | Clerk User ID of recipient |
| `assigned_by` | String | Clerk User ID of admin who checked out |
| `checked_out_at` | DateTime (tz) | server default |
| `expected_return_at` | DateTime (tz) | nullable |
| `actual_return_at` | DateTime (tz) | nullable; set on check-in |
| `status` | String | `Active` \| `Returned` |
| `notes` | Text | nullable |
| `condition_photo_url` | String | nullable |
| `event_tags` | JSON | list of strings e.g. `["Wedding", "Concert"]` |

#### `incidents`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `org_id` | String (indexed) | |
| `asset_id` | Integer FK → `assets.id` | |
| `reported_by` | String | Clerk User ID |
| `title` | String | |
| `description` | Text | |
| `severity` | String | `Low` \| `Medium` \| `High` \| `Critical` |
| `status` | String | `Open` \| `In Progress` \| `Resolved` \| `Closed` |
| `notes` | JSON | array of `{text, created_at, actor_id}` |
| `photo_url` | String | nullable |
| `is_archived` | Boolean | set true by lifecycle automation |
| `created_at` | DateTime (tz) | server default |
| `updated_at` | DateTime (tz) | auto-update |

#### `activity_logs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `org_id` | String (indexed) | |
| `asset_id` | Integer (indexed) | not a FK — allows logging deleted assets |
| `asset_name` | String | cached at log time; preserved when asset is deleted |
| `actor_id` | String | Clerk User ID or `"system"` |
| `event_type` | String | `created` \| `updated` \| `checked_out` \| `checked_in` \| `retired` \| `deleted` \| `incident_reported` \| `incident_updated` |
| `details` | JSON | event-specific metadata (status changes, field diffs, etc.) |
| `created_at` | DateTime (tz) | server default |

> Tables added in `dev` branch: `teams`, `team_members`, `organization_settings`

### Authentication & Authorization

**Provider:** Clerk — RS256 JWT, validated via JWKS endpoint.

**Guard:** `CustomClerkGuard` in `api/app/core/security.py`
- Extends `HTTPBearer`
- Fetches public keys from `CLERK_JWKS_URL`
- Validates RS256 signature with 10-second clock leeway
- Audience verification disabled (Clerk backend tokens often omit `aud`)

**Dependency injection pattern:**
```python
# All protected endpoints use:
creds: HTTPAuthorizationCredentials = Depends(clerk_guard)

# Extract org and user from claims:
def get_org_id(creds=Depends(clerk_guard)) -> str: ...
def get_user_id(creds=Depends(clerk_guard)) -> str: ...
def require_admin(creds=Depends(clerk_guard)): ...
```

**Admin check** — `require_admin()` accepts either of these JWT claim paths:
1. `claims["org_role"]` == `"org:admin"`
2. `claims["o"]["rol"]` == `"admin"` (minified Clerk claims)
3. `claims["o"]["role"]` == `"admin"` (alternative format)

### Billing / Plan Model

Stored in Clerk org `public_metadata.plan_id`. Fetched live from Clerk API per request.

| Plan ID | Name | Max Assets | Max People | History | Photos | Advanced Reports |
|---------|------|-----------|-----------|---------|--------|-----------------|
| `cplan_38aqHgyzV4VLU75NSZM0rYO3yo5` | Starter | 100 | 25 | 30 days | No | No |
| `cplan_38aqeaPaWPeptXtTSkM7espqMZ6` | Pro | Unlimited | Unlimited | Unlimited | Yes | Yes |

**Enforcement points:**
- `POST /assets` — checks `max_assets` before insert
- `GET /activity` — restricts query window to `history_days`
- `GET /incidents` — same history window restriction
- Feature gates: photo upload, advanced reporting (frontend-gated via plan info from `/billing/plan`)

---

## Environment Variables

Create `steward/.env.local` (frontend) and `steward/api/.env` (backend).

### Frontend (`steward/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Backend (`steward/api/.env` or system env)
```env
# Auth
CLERK_JWKS_URL=https://<clerk-domain>/.well-known/jwks.json
CLERK_SECRET_KEY=sk_...          # Used to fetch org data and plan info from Clerk API

# Database
DATABASE_URL=postgresql+psycopg2://user:pass@host/db?sslmode=require
DATABASE_URL_UNPOOLED=postgres://user:pass@host/db?sslmode=require  # For Alembic migrations

# Caching (v2+)
REDIS_URL=redis://localhost:6379
```

Neon provides both `DATABASE_URL` (pooled, for app) and `DATABASE_URL_UNPOOLED` (direct, for migrations). The config resolves in priority order: `POSTGRES_URL` → `DATABASE_URL` → SQLite fallback.

---

## Database Setup

### v1 — Auto-create at startup
`Base.metadata.create_all(bind=engine)` runs on every cold start. No migration tooling needed.

### v2+ — Alembic
Migrations must be run **externally** (never at Vercel serverless startup).

```bash
cd steward/api
alembic upgrade head
```

Migration history:
| Revision | Description |
|----------|-------------|
| `1b8713a1df77` | Add `estimated_value` to assets, `condition_photo_url` + `event_tags` to assignments, `photo_url` to incidents |
| `bd4e56a1d17f` | Add `teams` and `team_members` tables |
| `943bb5410e25` | Add `organization_settings` table |

Use `DATABASE_URL_UNPOOLED` for Alembic to avoid connection pool issues during migrations.

---

## Deployment

Hosted on **Vercel** (`prj_9bCY22oAlPyZKzjFpyZfbHGRsBnU`).

- Frontend and API are deployed together as a Vercel project
- `next.config.ts` rewrites `/api/*` to the FastAPI handler at `/api` in production
- All environment variables set in Vercel dashboard
- `DATABASE_URL_UNPOOLED` is used to run Alembic before each deploy

---

## Python Dependencies

From `steward/api/requirements.txt` (v1):
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
sqlalchemy==2.0.35
psycopg[binary]==3.2.2
httpx==0.27.2
pyjwt[crypto]==2.9.0
fastapi-clerk-auth
```

v2 adds: `psycopg2-binary`, `redis==5.2.1`, `pydantic-settings`, `alembic`, `python-jose[cryptography]`

---

## Key Conventions & Gotchas

**Clerk JWT claims — `rol` not `r`**
In minified Clerk JWT tokens, the org role key is `rol`, not `r`. The backend checks multiple paths to be safe. If admin checks are failing, add a `/me` debug call and inspect the raw claims structure.

**Admin roles — two valid values**
Both `"org:admin"` (full claims) and `"admin"` (minified claims) are valid. The `require_admin()` dependency handles both. Never check for just one form.

**Redis is optional**
v2+ uses Redis for dashboard caching but initializes lazily — a missing or unreachable Redis instance logs a warning and skips caching rather than blocking startup.

**`org_id` on every query — no exceptions**
Every database query must include a `WHERE org_id = ?` clause. There is no super-admin view. Cross-org data leakage is prevented purely by JWT scoping.

**Activity logs are written before mutations commit**
Logs record intent. If the mutation fails after the log is written within the same transaction, both are rolled back together. The log and the change are always in the same SQLAlchemy session.

**`asset_name` is cached in activity_logs**
Since assets can be deleted, `asset_name` is denormalized into each activity log row at write time. This preserves history for deleted assets.

**`Base.metadata.create_all()` vs Alembic**
v1 creates tables at app startup. v2+ switched to Alembic — do not re-enable `create_all` in production as it will conflict with migration state tracking.

**Next.js rewrite in dev vs prod**
- Dev: `http://127.0.0.1:8000` — the FastAPI dev server must be running
- Prod: `/api` — handled by Vercel's serverless function runner
The rewrite is transparent; frontend always calls `/api/*`.

**QR codes are generated on the frontend**
The backend stores whatever string the frontend sends as `qr_code`. The frontend generates a UUID-based code for new assets if the user doesn't provide one. QR scanning in `ScanModal` matches the scanned string against `qr_code` values via the assets list.

**`condition_photo_url` and `event_tags` are v1 columns**
Despite being feature-sounding names, these columns exist in the `assignments` table from v1. They were included in the initial data model. Photo upload enforcement (gated by plan) is done on the API side.
