# Fixr Data Model (MVP)

This doc defines the **minimum** data model needed for Fixr’s MVP:
Create report → generate draft → save → share link → map pins.

---

## `reports` collection

### Report document

```json
{
  "_id": "ObjectId",
  "issueType": "pothole | illegal_dumping | broken_streetlight | flooding | blocked_sidewalk | other",
  "severity": "low | medium | high",
  "descriptionUser": "string (optional)",
  "descriptionFinal": "string (required)",
  "location": {
    "type": "Point",
    "coordinates": [-122.27, 37.80]  // [lng, lat]
  },
  "approxLocation": false,
  "photo": {
    "url": "string (optional)",
    "stored": false
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Field notes
- **location** must always be stored as GeoJSON Point with `[lng, lat]` order.
- **approxLocation** indicates whether coordinates have been rounded (privacy mode).
- **photo.stored** is `false` by default; only true if the user explicitly opts in.

---

## Indexes (recommended)

### Geo index (map pins)
Create a `2dsphere` index on `location`:

- `location: "2dsphere"`

### Time sorting (recent reports)
- `createdAt: -1`

### Optional: TTL (privacy / storage control)
If you ever store images or want auto-expiration:
- TTL index on `createdAt` or a separate `expiresAt` field.

---

## Validation rules (MVP)
- `issueType` required
- `severity` required
- `descriptionFinal` required (generated via AI or fallback template)
- `location.coordinates` required, valid ranges:
  - `-180 <= lng <= 180`
  - `-90 <= lat <= 90`
- `photo.url` optional; if present, should be an allowed domain (S3/Cloudinary) and sanitized

---

## Seed data strategy (for demos)
Seed 10–30 reports around your demo area so the map never looks empty:
- mix 3–5 categories
- spread points across 1–2 miles
- include a few “fresh” timestamps (last 24 hours)
