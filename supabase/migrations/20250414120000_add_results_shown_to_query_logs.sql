-- Add results_shown column to ai_agent_query_logs
-- Stores the products returned to the user as JSONB array
-- Each element: { id, name, brand, price, similarity, is_recommended }

ALTER TABLE public.ai_agent_query_logs
  ADD COLUMN IF NOT EXISTS results_shown jsonb NULL;

COMMENT ON COLUMN public.ai_agent_query_logs.results_shown
  IS 'JSONB array of products shown to the user. Each element: {id, name, brand, price, similarity, is_recommended}.';
