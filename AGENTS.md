# AGENTS.md

## Quick Start

```bash
flox activate
flox services start        # starts both backend + frontend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Health check: `GET /health`

Manual startup (inside `flox activate`):

```bash
# Backend (must run from backend/)
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000

# Frontend (must run from frontend/)
cd frontend && npm install && npm run dev -- --host 127.0.0.1 --port 5173
```

## Architecture

- **Monorepo**: `backend/` (Python FastAPI) + `frontend/` (React/Vite). No workspace tooling at root.
- **Vite proxy**: Frontend proxies `/api/*` to backend (configured in `frontend/vite.config.js`). Frontend uses relative URLs.
- **SQLite**: `backend/weather.db`, auto-created on startup via `init_db()` in `backend/app/main.py`. Path controlled by `DATABASE_PATH` env var. Snapshot pattern — refresh overwrites the row, no history.
- **External API**: `api-open.data.gov.sg` — no API key required. Optional `WEATHER_API_KEY` env var sent as `x-api-key` header.

## Backend (Python 3.11 + FastAPI)

- **Package manager**: `uv` (not pip). `uv sync` to install, `uv run` to execute.
- **Lint**: `ruff` configured in `pyproject.toml` (target py311, line-length 100, rules E/F/I/UP).
  ```bash
  cd backend && uv run ruff check . && uv run ruff format --check .
  ```
- **App entrypoint**: `app.main:app` — imports router from `app.routers.locations`.
- **No test framework** is configured. If adding tests, check what the student has set up first.

## Frontend (React 18 + Vite + Tailwind)

- **No lint, typecheck, or test scripts** in package.json. Only `dev`, `build`, `preview`.
- **Tailwind CSS v3** with PostCSS. All styling is utility classes in JSX — no component libraries.
- **State management**: React Context (`useLocations` hook in `src/hooks/useLocations.jsx`).
- **Env config**: `VITE_BACKEND_PORT` (default 8000) or `VITE_API_TARGET` for proxy target. See `frontend/.env.local.example`.

## Key Conventions

- Singapore coordinates only: lat 1.1–1.5, lon 103.6–104.1 (validated in `locations.py`).
- Location duplicates rejected via SQLite `UNIQUE(latitude, longitude)` — returns 409.
- Backend must be run from `backend/` directory (relative `weather.db` path and `uv` config).
- Root `package-lock.json` is empty (no root workspace) — real deps live in `frontend/`.

## Flox Services

| Service | Command | Port |
|---------|---------|------|
| backend | `uv run uvicorn app.main:app --reload` | 8000 |
| frontend | `npm run dev -- --host 127.0.0.1` | 5173 |

Ports configured in `.flox/env/manifest.toml` (`BACKEND_PORT`, `FRONTEND_PORT`).

## Observability

- Backend structured logs: `backend/logs/app.log` (JSON, one object per line)
- Frontend structured logs: Browser console (JSON via `console.log`)
- Use `jq` to filter backend logs: `cat backend/logs/app.log | jq 'select(.level == "error")'`

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands or refer to the agent-browser skill.
