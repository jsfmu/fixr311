"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { ISSUE_TYPES, type IssueType } from "@/lib/types";

const DEFAULT_CENTER = { lat: 37.7936, lng: -122.2655 };

type Pin = {
  id: string;
  issueType: IssueType;
  severity: string;
  location: { lat: number; lng: number };
  createdAt: string;
};

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapPage() {
  const [bbox, setBbox] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [issueFilter, setIssueFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bbox) return;
    const controller = new AbortController();
    const loadPins = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ bbox });
        if (issueFilter) params.set("type", issueFilter);
        const res = await fetch(`/api/reports?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load pins");
        }
        const data = await res.json();
        setPins(data.results || []);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err.message || "Unable to load pins");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPins();
    return () => controller.abort();
  }, [bbox, issueFilter]);

  const markerElements = useMemo(
    () =>
      pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.location.lat, pin.location.lng]}
          icon={markerIcon}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {pin.issueType.replace("_", " ")} · {pin.severity}
              </p>
              <p className="text-xs text-slate-600">
                {new Date(pin.createdAt).toLocaleString()}
              </p>
              <a
                href={`/r/${pin.id}`}
                className="text-indigo-700 underline"
              >
                View report
              </a>
            </div>
          </Popup>
        </Marker>
      )),
    [pins],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Map
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Live pins in the visible map window
          </h1>
          <p className="text-sm text-slate-600">
            Move or zoom the map to fetch new pins by bounding box. Limited to
            the most recent 200.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="issue" className="text-sm text-slate-700">
            Filter by type
          </label>
          <select
            id="issue"
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="text-sm"
          >
            <option value="">All</option>
            {ISSUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          className="h-[70vh] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsWatcher onChange={setBbox} />
          {markerElements}
        </MapContainer>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        {loading ? "Loading pins..." : `${pins.length} pins in view`}
        <span className="text-slate-400">·</span>
        <a href="/create" className="text-indigo-700 underline">
          Add a new report
        </a>
      </div>
    </div>
  );
}

function BoundsWatcher({ onChange }: { onChange: (bbox: string) => void }) {
  const map = useMap();

  useEffect(() => {
    const emitBounds = () => {
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ].join(",");
      onChange(bbox);
    };

    emitBounds();
    map.on("moveend", emitBounds);
    return () => {
      map.off("moveend", emitBounds);
    };
  }, [map, onChange]);

  return null;
}

