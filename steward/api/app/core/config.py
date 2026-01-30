import os
from dotenv import load_dotenv
from pathlib import Path

# Load root .env.local (pulled from Vercel)
ROOT_ENV = Path(__file__).resolve().parents[3] / ".env.local"
if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV)

def get_database_url() -> str:
    # Prioritize cloud database URLs (e.g., Vercel Postgres, Neon, etc.)
    url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    
    if url:
        # SQLAlchemy requires 'postgresql://' or 'postgresql+psycopg://'.
        # Since we have psycopg (v3) installed, we'll explicitly use it.
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
        
    # Fallback to local SQLite for development only
    return "sqlite:///./test.db"
def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value