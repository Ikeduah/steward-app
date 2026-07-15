"""Read-only: row counts for tables/columns we're considering dropping.

Run with the same DATABASE_URL_UNPOOLED as inspect_schema.py:
    $env:DATABASE_URL_UNPOOLED = '...'
    .venv\\Scripts\\python.exe inspect_orphan_data.py

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
    for table in ("teams", "team_members", "organization_settings"):
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print(f"{table}: {count} row(s)")

    total = conn.execute(text("SELECT COUNT(*) FROM assets")).scalar()
    non_null = conn.execute(
        text("SELECT COUNT(*) FROM assets WHERE estimated_value IS NOT NULL")
    ).scalar()
    print(f"assets.estimated_value: {non_null} non-null out of {total} total assets")
