from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Location
from app.schemas import LocationCreate, LocationListResponse, LocationRead, WeatherSnapshot
from app.services.weather_api import SingaporeWeatherClient, WeatherProviderError

router = APIRouter(prefix="/locations", tags=["locations"])


def get_weather_client() -> SingaporeWeatherClient:
    settings = get_settings()
    return SingaporeWeatherClient(
        base_url=settings.weather_api_base_url,
        two_hour_path=settings.weather_api_two_hour_path,
        timeout_seconds=settings.weather_api_timeout_seconds,
        user_agent=settings.weather_api_user_agent,
        api_key=settings.weather_api_key,
    )


def _snapshot_from_location(location: Location) -> WeatherSnapshot:
    return WeatherSnapshot(
        temperature_c=location.weather_temperature_c,
        condition=location.weather_condition,
        humidity_percent=location.weather_humidity_percent,
        wind_kph=location.weather_wind_kph,
        observed_at=location.weather_observed_at,
        source=location.weather_source,
        area=location.weather_area,
        valid_period_text=location.weather_valid_period_text,
    )


def _to_location_read(location: Location) -> LocationRead:
    return LocationRead(
        id=location.id,
        name=location.name,
        latitude=location.latitude,
        longitude=location.longitude,
        created_at=location.created_at,
        weather=_snapshot_from_location(location),
    )


def _apply_weather(location: Location, snapshot: WeatherSnapshot) -> None:
    location.weather_temperature_c = snapshot.temperature_c
    location.weather_condition = snapshot.condition
    location.weather_humidity_percent = snapshot.humidity_percent
    location.weather_wind_kph = snapshot.wind_kph
    location.weather_observed_at = snapshot.observed_at
    location.weather_source = snapshot.source
    location.weather_area = snapshot.area
    location.weather_valid_period_text = snapshot.valid_period_text
    location.weather_refreshed_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")


@router.get("", response_model=LocationListResponse)
def list_locations(db: Session = Depends(get_db)):
    locations = db.scalars(
        select(Location).order_by(Location.created_at.desc(), Location.id.desc())
    ).all()
    return LocationListResponse(locations=[_to_location_read(location) for location in locations])


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
):
    location = Location(
        name=payload.name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        created_at=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S"),
        weather_condition="Not refreshed",
        weather_source="not-refreshed",
    )

    db.add(location)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Location already exists") from None

    db.refresh(location)
    return _to_location_read(location)


@router.get("/{location_id}", response_model=LocationRead)
def get_location(location_id: int, db: Session = Depends(get_db)):
    location = db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return _to_location_read(location)


@router.post("/{location_id}/refresh", response_model=LocationRead)
def refresh_location(
    location_id: int,
    db: Session = Depends(get_db),
    weather_client: SingaporeWeatherClient = Depends(get_weather_client),
):
    location = db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    try:
        snapshot = weather_client.get_current_weather(
            latitude=location.latitude,
            longitude=location.longitude,
        )
        _apply_weather(location, snapshot)
        db.commit()
    except WeatherProviderError as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    db.refresh(location)
    return _to_location_read(location)
