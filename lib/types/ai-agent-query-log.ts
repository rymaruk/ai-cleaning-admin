/**
 * Types for ai_agent_query_logs table (Supabase).
 * Used for server-side logging of AI agent queries.
 */

export type AiAgentQueryLogRow = {
  id: string;
  user_id: string | null;
  query_text: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type AiAgentQueryLogInsert = {
  user_id?: string | null;
  query_text: string;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};
