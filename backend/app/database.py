import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./regime.db")

def _normalise_url(url: str) -> str:
    """
    Normalise DB URL for SQLAlchemy 2.x + psycopg2:
      postgres://...     → postgresql+psycopg2://...   (Heroku legacy)
      postgresql://...   → postgresql+psycopg2://...   (Supabase standard)
      sqlite://...       → unchanged
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

DATABASE_URL = _normalise_url(_raw_url)

_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,    # recycles stale connections
        pool_recycle=300,      # recycle every 5 min — Supabase pooler timeout
        connect_args={"sslmode": "require"},  # Supabase requires SSL
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
