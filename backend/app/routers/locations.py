import os
import sqlite3
import time
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from app.logging_config import get_logger
from app.services.weather_api import SingaporeWeatherClient, WeatherProviderError

logger = get_logger("app.routers.locations")

router = APIRouter(prefix="/locations", tags=["locations"])

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    weather = {
        "condition": d.pop("weather_condition", None),
        "observed_at": d.pop("weather_observed_at", None),
        "source": d.pop("weather_source", None),
        "area": d.pop("weather_area", None),
        "valid_period_text": d.pop("weather_valid_period_text", None),
    }
    d.pop("weather_refreshed_at", None)
    d["weather"] = weather
    return d


@router.get("")
def list_locations():
    logger.info("list_locations_called", endpoint="GET /api/locations")
    start = time.perf_counter()

    con = get_db()
    rows = con.execute(
        "SELECT * FROM locations ORDER BY created_at DESC, id DESC"
    ).fetchall()
    con.close()

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "list_locations_success",
        endpoint="GET /api/locations",
        count=len(rows),
        duration_ms=duration_ms,
    )
    return {"locations": [row_to_dict(row) for row in rows]}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_location(payload: dict):
    latitude = payload.get("latitude")
    longitude = payload.get("longitude")

    logger.info(
        "create_location_called",
        endpoint="POST /api/locations",
        latitude=latitude,
        longitude=longitude,
    )

    if latitude is None or longitude is None:
        logger.warning(
            "create_location_validation_error",
            endpoint="POST /api/locations",
            detail="latitude and longitude are required",
        )
        raise HTTPException(status_code=422, detail="latitude and longitude are required")
    if not (1.1 <= latitude <= 1.5 and 103.6 <= longitude <= 104.1):
        logger.warning(
            "create_location_validation_error",
            endpoint="POST /api/locations",
            latitude=latitude,
            longitude=longitude,
            detail="Coordinates out of Singapore bounds",
        )
        raise HTTPException(
            status_code=422,
            detail="Coordinates must be within Singapore (lat 1.1–1.5, lon 103.6–104.1)",
        )

    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")
    con = get_db()
    try:
        cursor = con.execute(
            """INSERT INTO locations (latitude, longitude, created_at, weather_condition, weather_source)
               VALUES (?, ?, ?, 'Not refreshed', 'not-refreshed')""",
            (latitude, longitude, now),
        )
        con.commit()
        row = con.execute("SELECT * FROM locations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        con.close()
        logger.warning(
            "create_location_conflict",
            endpoint="POST /api/locations",
            latitude=latitude,
            longitude=longitude,
        )
        raise HTTPException(status_code=409, detail="Location already exists") from None
    con.close()

    location = row_to_dict(row)
    logger.info(
        "create_location_success",
        endpoint="POST /api/locations",
        location_id=location["id"],
        latitude=latitude,
        longitude=longitude,
    )
    return location


@router.get("/{location_id}")
def get_location(location_id: int):
    logger.info(
        "get_location_called",
        endpoint="GET /api/locations/{id}",
        location_id=location_id,
    )

    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()

    if row is None:
        logger.warning(
            "get_location_not_found",
            endpoint="GET /api/locations/{id}",
            location_id=location_id,
        )
        raise HTTPException(status_code=404, detail="Location not found")

    logger.info(
        "get_location_success",
        endpoint="GET /api/locations/{id}",
        location_id=location_id,
    )
    return row_to_dict(row)


@router.post("/{location_id}/refresh")
def refresh_location(location_id: int):
    logger.info(
        "refresh_location_called",
        endpoint="POST /api/locations/{id}/refresh",
        location_id=location_id,
    )

    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        logger.warning(
            "refresh_location_not_found",
            endpoint="POST /api/locations/{id}/refresh",
            location_id=location_id,
        )
        raise HTTPException(status_code=404, detail="Location not found")

    lat, lon = row["latitude"], row["longitude"]
    api_key = os.getenv("WEATHER_API_KEY")
    client = SingaporeWeatherClient(api_key=api_key)

    start = time.perf_counter()
    try:
        snapshot = client.get_current_weather(latitude=lat, longitude=lon)
    except WeatherProviderError as exc:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        con.close()
        logger.error(
            "refresh_location_weather_error",
            endpoint="POST /api/locations/{id}/refresh",
            location_id=location_id,
            latitude=lat,
            longitude=lon,
            duration_ms=duration_ms,
            error=str(exc),
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")
    con.execute(
        """UPDATE locations
           SET weather_condition = ?, weather_observed_at = ?, weather_source = ?,
               weather_area = ?, weather_valid_period_text = ?, weather_refreshed_at = ?
           WHERE id = ?""",
        (
            snapshot["condition"],
            snapshot["observed_at"],
            snapshot["source"],
            snapshot["area"],
            snapshot["valid_period_text"],
            now,
            location_id,
        ),
    )
    con.commit()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()

    logger.info(
        "refresh_location_success",
        endpoint="POST /api/locations/{id}/refresh",
        location_id=location_id,
        latitude=lat,
        longitude=lon,
        weather_condition=snapshot["condition"],
        weather_area=snapshot["area"],
        duration_ms=duration_ms,
    )
    return row_to_dict(row)
