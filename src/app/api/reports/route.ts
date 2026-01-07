import { NextResponse } from "next/server";
import { getReportsCollection } from "@/lib/db";
import { generateDraft } from "@/lib/draft";
import { checkRateLimit } from "@/lib/rateLimit";
import { toPin, toReportResponse } from "@/lib/reports";
import { ISSUE_TYPES, type ReportDoc } from "@/lib/types";
import {
  buildReportDoc,
  parseBboxParam,
  validateReportBody,
} from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: rate.retryAfter
          ? { "Retry-After": rate.retryAfter.toString() }
          : undefined,
      },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateReportBody(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { issueType, severity, descriptionUser, approxLocation, location } =
    parsed.data;
  let descriptionFinal = parsed.data.descriptionFinal;

  if (!descriptionFinal) {
    const draft = await generateDraft({
      issueType,
      severity,
      descriptionUser,
      locationText: body?.locationText,
      approxLocation,
    });
    descriptionFinal = draft.draft;
  }

  const doc = buildReportDoc({
    issueType,
    severity,
    descriptionUser,
    descriptionFinal,
    location,
    approxLocation,
  });

  if (!doc) {
    return NextResponse.json(
      { error: "descriptionFinal is required" },
      { status: 400 },
    );
  }

  const collection = await getReportsCollection();
  const result = await collection.insertOne(doc);

  const saved: ReportDoc = { ...doc, _id: result.insertedId };

  return NextResponse.json(
    {
      id: result.insertedId.toHexString(),
      shareUrl: `/r/${result.insertedId.toHexString()}`,
      report: toReportResponse(saved),
    },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bboxParam = url.searchParams.get("bbox");
  const type = url.searchParams.get("type");
  const daysParam = url.searchParams.get("days");
  const limitParam = url.searchParams.get("limit");

  const bbox = parseBboxParam(bboxParam);
  if (!bbox.success) {
    return NextResponse.json({ error: bbox.error }, { status: 400 });
  }

  const query: Record<string, unknown> = {
    location: { $geoWithin: { $box: bbox.data } },
  };

  if (type && ISSUE_TYPES.includes(type as any)) {
    query.issueType = type;
  }

  const days = Number(daysParam || "30");
  if (Number.isFinite(days) && days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - Math.min(days, 365));
    query.createdAt = { $gte: since };
  }

  const parsedLimit = Number(limitParam);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 200)
      : 200;

  const collection = await getReportsCollection();
  const results = await collection
    .find(query, { projection: { descriptionFinal: 0, descriptionUser: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({
    results: results.map((doc) => toPin(doc)),
  });
}

function getIp(request: Request) {
  const header =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  return header.split(",")[0]?.trim() || "unknown";
}

