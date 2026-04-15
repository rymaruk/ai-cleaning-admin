-- Subscription plans available to projects

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  duration_days int NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'UAH',
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can read active plans
CREATE POLICY "Anyone can read active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access on subscription_plans"
  ON public.subscription_plans FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Seed default plans
INSERT INTO public.subscription_plans (name, slug, description, duration_days, price, currency, features) VALUES
  ('Free Trial', 'free_trial', 'Безкоштовний пробний період на 14 днів', 14, 0, 'UAH', '{"max_products": 100}'::jsonb),
  ('Pro', 'pro', 'Професійний план на 30 днів', 30, 499, 'UAH', '{"max_products": 1000}'::jsonb),
  ('Business', 'business', 'Бізнес план на 90 днів', 90, 1299, 'UAH', '{"max_products": 10000}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
