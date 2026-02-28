from app.services.weather_api import SingaporeWeatherClient


def test_snapshot_from_payload_returns_nearest_area_forecast() -> None:
    payload = {
        "area_metadata": [
            {
                "name": "Marina Bay",
                "label_location": {
                    "latitude": 1.283,
                    "longitude": 103.86,
                },
            }
        ],
        "items": [
            {
                "update_timestamp": "2026-04-11T10:00:00+08:00",
                "forecasts": [
                    {
                        "area": "Marina Bay",
                        "forecast": "Partly Cloudy",
                    }
                ],
            }
        ],
    }

    snapshot = SingaporeWeatherClient().snapshot_from_payload(
        payload=payload,
        latitude=1.2831,
        longitude=103.8602,
    )

    assert snapshot["condition"] == "Partly Cloudy"
    assert snapshot["area"] == "Marina Bay"
    assert snapshot["source"] == "api-open.data.gov.sg"
