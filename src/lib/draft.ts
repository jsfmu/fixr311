import { IssueType, Severity } from "./types";

const AI_TIMEOUT_MS = 10_000;

export interface DraftRequest {
  issueType: IssueType;
  severity: Severity;
  descriptionUser?: string;
  locationText?: string;
  approxLocation?: boolean;
}

export async function generateDraft(
  input: DraftRequest,
): Promise<{ draft: string; source: "ai" | "template" }> {
  const template = buildTemplateDraft(input);
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXOS_API_KEY;

  if (!apiKey) {
    return { draft: template, source: "template" };
  }

  try {
    const aiDraft = await withTimeout(
      aiGenerate(input, apiKey),
      AI_TIMEOUT_MS,
      "AI timed out",
    );
    if (aiDraft) {
      return { draft: aiDraft, source: "ai" };
    }
  } catch (error) {
    console.warn("AI draft failed, falling back to template", error);
  }

  return { draft: template, source: "template" };
}

async function aiGenerate(input: DraftRequest, apiKey: string) {
  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write concise, city-ready incident reports. Use only the provided details. Do not invent measurements. If information is missing, say it is approximate or unspecified. Keep to 3-6 sentences, respectful and actionable.",
      },
      {
        role: "user",
        content: [
          `Issue type: ${input.issueType}`,
          `Severity: ${input.severity}`,
          `Notes from reporter: ${input.descriptionUser || "unspecified"}`,
          `Location hint: ${input.locationText || "pin provided on map"}`,
          `Approximate location: ${input.approxLocation ? "yes" : "no"}`,
        ].join("\n"),
      },
    ],
    temperature: 0.4,
    max_tokens: 240,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  return content?.trim();
}

export function buildTemplateDraft({
  issueType,
  severity,
  descriptionUser,
  locationText,
  approxLocation,
}: DraftRequest): string {
  const readableIssue = issueType.replace("_", " ");
  const notes = descriptionUser
    ? `Reporter notes: ${descriptionUser}`
    : "Reporter notes: none provided.";
  const location = locationText
    ? `Location: ${locationText}.`
    : "Location: see pinned coordinates.";
  const privacy = approxLocation
    ? "Location was rounded for privacy; crews may need to confirm on arrival."
    : "Location is as pinned by the reporter.";

  return [
    `Report of ${readableIssue} at the pinned location.`,
    `Severity marked as ${severity}.`,
    notes,
    location,
    "Please inspect and address; photo not stored in this MVP.",
    privacy,
  ].join(" ");
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  return result;
}

