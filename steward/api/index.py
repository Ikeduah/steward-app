import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_clerk_auth import HTTPAuthorizationCredentials

# Ensure app directory is discoverable
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from app.core.security import clerk_guard
from app.core.config import get_database_url
from app.core.db import Base, engine
from app.routers import assets, assignments, activity, incidents, billing, internal
from app.models.assignment import Assignment 
from app.models.activity import ActivityLog 
from app.models.incident import Incident 

# Initialize Database
# Production/staging schema is managed by Alembic migrations (run externally:
# `alembic upgrade head`). We only auto-create tables for the local SQLite
# fallback so local dev works without running migrations. Never create_all on
# Postgres — it races with Alembic's migration state tracking.
if engine.dialect.name == "sqlite":
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Steward API")

# CORS: restrict to your app domain in production.
# Set ALLOWED_ORIGINS in your environment, e.g.:
#   ALLOWED_ORIGINS=https://your-app.vercel.app
# Falls back to localhost for local development.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

# Register routers.
# All routes are served under the /api prefix so that, on Vercel, the Next.js
# frontend and this FastAPI function can share one project: the frontend owns
# /api/cron/* and /api/ai/* (Next.js serverless functions, matched first by the
# filesystem), and everything else under /api/* is rewritten to this app.
# In local dev the same /api prefix is preserved by the next.config.ts proxy.
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(activity.router, prefix="/api/activity", tags=["Activity"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])
app.include_router(internal.router, prefix="/api/internal", tags=["Internal"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/me")
def me(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    claims = creds.decoded
    user_id = claims.get("sub")
    
    org_data = claims.get("org") or claims.get("o")
    org_role = None
    org_id = None
    
    if isinstance(org_data, dict):
        org_id = org_data.get("id")
        org_role = org_data.get("org_role") or org_data.get("role") or org_data.get("rol")
    else:
        org_role = claims.get("org_role")
        org_id = claims.get("org_id")

    if not user_id:
        return {"error": "Missing sub claim"}

    if not org_id:
        return {"error": "Missing org_id claim (configure Clerk org claims / template)"}

    return {"user_id": user_id, "org_id": org_id, "org_role": org_role}

