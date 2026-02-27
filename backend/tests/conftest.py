import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.routers.locations import get_weather_client
from app.schemas import WeatherSnapshot


class FakeWeatherClient:
    def get_current_weather(self, latitude: float, longitude: float) -> WeatherSnapshot:
        return WeatherSnapshot(
            temperature_c=12.3,
            condition="Clear",
            humidity_percent=50,
            wind_kph=10.0,
            observed_at="2026-02-23T12:00:00+00:00",
            source="fake-weather-client",
            area="Singapore Center",
            valid_period_text="12 PM to 2 PM",
        )


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_local = sessionmaker(bind=engine)

    session = session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def client(db_session: Session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_weather_client():
        return FakeWeatherClient()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_weather_client] = override_weather_client

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
