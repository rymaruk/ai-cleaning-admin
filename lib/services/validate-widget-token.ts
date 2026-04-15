import { getSupabaseClient } from "@/lib/clients/supabase";

export type TokenValidationResult =
  | {
      valid: true;
      projectId: string;
      siteUrl: string;
    }
  | {
      valid: false;
      reason:
        | "not_found"
        | "expired"
        | "no_subscription"
        | "domain_mismatch"
        | "no_products";
    };

/**
 * Validates a widget token by checking the project exists, has an active
 * non-expired subscription, has products with embeddings, and optionally
 * that the request origin matches the project's site_url.
 */
export async function validateWidgetToken(
  token: string,
  requestOrigin?: string | null
): Promise<TokenValidationResult> {
  const supabase = getSupabaseClient();

  // Look up project by token
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, site_url")
    .eq("widget_token", token)
    .single();

  if (projError || !project) {
    return { valid: false, reason: "not_found" };
  }

  // Check active subscription with future expiry
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, expires_at, status")
    .eq("project_id", project.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1);

  if (!subs || subs.length === 0) {
    return { valid: false, reason: "no_subscription" };
  }

  // Check project has at least one product with embedding
  const { count } = await supabase
    .from("project_products")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id)
    .not("embedding", "is", null);

  if (!count || count === 0) {
    return { valid: false, reason: "no_products" };
  }

  // Optional origin check
  if (requestOrigin) {
    try {
      const projectOrigin = new URL(project.site_url).origin;
      if (requestOrigin !== projectOrigin) {
        return { valid: false, reason: "domain_mismatch" };
      }
    } catch {
      // If site_url is not a valid URL, skip origin check
    }
  }

  return {
    valid: true,
    projectId: project.id,
    siteUrl: project.site_url,
  };
}
