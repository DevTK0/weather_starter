# AGENTS.md

## Purpose

This repository is a small full-stack weather app used for agentic coding practice. Keep changes narrow, readable, and easy for students to follow. Prefer simple implementations over abstracted frameworks.

## Project Snapshot

- Stack: FastAPI + sqlite3 backend, React + Vite + Tailwind frontend
- External API: data.gov.sg weather endpoints
- Runtime model: frontend talks to FastAPI over `/api`; backend stores weather snapshots in SQLite
- Dev environment: prefer Flox when available, otherwise run backend and frontend separately

## Run Commands

Preferred environment:

```bash
flox activate
flox services start
```

## Working Agreement

- Preserve the current architecture and API behavior unless the task explicitly requires a change.
- Keep implementations explicit and local; avoid broad abstractions or refactors without a clear payoff.
- Do not add new libraries unless the existing stack is clearly insufficient.
- Read the relevant files before editing and do not revert unrelated user changes.
- Update documentation when setup, architecture, or workflows materially change.

## Detailed Guidance

- Backend specifics: [docs/backend.md](docs/backend.md)
- Frontend specifics: [docs/frontend.md](docs/frontend.md)

## Validation

- Backend-only changes: run at least `cd backend && uv run python -m compileall app`
- Frontend-only changes: run at least `cd frontend && npm run build`
- Cross-stack changes: validate both sides when feasible
- If a check cannot be run, say so explicitly in the handoff
