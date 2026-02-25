# Frontend Guide

## Scope

Use this guide when working in `frontend/` or when a task changes state management, UI composition, or API integration from the browser.

## Stack And Structure

- React 18
- Vite
- Tailwind CSS

Primary files:

- `frontend/src/api/`: fetch helpers and API wrappers
- `frontend/src/hooks/useLocations.jsx`: shared location state and async actions
- `frontend/src/components/`: UI components for forms and lists
- `frontend/src/pages/Dashboard.jsx`: main page composition

## Current Frontend Model

- The frontend talks to the backend over relative `/api` requests.
- Shared location state lives inside the existing context and hook pattern.
- Presentational components are kept small and focused.
- Loading, error, and empty states are explicit in the UI.

## Working Rules

- Follow the existing function-component style and named exports.
- Keep data fetching inside `frontend/src/api/` and `frontend/src/hooks/`, not directly inside presentational components unless the change is trivial and local.
- Preserve Tailwind utility styling and avoid introducing a component library.
- Prefer small, composable components over one large page component.
- Keep user-facing flows easy to trace from component to hook to API helper.

## UI And State Notes

- `Dashboard.jsx` composes the page.
- `LocationForm.jsx` handles location creation inputs and local form state.
- `LocationList.jsx` renders persisted locations and refresh actions.
- `useLocations.jsx` owns list loading and mutation refresh behavior.

## Validation

Minimum check:

```bash
cd frontend && npm run build
```

If a change affects runtime behavior, prefer validating in the dev server too.