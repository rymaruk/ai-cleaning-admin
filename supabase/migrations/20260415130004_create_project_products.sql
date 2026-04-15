-- Project products: user-uploaded product data with embeddings for AI search
-- Common columns mapped from user's file + extra_data JSONB for unmapped columns

CREATE TABLE IF NOT EXISTS public.project_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  external_id text,
  name text,
  description text,
  brand text,
  category text,
  price numeric,
  currency text,
  url text,
  images text[],
  extra_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding_text text,
  embedding vector(3072),
  embedding_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_products_project_id
  ON public.project_products (project_id);

CREATE INDEX idx_project_products_project_embedded
  ON public.project_products (project_id)
  WHERE embedding IS NOT NULL;

ALTER TABLE public.project_products ENABLE ROW LEVEL SECURITY;

-- Users can read products for their own projects
CREATE POLICY "Users can read own project products"
  ON public.project_products FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  );

CREATE POLICY "Service role full access on project_products"
  ON public.project_products FOR ALL TO service_role
  USING (true) WITH CHECK (true);
