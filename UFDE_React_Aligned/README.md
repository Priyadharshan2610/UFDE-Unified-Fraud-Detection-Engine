# UFDE Frontend

React/Vite frontend aligned with the UFDE Spring Boot backend.

## Run

1. Start the Spring Boot backend on `http://localhost:8080`.
2. Run:
   `npm install`
   `npm run dev`

Vite proxies `/api/*` to the backend, so the browser does not need a CORS configuration for local development.

## Backend endpoint used

`POST /api/ingest/unified`

Multipart fields:
- `adaptiveFile`
- `fundFlowFile`
- `phishingFile`

The frontend validates the file extension and basic structure before sending the files.

## Current frontend storage

Successful analysis results are stored in browser `localStorage` under `ufdeTransactions` so the dashboard can immediately display the results without requiring a GET transaction endpoint.

The backend remains the source of truth for scoring and MySQL persistence.

## Demo login

- admin / admin123
- user / user123

The login is currently frontend-only. Real authentication/RBAC should be connected to Spring Security in the backend later.
