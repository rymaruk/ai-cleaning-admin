-- AI Agent Query Logs: table and RLS for analytics and auditing
-- Run with: supabase db push (or apply via Supabase Dashboard SQL editor)

CREATE TABLE IF NOT EXISTS public.ai_agent_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  query_text text NOT NULL,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for common analytics queries (by user, by time)
CREATE INDEX IF NOT EXISTS idx_ai_agent_query_logs_user_id
  ON public.ai_agent_query_logs (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_agent_query_logs_created_at
  ON public.ai_agent_query_logs (created_at DESC);

-- Optional: composite index for "recent logs for user"
CREATE INDEX IF NOT EXISTS idx_ai_agent_query_logs_user_created
  ON public.ai_agent_query_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.ai_agent_query_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read only their own logs
CREATE POLICY "Users can read own ai_agent_query_logs"
  ON public.ai_agent_query_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: service role can insert (used by Next.js API / server)
-- Service role bypasses RLS by default; this policy documents intent.
-- No INSERT for anon/authenticated so client cannot freely insert.
CREATE POLICY "Service role can insert ai_agent_query_logs"
  ON public.ai_agent_query_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Optional: service role full access for admin/analytics
CREATE POLICY "Service role can read all ai_agent_query_logs"
  ON public.ai_agent_query_logs
  FOR SELECT
  TO service_role
  USING (true);

COMMENT ON TABLE public.ai_agent_query_logs IS 'Logs of AI agent search queries for analytics and auditing. Inserts via service role only.';
