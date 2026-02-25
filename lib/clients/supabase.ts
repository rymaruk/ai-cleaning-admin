import { createClient, SupabaseClient } from "@supabase/supabase-js";

let instance: SupabaseClient | null = null;

/**
 * Server-only Supabase client (service role). Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env.
 */
export function getSupabaseClient(): SupabaseClient {
  if (instance) return instance;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  instance = createClient(url, serviceRoleKey);
  return instance;
}
