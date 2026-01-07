import { ObjectId } from "mongodb";

export const ISSUE_TYPES = [
  "pothole",
  "illegal_dumping",
  "broken_streetlight",
  "flooding",
  "blocked_sidewalk",
  "other",
] as const;

export const SEVERITIES = ["low", "medium", "high"] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type Severity = (typeof SEVERITIES)[number];

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface PhotoInfo {
  url?: string | null;
  stored: boolean;
}

export interface ReportDoc {
  _id?: ObjectId;
  issueType: IssueType;
  severity: Severity;
  descriptionUser?: string;
  descriptionFinal: string;
  location: GeoPoint;
  approxLocation: boolean;
  photo: PhotoInfo;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReportResponse {
  id: string;
  issueType: IssueType;
  severity: Severity;
  descriptionUser?: string;
  descriptionFinal: string;
  location: { lng: number; lat: number };
  approxLocation: boolean;
  photo: PhotoInfo;
  createdAt: string;
}

export const DEFAULT_PHOTO: PhotoInfo = { url: null, stored: false };

