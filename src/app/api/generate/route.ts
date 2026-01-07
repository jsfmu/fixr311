import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/draft";
import {
  normalizeIssueType,
  normalizeSeverity,
  sanitizeString,
} from "@/lib/validation";

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const issueType = normalizeIssueType(body.issueType);
  const severity = normalizeSeverity(body.severity);

  if (!issueType || !severity) {
    return NextResponse.json(
      { error: "issueType and severity are required" },
      { status: 400 },
    );
  }

  const descriptionUser = sanitizeString(body.descriptionUser);
  const locationText = sanitizeString(body.locationText);

  const { draft, source } = await generateDraft({
    issueType,
    severity,
    descriptionUser,
    locationText,
    approxLocation: Boolean(body.approxLocation),
  });

  return NextResponse.json({ draft, source });
}

