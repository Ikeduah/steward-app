"""Read-only: dump the single organization_settings row.

Run with the same DATABASE_URL_UNPOOLED as the other inspect_* scripts:
    $env:DATABASE_URL_UNPOOLED = '...'
    .venv\\Scripts\\python.exe inspect_org_settings_row.py

Does not modify anything.
"""
import os

from sqlalchemy import create_engine, text


def _migration_url() -> str:
    url = os.getenv("DATABASE_URL_UNPOOLED")
    if not url:
        raise RuntimeError("Set DATABASE_URL_UNPOOLED first")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine = create_engine(_migration_url())

with engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT id, org_id, settings, updated_at FROM organization_settings"
    )).fetchall()
    for row in rows:
        print(row)
