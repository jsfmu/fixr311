import { NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/lib/ai/openai";
import {
  StructuredDraft,
  buildStructuredTemplateDraft,
} from "@/lib/draft";
import { ISSUE_TYPES, SEVERITIES } from "@/lib/types";

const DraftSchema = z.object({
  title: z.string().max(80),
  summary: z.string().min(1),
  details: z.string().min(1),
  requested_action: z.string().min(1),
  safety_note: z.string(),
  suggested_issue_type: z.string(),
  suggested_severity: z.enum(SEVERITIES),
  tags: z.array(z.string()).max(6),
});

const GenerateRequestSchema = z.object({
  issueType: z.enum(ISSUE_TYPES),
  severity: z.enum(SEVERITIES),
  notes: z.string().optional().default(""),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      approx: z.boolean().optional().default(false),
    })
    .optional(),
  crossStreet: z.string().optional(),
  landmark: z.string().optional(),
});

type FallbackReason = "missing_api_key" | "timeout" | "openai_error" | null;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const location = input.location ?? { lat: 0, lng: 0, approx: false };
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const templateDraft = buildStructuredTemplateDraft({
    issueType: input.issueType,
    severity: input.severity,
    descriptionUser: input.notes,
    locationText: input.crossStreet || input.landmark,
    approxLocation: location.approx,
    location,
  });

  if (!openai) {
    return NextResponse.json({
      usedAI: false,
      draft: templateDraft,
      fallbackReason: "missing_api_key" as FallbackReason,
      model: null,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await openai.responses.parse({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a civic 311 report writer. Produce clear, neutral, actionable text. No PII. No blame. Keep concise.",
        },
        {
          role: "user",
          content: [
            `Issue type: ${input.issueType}`,
            `Severity: ${input.severity}`,
            `Notes: ${input.notes || "unspecified"}`,
            `Approximate location: ${location.approx ? "yes" : "no"}`,
            `Lat: ${location.lat}`,
            `Lng: ${location.lng}`,
            input.crossStreet ? `Cross/landmark: ${input.crossStreet}` : "",
            input.landmark ? `Landmark: ${input.landmark}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: zodResponseFormat(DraftSchema, "draft"),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const aiDraft = response.output;
    const validated = DraftSchema.safeParse(aiDraft);
    if (!validated.success) {
      throw new Error("AI draft failed schema validation");
    }

    return NextResponse.json({
      usedAI: true,
      draft: validated.data,
      fallbackReason: null as FallbackReason,
      model,
    });
  } catch (error: any) {
    const reason: FallbackReason =
      error?.name === "AbortError" ? "timeout" : "openai_error";

    return NextResponse.json({
      usedAI: false,
      draft: templateDraft,
      fallbackReason: reason,
      model,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

