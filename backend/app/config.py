from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Weather Starter"
    debug: bool = False
    database_url: str = "sqlite:///./weather.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174"]
    weather_api_base_url: str = "https://api-open.data.gov.sg"
    weather_api_two_hour_path: str = "/v2/real-time/api/two-hr-forecast"
    weather_api_timeout_seconds: float = 8.0
    weather_api_user_agent: str = "weather-starter/0.1 (educational project)"
    weather_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
