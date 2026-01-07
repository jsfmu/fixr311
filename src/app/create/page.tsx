"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildTemplateDraft } from "@/lib/draft";
import { ISSUE_TYPES, SEVERITIES, type IssueType, type Severity } from "@/lib/types";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
});

const DEFAULT_CENTER = { lat: 37.7936, lng: -122.2655 }; // Alameda / Oakland area
const EMERGENCY_WORDS = [
  "fire",
  "crash",
  "injured",
  "gun",
  "stabbing",
  "explosion",
  "shooting",
  "bleeding",
];

export default function CreatePage() {
  const router = useRouter();
  const [issueType, setIssueType] = useState<IssueType>("pothole");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [descriptionUser, setDescriptionUser] = useState("");
  const [descriptionFinal, setDescriptionFinal] = useState("");
  const [approxLocation, setApproxLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [photoName, setPhotoName] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSource, setDraftSource] = useState<"ai" | "template" | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // ignore geolocation errors; default center is used
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  const emergencyWarning = useMemo(() => {
    const text = descriptionUser.toLowerCase();
    return EMERGENCY_WORDS.some((word) => text.includes(word));
  }, [descriptionUser]);

  const confirmPinText = approxLocation
    ? "Pin rounded for privacy (~3 decimals)."
    : "Pin saved exactly as placed.";

  const locationText = approxLocation
    ? "approximate pin near selected area"
    : "pin dropped on map";

  const handleGenerate = async () => {
    setLoadingDraft(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          severity,
          descriptionUser,
          locationText,
          approxLocation,
        }),
      });
      if (!res.ok) throw new Error("Draft generation failed");
      const data = await res.json();
      setDescriptionFinal(data.draft);
      setDraftSource(data.source || "ai");
    } catch (err) {
      console.error(err);
      const fallback = buildTemplateDraft({
        issueType,
        severity,
        descriptionUser,
        locationText,
        approxLocation,
      });
      setDescriptionFinal(fallback);
      setDraftSource("template");
      setError("Draft generation failed; used fallback template.");
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!location) {
      setError("Please drop a pin on the map first.");
      return;
    }

    const finalText =
      descriptionFinal.trim() ||
      buildTemplateDraft({
        issueType,
        severity,
        descriptionUser,
        locationText,
        approxLocation,
      });

    try {
      setSaving(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          severity,
          descriptionUser: descriptionUser || undefined,
          descriptionFinal: finalText,
          location,
          approxLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save report");
      }

      const data = await res.json();
      router.push(`/r/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create report
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Pin the issue, draft text, and save a shareable report.
          </h1>
        </div>
        {draftSource ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Draft source: {draftSource}
          </span>
        ) : null}
      </div>

      {emergencyWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          Emergency keywords detected. For emergencies call 911 instead of using
          this form.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="issueType">Issue Type</label>
                <select
                  id="issueType"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as IssueType)}
                >
                  {ISSUE_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="severity">Severity</label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                >
                  {SEVERITIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes">Short notes (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={descriptionUser}
                onChange={(e) => setDescriptionUser(e.target.value)}
                placeholder="Example: Large pothole in right lane near Broadway."
              />
              <p className="text-xs text-slate-500">
                Notes stay editable and are used by the draft generator.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="photo">Photo upload (optional)</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPhotoName(e.target.files?.[0]?.name || "Not stored")
                }
              />
              <p className="text-xs text-slate-500">
                Photos are not stored in this MVP. {photoName || "Choose a file"}{" "}
                stays local to your device.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="approx"
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={approxLocation}
                onChange={(e) => setApproxLocation(e.target.checked)}
              />
              <label htmlFor="approx">
                Approximate location (round coordinates for privacy)
              </label>
            </div>
            <p className="text-xs text-slate-500">{confirmPinText}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label>Choose location</label>
              <p className="text-xs text-slate-500">
                Click map to place / move pin. Confirm before saving.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <LocationPicker
                value={location}
                onChange={(coords) => setLocation(coords)}
                defaultCenter={DEFAULT_CENTER}
              />
            </div>
            <p className="text-xs text-slate-500">
              Default center tries your browser location; falls back to Alameda /
              Oakland.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="draft">Report draft</label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loadingDraft}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed"
            >
              {loadingDraft ? "Generating..." : "Generate draft"}
            </button>
          </div>
          <textarea
            id="draft"
            rows={6}
            value={descriptionFinal}
            onChange={(e) => setDescriptionFinal(e.target.value)}
            placeholder="Draft text will appear here. You can edit it before saving."
          />
          <p className="text-xs text-slate-500">
            You can always edit the draft. If AI is unavailable, a fallback template
            is used automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Saving stores only text and map pin. No login and no PII fields.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loadingDraft}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              {loadingDraft ? "Working..." : "Regenerate"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save report"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

