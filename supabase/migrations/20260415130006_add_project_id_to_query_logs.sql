-- Add project_id to ai_agent_query_logs for multi-tenant log scoping
-- Nullable for backwards compatibility (legacy widget has no project)

ALTER TABLE public.ai_agent_query_logs
  ADD COLUMN IF NOT EXISTS project_id uuid NULL
  REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_agent_query_logs_project_id
  ON public.ai_agent_query_logs (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_agent_query_logs_project_created
  ON public.ai_agent_query_logs (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

-- Users can read logs for their own projects
CREATE POLICY "Users can read own project query logs"
  ON public.ai_agent_query_logs FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  );
