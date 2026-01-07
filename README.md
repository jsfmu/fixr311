# Fixr 311 MVP

Fixr is a lightweight prototype for drafting and sharing city-ready 311-style reports without logins or photo storage. It supports create → generate draft (with AI fallback) → save → share → map.

## Features
- Create reports with issue type, severity, notes, and a map pin (approx location toggle).
- Draft generation via `POST /api/generate`; always falls back to a template if AI is unavailable.
- Save reports to MongoDB with GeoJSON points, createdAt, and indexes (2dsphere + createdAt).
- Share page per report with copy/email actions and mini map.
- Map page pulls pins by bounding box (limit 200) with optional issue type filter.
- Seed script keeps the map non-empty with deterministic Alameda/Oakland samples.

## Getting Started
1) Install deps: `npm install`  
2) Set environment in `.env.local`:
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=fixr
REPORTS_COLLECTION=reports
# Optional AI:
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini
```
3) Run the app: `npm run dev` (http://localhost:3000)  
4) Seed demo data (optional, recommended): `npm run seed`

## Scripts
- `npm run dev` – Next.js dev server
- `npm run build` / `npm start` – production build & run
- `npm run lint` – lint with Next.js config
- `npm run seed` – insert deterministic sample reports (clears prior seed rows marked `[seed]`)

## API & Data Model
- Endpoints live under `src/app/api/*`. See `docs/api.md` for request/response examples.
- Data model + indexes: `docs/schema.md` (GeoJSON point, 2dsphere + createdAt indexes).
- Photos are not stored; backend forces `photo.stored=false`.

## Demo Flow
See `docs/demo.md` for the 2–3 minute walkthrough (Create → Generate → Save → Share → Map). Quick steps:
1) Go to `/create`, drop a pin (approx toggle optional), add issue type/severity/notes.
2) Click “Generate draft” (AI if configured, otherwise template) and edit as needed.
3) Save. You’ll be redirected to `/r/:id` with copy/email actions.
4) Open `/map` to confirm the new pin appears with existing seeded pins.

## Edge Cases / Safety
- Implemented: AI fallback template, location validation + rounding when approx, rate limiting on `POST /api/reports`, manual draft editing, emergency keyword banner, photo storage disabled.
- Planned (not yet built): duplicate detection, smart portal routing, classification suggestions.

## Notes
- No login or PII fields are collected.
- If AI times out/fails, server and UI both fall back to the template to keep the demo safe.
