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
from app.routers import assets, assignments, activity, incidents, billing, dashboard
from app.models.assignment import Assignment 
from app.models.activity import ActivityLog 
from app.models.incident import Incident 

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Steward API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": str(type(exc))},
    )

# Register routers
app.include_router(assets.router, prefix="/assets", tags=["Assets"])
app.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
app.include_router(activity.router, prefix="/activity", tags=["Activity"])
app.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/me")
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

