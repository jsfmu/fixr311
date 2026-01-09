import OpenAI from "openai";

/**
 * Server-only OpenAI client.
 * Returns null when no API key is configured so callers can safely fall back.
 */
export const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;


