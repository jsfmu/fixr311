# Fixr API (MVP)

This doc defines the **minimal** API surface for Fixr:
Create → share → map.

---

## Base assumptions
- JSON over HTTPS
- No login in MVP
- Basic abuse controls:
  - rate limit `POST /api/reports`
  - validate coordinates + required fields
- AI generation:
  - Either integrated into `POST /api/reports`
  - Or split into `POST /api/generate` (optional)

---

## 1) Create report

### `POST /api/reports`

Creates a report and returns the saved document + share URL.

**Request body**
```json
{
  "issueType": "pothole",
  "severity": "high",
  "descriptionUser": "Big pothole in right lane near the intersection.",
  "location": { "lng": -122.2711, "lat": 37.8044 },
  "approxLocation": false,
  "photo": {
    "url": null,
    "stored": false
  }
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
    "descriptionFinal": "…generated or templated text…",
    "location": { "lng": -122.2711, "lat": 37.8044 },
    "approxLocation": false,
    "photo": { "url": null, "stored": false },
    "createdAt": "2026-01-04T00:00:00.000Z"
  }
}
```

**Errors**
- `400` validation failure (missing fields, bad coords)
- `429` rate-limited
- `500` unexpected server error

**Implementation notes**
- If AI fails, generate a draft with the fallback template:
  - Use `issueType`, `severity`, `descriptionUser`, and (optional) a landmark field if you collect it
- If `approxLocation=true`, round coords (e.g., 3 decimals ~ 110m) before storing

---

## 2) Read single report (share page)

### `GET /api/reports/:id`

**Response (200)**
```json
{
  "id": "65f0c9f3c0a1b2c3d4e5f678",
  "issueType": "pothole",
  "severity": "high",
  "descriptionFinal": "…final draft…",
  "location": { "lng": -122.2711, "lat": 37.8044 },
  "approxLocation": false,
  "photo": { "url": null, "stored": false },
  "createdAt": "2026-01-04T00:00:00.000Z"
}
```

**Errors**
- `404` not found
- `400` invalid id

---

## 3) Map pins (bbox query)

### `GET /api/reports?bbox=west,south,east,north&type=pothole&days=7`

Example:
- `bbox=-122.30,37.78,-122.24,37.83`

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

**Rules**
- enforce a `limit` (e.g., 200)
- optionally cluster on client
- filter:
  - `type` optional
  - `days` optional (defaults to 30)

---

## Optional: AI-only endpoint (if you want it)

### `POST /api/generate`

**Request**
```json
{
  "issueType": "illegal_dumping",
  "severity": "medium",
  "descriptionUser": "Trash bags and a broken chair left by the curb.",
  "locationHint": "near the bus stop"
}
```

**Response**
```json
{ "descriptionFinal": "…draft…" }
```

**Why optional**
- You can keep the UI snappy by generating text before saving.
- Or keep it simple: generate during `POST /api/reports` and return the saved report.

---

## Rate limiting (recommended)
- Apply on `POST /api/reports`
- Example: 10 requests / 10 minutes per IP
- Store counters in memory for MVP; Redis for stretch

---

## “Copy / email / portal link” handoff (frontend behavior)
Fixr MVP does **not** need to auto-submit to city portals.
Instead provide:
- **Copy report** button (copies `descriptionFinal`)
- **Email draft** button (mailto with subject/body)
- **Open city portal** link (static link or best-guess)
