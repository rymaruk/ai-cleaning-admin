/**
 * Types for ai_agent_query_logs table (Supabase).
 * Used for server-side logging of AI agent queries.
 */

export type ResultShownItem = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  similarity: number | null;
  is_recommended: boolean;
};

export type AiAgentQueryLogRow = {
  id: string;
  user_id: string | null;
  query_text: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  results_shown: ResultShownItem[] | null;
};

export type AiAgentQueryLogInsert = {
  user_id?: string | null;
  query_text: string;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  results_shown?: ResultShownItem[] | null;
};
