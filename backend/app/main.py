import os
import sqlite3
import time

import structlog
from fastapi import FastAPI, Request

from app.logging_config import setup_logging
from app.routers.locations import router as locations_router

setup_logging()

logger = structlog.get_logger()

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def init_db():
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at TEXT NOT NULL,
            weather_condition TEXT,
            weather_observed_at TEXT,
            weather_source TEXT,
            weather_area TEXT,
            weather_valid_period_text TEXT,
            weather_refreshed_at TEXT,
            UNIQUE(latitude, longitude)
        )
    """)
    con.commit()
    con.close()


init_db()

app = FastAPI(
    title="Weather Starter",
    description="Minimal weather API starter with data.gov.sg integration",
    version="0.1.0",
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    status_code = response.status_code

    if status_code >= 500:
        log_fn = logger.error
    elif status_code >= 400:
        log_fn = logger.warning
    else:
        log_fn = logger.info

    log_fn(
        "http_request",
        method=request.method,
        path=request.url.path,
        status_code=status_code,
        duration_ms=duration_ms,
    )
    return response


app.include_router(locations_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
