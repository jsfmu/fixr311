# Edge Cases & Mitigations

Keep this list short and real. Implement the top 4–6; document the rest.

| Risk / Edge case | Wrong outcome | Mitigation (MVP) |
|---|---|---|
| AI fails / times out | Draft step breaks demo & UX | Fallback template draft generator |
| GPS inaccurate / pin wrong | Crew goes to wrong place | Pin confirmation + edit; optional landmark field |
| Misclassification | Wrong department / slower fix | Manual override; show top suggestions (optional) |
| Duplicate spam | Map becomes noisy | Rate limit + (optional) duplicate warning |
| Emergency misuse | Delayed emergency response | Keyword banner: “Call 911” |
| Privacy leakage | Faces/plates/addresses exposed | No login/PII; photo storage off by default; EXIF strip if stored |
| Wrong jurisdiction | Report sent to wrong authority | “Handoff” model + portal link list (future) |

## Implemented in this repo
- AI fallback template in `/api/generate` and `/api/reports` (if draft missing or AI fails).
- Coordinate validation + rounding to 3 decimals when `approxLocation=true`.
- Rate limiting on `POST /api/reports` (10 per 10 minutes per IP, in-memory).
- Manual override: draft textarea stays editable before saving.
- Emergency keyword banner on Create form (fire, crash, injured, gun, stabbing, explosion, shooting, bleeding).
- Photo storage disabled end-to-end; backend forces `photo.stored=false`.

## Planned / not yet built
- Duplicate nearby detection.
- Smart portal routing/link suggestions.
- Classification suggestions beyond manual override.

## Fallback template example
**Pothole**
“Reported a pothole at the pinned location. Severity: {severity}. {userNotes}. This appears to be a road hazard; please inspect and repair.”

## Coordinate rounding (approx mode)
- round to 3 decimals (~110m) or 4 decimals (~11m) depending on your privacy stance
