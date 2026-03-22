/**
 * Build URL string variants (with/without trailing slash) for matching against DB `products.url`.
 */
export function buildUrlVariants(raw: string): string[] {
  const t = raw.trim();
  const set = new Set<string>();
  if (!t) return [];
  set.add(t);
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, "");
    const base = `${u.origin}${path}`;
    set.add(base);
    set.add(`${base}/`);
    set.add(u.href);
    if (u.href.endsWith("/")) {
      set.add(u.href.slice(0, -1));
    }
  } catch {
    // keep only raw
  }
  return [...set];
}
