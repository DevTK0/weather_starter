from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=settings.debug,
)


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_location_snapshot_columns() -> None:
    """Keep only the canonical locations table and expected snapshot columns."""
    migrations = {
        "weather_temperature_c": "weather_temperature_c REAL",
        "weather_condition": "weather_condition TEXT NOT NULL DEFAULT 'Not refreshed'",
        "weather_humidity_percent": "weather_humidity_percent INTEGER",
        "weather_wind_kph": "weather_wind_kph REAL",
        "weather_observed_at": "weather_observed_at TEXT",
        "weather_source": "weather_source TEXT NOT NULL DEFAULT 'not-refreshed'",
        "weather_area": "weather_area TEXT",
        "weather_valid_period_text": "weather_valid_period_text TEXT",
        "weather_refreshed_at": "weather_refreshed_at TEXT",
    }

    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS cities"))

        table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='locations'")
        ).scalar()
        if not table_exists:
            return

        existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(locations)"))}
        for column_name, column_def in migrations.items():
            if column_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE locations ADD COLUMN {column_def}"))
