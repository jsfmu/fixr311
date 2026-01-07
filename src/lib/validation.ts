import { DEFAULT_PHOTO, ISSUE_TYPES, SEVERITIES, type GeoPoint, type IssueType, type ReportDoc, type Severity } from "./types";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ValidatedReportInput {
  issueType: IssueType;
  severity: Severity;
  descriptionUser?: string;
  descriptionFinal?: string;
  location: { lng: number; lat: number };
  approxLocation: boolean;
}

export function validateReportBody(body: any): ValidationResult<ValidatedReportInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid JSON body" };
  }

  const issueType = normalizeIssueType(body.issueType);
  if (!issueType) return { success: false, error: "issueType is required" };

  const severity = normalizeSeverity(body.severity);
  if (!severity) return { success: false, error: "severity is required" };

  const location = parseLocation(body.location);
  if (!location.success) return location;

  const approxLocation = Boolean(body.approxLocation);
  const descriptionUser = sanitizeString(body.descriptionUser);
  const descriptionFinal = sanitizeString(body.descriptionFinal);

  return {
    success: true,
    data: {
      issueType,
      severity,
      descriptionUser,
      descriptionFinal,
      location: location.data,
      approxLocation,
    },
  };
}

export function parseLocation(
  location: any,
): ValidationResult<{ lng: number; lat: number }> {
  if (!location || typeof location !== "object") {
    return { success: false, error: "location is required" };
  }
  const lng = toNumber(location.lng);
  const lat = toNumber(location.lat);

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { success: false, error: "lng must be between -180 and 180" };
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { success: false, error: "lat must be between -90 and 90" };
  }

  return { success: true, data: { lng, lat } };
}

export function parseBboxParam(
  bbox: string | null,
): ValidationResult<[[number, number], [number, number]]> {
  if (!bbox) return { success: false, error: "bbox is required" };
  const parts = bbox.split(",").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isFinite(p))) {
    return { success: false, error: "bbox must be minLng,minLat,maxLng,maxLat" };
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng >= maxLng || minLat >= maxLat) {
    return { success: false, error: "bbox bounds are invalid" };
  }
  if (Math.abs(minLng) > 180 || Math.abs(maxLng) > 180) {
    return { success: false, error: "bbox lng out of range" };
  }
  if (Math.abs(minLat) > 90 || Math.abs(maxLat) > 90) {
    return { success: false, error: "bbox lat out of range" };
  }

  return {
    success: true,
    data: [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
  };
}

export function toGeoPoint({
  lng,
  lat,
}: {
  lng: number;
  lat: number;
}): GeoPoint {
  return {
    type: "Point",
    coordinates: [lng, lat],
  };
}

export function applyApproxLocation(
  location: { lng: number; lat: number },
  approxLocation: boolean,
): { lng: number; lat: number } {
  if (!approxLocation) return location;
  return {
    lng: round(location.lng, 3),
    lat: round(location.lat, 3),
  };
}

export function normalizeIssueType(value: any): IssueType | null {
  if (!value || typeof value !== "string") return null;
  return ISSUE_TYPES.includes(value as IssueType) ? (value as IssueType) : null;
}

export function normalizeSeverity(value: any): Severity | null {
  if (!value || typeof value !== "string") return null;
  return SEVERITIES.includes(value as Severity) ? (value as Severity) : null;
}

export function sanitizeString(value: any): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function ensureDescription(description?: string, fallback?: string) {
  const value = sanitizeString(description) || sanitizeString(fallback);
  if (!value) return undefined;
  return value;
}

export function buildReportDoc(input: ValidatedReportInput): ReportDoc | null {
  const roundedLocation = applyApproxLocation(
    input.location,
    input.approxLocation,
  );
  const descriptionFinal = ensureDescription(
    input.descriptionFinal,
    input.descriptionUser,
  );
  if (!descriptionFinal) return null;

  return {
    issueType: input.issueType,
    severity: input.severity,
    descriptionUser: input.descriptionUser,
    descriptionFinal,
    location: toGeoPoint(roundedLocation),
    approxLocation: input.approxLocation,
    photo: DEFAULT_PHOTO,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function toNumber(value: any) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

