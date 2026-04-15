-- Admin email logs: tracks emails sent from the admin management panel

CREATE TABLE IF NOT EXISTS public.admin_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_email_logs_sent_at
  ON public.admin_email_logs (sent_at DESC);

ALTER TABLE public.admin_email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin panel uses service role key)
CREATE POLICY "Service role full access on admin_email_logs"
  ON public.admin_email_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
