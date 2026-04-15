-- Subscriptions: links a project to a plan with start/expiry dates

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_project_expires
  ON public.subscriptions (project_id, expires_at DESC);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read subscriptions for their own projects
CREATE POLICY "Users can read own project subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  );

-- Users can insert subscriptions for their own projects
CREATE POLICY "Users can insert own project subscriptions"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  );

CREATE POLICY "Service role full access on subscriptions"
  ON public.subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
