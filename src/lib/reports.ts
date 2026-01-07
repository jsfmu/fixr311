import { ObjectId } from "mongodb";
import { type ReportDoc, type ReportResponse } from "./types";

export function toReportResponse(doc: ReportDoc): ReportResponse {
  return {
    id: doc._id instanceof ObjectId ? doc._id.toHexString() : "",
    issueType: doc.issueType,
    severity: doc.severity,
    descriptionUser: doc.descriptionUser,
    descriptionFinal: doc.descriptionFinal,
    location: {
      lng: doc.location.coordinates[0],
      lat: doc.location.coordinates[1],
    },
    approxLocation: doc.approxLocation,
    photo: doc.photo,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toPin(doc: ReportDoc) {
  return {
    id: doc._id instanceof ObjectId ? doc._id.toHexString() : "",
    issueType: doc.issueType,
    severity: doc.severity,
    location: {
      lng: doc.location.coordinates[0],
      lat: doc.location.coordinates[1],
    },
    createdAt: doc.createdAt.toISOString(),
  };
}

