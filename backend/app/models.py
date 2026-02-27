from sqlalchemy import Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(String(19), nullable=False)
    weather_temperature_c: Mapped[float | None] = mapped_column(Float)
    weather_condition: Mapped[str] = mapped_column(String(100), default="Not refreshed")
    weather_humidity_percent: Mapped[int | None] = mapped_column(Integer)
    weather_wind_kph: Mapped[float | None] = mapped_column(Float)
    weather_observed_at: Mapped[str | None] = mapped_column(String(40))
    weather_source: Mapped[str] = mapped_column(String(100), default="not-refreshed")
    weather_area: Mapped[str | None] = mapped_column(String(100))
    weather_valid_period_text: Mapped[str | None] = mapped_column(String(100))
    weather_refreshed_at: Mapped[str | None] = mapped_column(String(19))

    __table_args__ = (
        UniqueConstraint("name", "latitude", "longitude", name="uq_location_coordinates"),
    )
