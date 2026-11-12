

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./govopt_auth.db"
)

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    # Always store SQLite database inside the backend folder
    database_path = BASE_DIR / "govopt_auth.db"

    engine_url = URL.create(
        "sqlite",
        database=str(database_path)
    )

    connect_args = {"check_same_thread": False}

else:
    # Allow PostgreSQL or another database in production
    engine_url = DATABASE_URL


# Create database engine
engine = create_engine(
    engine_url,
    connect_args=connect_args
)


# Create database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for database models
class Base(DeclarativeBase):
    pass


# FastAPI database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
