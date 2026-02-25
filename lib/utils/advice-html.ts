export function normalizeForMatch(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Дозволені теги для advice_text: лише p, strong, b, br. Видаляє атрибути та небезпечні теги. */
export function sanitizeAdviceHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/<(?!\/?(?:p|strong|b|br)(?:\s*\/)?\s*>)[^>]+>/gi, "")
    .replace(/<(p|strong|b|br)(\s[^>]*)?>/gi, "<$1>");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Замінює в HTML фрагменти <strong>...</strong> та <b>...</b> на посилання, якщо текст збігається з назвою товару (нормалізовано). */
export function wrapProductNamesInLinks(
  html: string,
  products: { name: string; url: string | null }[]
): string {
  const withUrl = products.filter((p) => p.url != null && p.url !== "");
  const nameToProduct = new Map<string, { name: string; url: string }>();
  for (const p of withUrl) {
    const key = normalizeForMatch(p.name);
    if (!key) continue;
    const existing = nameToProduct.get(key);
    if (!existing || existing.name.length < (p.name?.length ?? 0)) {
      nameToProduct.set(key, { name: p.name, url: p.url! });
    }
  }
  return html.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, _tag, innerText) => {
    const normalized = normalizeForMatch(innerText);
    const product = normalized ? nameToProduct.get(normalized) : undefined;
    if (!product) return _;
    const safeUrl = product.url.replace(/"/g, "&quot;");
    return `<strong><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(innerText)}</a></strong>`;
  });
}
