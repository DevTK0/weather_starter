from fastapi.testclient import TestClient


class TestLocationsAPI:
    def test_list_locations_empty(self, client: TestClient):
        response = client.get("/api/locations")

        assert response.status_code == 200
        assert response.json() == {"locations": []}

    def test_create_location_returns_201(self, client: TestClient):
        response = client.post(
            "/api/locations",
            json={"name": "Bishan", "latitude": 1.3508, "longitude": 103.8485},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Bishan"
        assert data["latitude"] == 1.3508
        assert data["longitude"] == 103.8485
        assert "weather" in data
        assert data["weather"]["condition"] == "Not refreshed"
        assert data["weather"]["source"] == "not-refreshed"
        assert "id" in data

    def test_create_duplicate_location_returns_409(self, client: TestClient):
        client.post(
            "/api/locations",
            json={"name": "Bishan", "latitude": 1.3508, "longitude": 103.8485},
        )

        response = client.post(
            "/api/locations",
            json={"name": "Bishan", "latitude": 1.3508, "longitude": 103.8485},
        )

        assert response.status_code == 409

    def test_get_location_returns_404_when_missing(self, client: TestClient):
        response = client.get("/api/locations/999")

        assert response.status_code == 404

    def test_refresh_location_updates_weather_snapshot(self, client: TestClient):
        create_response = client.post(
            "/api/locations",
            json={"name": "Singapore Center", "latitude": 1.3521, "longitude": 103.8198},
        )
        location_id = create_response.json()["id"]

        refresh_response = client.post(f"/api/locations/{location_id}/refresh")

        assert refresh_response.status_code == 200
        payload = refresh_response.json()
        assert payload["id"] == location_id
        assert payload["weather"]["condition"] == "Clear"
        assert payload["weather"]["source"] == "fake-weather-client"
