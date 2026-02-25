import OpenAI from "openai";

let instance: OpenAI | null = null;

/**
 * Server-only OpenAI client (text-embedding-3-large). Uses OPENAI_API_KEY from env.
 */
export function getOpenAIClient(): OpenAI {
  if (instance) return instance;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  instance = new OpenAI({ apiKey });
  return instance;
}
