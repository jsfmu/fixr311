# Fixr 311 (MVP)

Fixr is a lightweight prototype for drafting and sharing **city-ready 311-style reports** — **no logins** and **no photo storage**.  
Flow: **Create → Generate draft (AI + template fallback) → Save → Share → Map**

## Highlights
- Anonymous 311-style reporting with **issue type**, **severity**, **notes**, and a **map pin**
- Optional **approx location** toggle (rounding/validation applied when enabled)
- Draft generation via `POST /api/generate`:
  - Uses AI if configured
  - **Always falls back to a template** if AI is unavailable/timeouts
- MongoDB storage with **GeoJSON Point**, `createdAt`, and indexes (**2dsphere** + `createdAt`)
- Shareable report page (`/r/:id`) with copy/email actions and mini map
- Map view (`/map`) fetches pins by **bounding box** (max **200** results) with optional issue-type filtering
- Deterministic seed script populates Alameda/Oakland sample reports so demos are never empty

---

## Tech Stack
- **Next.js** (App Router)
- **MongoDB Atlas** (GeoJSON + 2dsphere)
- Optional **OpenAI** for draft generation (safe fallback built-in)

---

## Quickstart

### 1) Install dependencies

    npm install

### 2) Configure environment

Create `.env.local` at the project root:

    MONGODB_URI=mongodb+srv://...
    MONGODB_DB=fixr
    REPORTS_COLLECTION=reports

    # Optional (AI draft generation)
    OPENAI_API_KEY=your-key
    OPENAI_MODEL=gpt-4o-mini

> If your MongoDB password contains special characters (like `@ : / ? #`), URL-encode it.

### 3) Run the app

    npm run dev

Open: http://localhost:3000

### 4) Seed demo data (recommended)

    npm run seed

This inserts deterministic sample reports and clears prior seed docs labeled `[seed]`.

---

## Demo Flow (2–3 minutes)
Full walkthrough: `docs/demo.md`

1) Go to `/create` and drop a pin (approx toggle optional)  
2) Add issue type / severity / notes  
3) Click **Generate draft** (AI if configured, otherwise template fallback)  
4) Click **Save** → redirected to `/r/:id`  
5) Visit `/map` to see your report pin plus seeded pins

---

## Deployment (MVP)
Works on Vercel/Render/etc.

### Environment variables
Set the following on your host:
- `MONGODB_URI`
- `MONGODB_DB=fixr`
- `REPORTS_COLLECTION=reports`
- Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`

### Build & run

    npm run build
    npm start

### Post-deploy (optional)
Seed demo pins from your machine:

    npm run seed

### Smoke test checklist
- Create a report at `/create`
- Confirm share page `/r/:id` loads
- Confirm it appears on `/map` (bbox query, max 200 pins)

**Rate limiting:** in-memory (10 requests / 10 minutes / IP). Resets per instance restart.

---

## Scripts
- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm start` — run production build
- `npm run lint` — lint with Next.js config
- `npm run seed` — insert deterministic sample reports (clears prior `[seed]` docs)

---

## API & Data Model
- API routes: `src/app/api/*`
- Examples: `docs/api.md`
- Schema + indexes: `docs/schema.md`

**Data model notes**
- Reports store a GeoJSON `Point` + `createdAt`
- Indexes: `2dsphere` (location) and `createdAt` (sorting/filtering)
- Photos are not stored; backend enforces `photo.stored=false`

---

## Safety & Edge Cases
Implemented:
- AI failure/timeouts → template fallback (server + UI)
- Location validation + rounding when approx is enabled
- Rate limiting on `POST /api/reports`
- Manual draft editing before save
- Emergency keyword banner
- Photo storage disabled

Planned:
- Duplicate detection (nearby + same issue type)
- Status lifecycle (open → acknowledged → in-progress → resolved)
- Classification suggestions + portal routing

---

## Notes
- No login system and no explicit PII fields.
- Designed to be demo-safe: the app remains functional even when AI is unavailable.
