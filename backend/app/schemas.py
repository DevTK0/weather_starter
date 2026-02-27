from pydantic import BaseModel, Field, field_validator


class LocationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Location name cannot be blank")
        return value


class WeatherSnapshot(BaseModel):
    temperature_c: float | None
    condition: str
    humidity_percent: int | None
    wind_kph: float | None
    observed_at: str | None
    source: str
    area: str | None = None
    valid_period_text: str | None = None


class LocationRead(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    created_at: str
    weather: WeatherSnapshot


class LocationListResponse(BaseModel):
    locations: list[LocationRead]
