"""Alembic migration environment for the Steward API.

The database URL is resolved from the environment at runtime:
DATABASE_URL_UNPOOLED (preferred for migrations) falls back to the app's
normal database URL resolution. All models are imported so that
``target_metadata`` reflects the full schema for --autogenerate.
"""
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# Make the `app` package importable (env.py lives in steward/api/alembic/).
API_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(API_DIR))

from app.core.db import Base  # noqa: E402
from app.core.config import get_database_url  # noqa: E402

# Import model modules so their tables register on Base.metadata.
from app.models import asset, assignment, incident, activity  # noqa: E402,F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _migration_url() -> str:
    """Prefer the unpooled connection for migrations (no PgBouncer)."""
    url = os.getenv("DATABASE_URL_UNPOOLED")
    if url:
        # Normalize to the psycopg (v3) driver, matching app config.
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
    return get_database_url()


def run_migrations_offline() -> None:
    context.configure(
        url=_migration_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = _migration_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
