import { getSupabaseClient } from "@/lib/clients/supabase";
import type { AiAgentQueryLogInsert, ResultShownItem } from "@/lib/types/ai-agent-query-log";

const MAX_QUERY_LENGTH = 10_000;
const MAX_METADATA_KEYS = 50;

/**
 * Sanitizes query text for logging: trim, limit length, reject empty.
 * Returns null if the query should not be logged.
 */
export function sanitizeQueryText(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > MAX_QUERY_LENGTH ? trimmed.slice(0, MAX_QUERY_LENGTH) : trimmed;
}

/**
 * Sanitizes metadata for logging: ensure plain object, limit keys.
 */
function sanitizeMetadata(meta: unknown): Record<string, unknown> {
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) {
    return {};
  }
  const obj = meta as Record<string, unknown>;
  const keys = Object.keys(obj).slice(0, MAX_METADATA_KEYS);
  const result: Record<string, unknown> = {};
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || (typeof v === "object" && v !== null && !Array.isArray(v)))) {
      result[k] = v;
    }
  }
  return result;
}

export type InsertAiAgentQueryLogParams = {
  queryText: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  resultsShown?: ResultShownItem[] | null;
};

/**
 * Inserts a single row into ai_agent_query_logs. Server-side only (uses service role).
 * Does not log empty or invalid queries; returns false when skipped.
 */
export async function insertAiAgentQueryLog(params: InsertAiAgentQueryLogParams): Promise<boolean> {
  const queryText = sanitizeQueryText(params.queryText);
  if (!queryText) return false;

  const row: AiAgentQueryLogInsert = {
    query_text: queryText,
    user_id: params.userId ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    metadata: params.metadata ? sanitizeMetadata(params.metadata) : {},
    results_shown: params.resultsShown ?? null,
  };

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("ai_agent_query_logs").insert(row);

  if (error) {
    console.error("[log-ai-query] Insert failed:", error.message);
    return false;
  }
  return true;
}
