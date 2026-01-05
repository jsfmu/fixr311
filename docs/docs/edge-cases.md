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

## Fallback template example
**Pothole**
“Reported a pothole at the pinned location. Severity: {severity}. {userNotes}. This appears to be a road hazard; please inspect and repair.”

## Coordinate rounding (approx mode)
- round to 3 decimals (~110m) or 4 decimals (~11m) depending on your privacy stance
