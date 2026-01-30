from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from .config import get_database_url

DATABASE_URL = get_database_url()

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# Serverless-safe: avoid holding open pooled connections between invocations.
# For SQLite local dev, we keep poolclass=NullPool or default. 
# NullPool is fine for local dev to avoid "database is locked" in some serverless sims, 
# but often Standard pool is better for SQLite. Let's stick to the existing NullPool for consistency 
# unless it breaks.
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=NullPool,
    pool_pre_ping=True,
)

from sqlalchemy.ext.declarative import declarative_base

# ... (previous imports)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()
