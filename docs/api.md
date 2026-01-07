# Fixr API (MVP)

Source of truth for the shipped endpoints (Create → Share → Map).

---

## Base rules
- JSON over HTTPS, no auth in MVP.
- Photo uploads are ignored; backend forces `photo: { url: null, stored: false }`.
- `approxLocation=true` rounds coords to 3 decimals before storage.
- Rate limit: 10 requests / 10 minutes per IP on `POST /api/reports` (in-memory).

---

## 1) Create report — `POST /api/reports`
Validates and saves a report, returning the share URL.

**Body**
```json
{
  "issueType": "pothole",
  "severity": "high",
  "descriptionUser": "Big pothole in right lane near the intersection.",
  "descriptionFinal": "optional; server falls back to template if blank",
  "location": { "lng": -122.2711, "lat": 37.8044 },
  "approxLocation": false
}
```

**Response (201)**
```json
{
  "id": "65f0c9f3c0a1b2c3d4e5f678",
  "shareUrl": "/r/65f0c9f3c0a1b2c3d4e5f678",
  "report": {
    "issueType": "pothole",
    "severity": "high",
    "descriptionFinal": "…generated or template text…",
    "descriptionUser": "Big pothole in right lane near the intersection.",
    "location": { "lng": -122.2711, "lat": 37.8044 },
    "approxLocation": false,
    "photo": { "url": null, "stored": false },
    "createdAt": "2026-01-04T00:00:00.000Z"
  }
}
```

**Validation**
- issueType + severity required (see `docs/schema.md` values)
- location required, lng [-180, 180], lat [-90, 90]
- descriptionFinal required; if missing/blank the server auto-builds a template draft
- approxLocation rounds coords to 3 decimals before insert

**Errors**
- 400 validation failure
- 429 rate limited
- 500 unexpected

---

## 2) Read single — `GET /api/reports/:id`
Returns a sanitized report for the share page.

**Response (200)**
```json
{
  "id": "65f0c9f3c0a1b2c3d4e5f678",
  "issueType": "pothole",
  "severity": "high",
  "descriptionFinal": "…final draft…",
  "descriptionUser": "Big pothole in right lane near the intersection.",
  "location": { "lng": -122.2711, "lat": 37.8044 },
  "approxLocation": false,
  "photo": { "url": null, "stored": false },
  "createdAt": "2026-01-04T00:00:00.000Z"
}
```

**Errors**
- 400 invalid id
- 404 not found

---

## 3) Map pins — `GET /api/reports?bbox=west,south,east,north&type=pothole&days=7`
Returns only the fields needed for pins. Example: `bbox=-122.30,37.78,-122.24,37.83`

**Query params**
- `bbox` (required): `minLng,minLat,maxLng,maxLat`
- `type` (optional): filter by issueType
- `days` (optional): default 30, max 365
- `limit` (optional): max 200 (defaults to 200)

**Response (200)**
```json
{
  "results": [
    {
      "id": "65f0c9f3c0a1b2c3d4e5f678",
      "issueType": "pothole",
      "severity": "high",
      "location": { "lng": -122.2711, "lat": 37.8044 },
      "createdAt": "2026-01-04T00:00:00.000Z"
    }
  ]
}
```

---

## 4) Draft only — `POST /api/generate`
Optional helper used by the UI; always falls back to the template if AI fails or is not configured.

**Body**
```json
{
  "issueType": "illegal_dumping",
  "severity": "medium",
  "descriptionUser": "Trash bags and a broken chair left by the curb.",
  "locationText": "near the bus stop",
  "approxLocation": false
}
```

**Response**
```json
{ "draft": "…city-ready draft…", "source": "ai | template" }
```

**Timeouts**
- AI calls are capped at ~10s; template is returned on timeout/error.

---

## Handoff (frontend behavior)
- Share page: Copy draft, email draft (mailto), link to `/map`.
- No portal auto-submit in this MVP.
