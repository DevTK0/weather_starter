# Backend Guide

## Scope

Use this guide when working in `backend/` or when a task changes API behavior, SQLite persistence, or the data.gov.sg integration.

## Stack And Structure

- Python 3.11
- FastAPI for HTTP endpoints
- sqlite3 for persistence
- httpx for upstream requests
- uvicorn for local serving

Primary files:

- `backend/app/main.py`: FastAPI app setup and SQLite schema initialization
- `backend/app/routers/locations.py`: location endpoints and refresh flow
- `backend/app/services/weather_api.py`: data.gov.sg client and forecast mapping

## Current Backend Model

- Locations are stored by latitude and longitude with a uniqueness constraint.
- Weather data is a snapshot written onto the location row, not a historical time series.
- Reads come from SQLite.
- The explicit refresh flow is the only current path that calls the external provider.
- Singapore coordinate validation currently uses the bounds `lat 1.1–1.5` and `lon 103.6–104.1`.

## Working Rules

- Use plain sqlite3 access patterns consistent with `locations.py`.
- Keep backend logic close to the existing router/service split.
- Keep response shapes stable unless the task explicitly requires an API change.
- Raise FastAPI `HTTPException` with clear user-facing messages for validation and upstream failures.
- Keep external API integration isolated in `backend/app/services/weather_api.py`.
- If schema changes are needed, update `init_db()` in `backend/app/main.py` with the minimum viable migration approach for this starter.

## API And Persistence Notes

- `POST /api/locations` creates a row without calling the weather provider.
- `GET /api/locations` and `GET /api/locations/{id}` read from SQLite only.
- `POST /api/locations/{id}/refresh` fetches the latest snapshot and updates the existing row.
- Preserve the snapshot-based flow unless the task explicitly changes product behavior.

## Validation

Minimum check:

```bash
cd backend && uv run python -m compileall app
```

If a change touches imports, routing, or startup behavior, prefer running the backend locally as well.