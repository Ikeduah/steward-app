# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import NullPool
from .config import get_database_url

DATABASE_URL = get_database_url()

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# NullPool is used here for serverless compatibility — avoids holding open
# pooled connections between function invocations (e.g. Vercel serverless).
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=NullPool,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()
