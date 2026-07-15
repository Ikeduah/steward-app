"""Read-only diagnostic: dump live DB schema + alembic_version state.

Run with the same DATABASE_URL_UNPOOLED you used for `alembic check`:
    $env:DATABASE_URL_UNPOOLED = '...'
    .venv\\Scripts\\python.exe inspect_schema.py

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
    print("=== alembic_version ===")
    try:
        rows = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        print(rows)
    except Exception as e:
        print(f"(could not read alembic_version: {e})")

    print("\n=== tables in public schema ===")
    tables = conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    )).fetchall()
    for (t,) in tables:
        print(" -", t)

    print("\n=== columns per table ===")
    for (t,) in tables:
        cols = conn.execute(text(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :t ORDER BY ordinal_position"
        ), {"t": t}).fetchall()
        print(f"\n{t}:")
        for col in cols:
            print("   ", col)
