import { getSupabaseClient } from "@/lib/clients/supabase";
import { buildUrlVariants } from "@/lib/utils/product-url";

export type ProductContextRow = {
  id: string;
  name: string;
  url: string;
  images: string[] | null;
  embedding: number[] | null;
};

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "number") {
    return raw as number[];
  }
  if (typeof raw === "string") {
    const cleaned = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
    const parts = cleaned.split(",").map((x) => parseFloat(x.trim()));
    if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) return null;
    return parts;
  }
  return null;
}

/**
 * Load product by `products.url` (tries normalized URL variants). Used for iframe context and matching.
 */
export async function fetchProductContextByUrl(productUrl: string): Promise<ProductContextRow | null> {
  const variants = buildUrlVariants(productUrl);
  if (variants.length === 0) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, url, images, embedding")
    .in("url", variants)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[fetchProductContextByUrl]", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: String(data.id ?? ""),
    name: String(data.name ?? ""),
    url: String(data.url ?? ""),
    images: Array.isArray(data.images) ? (data.images as string[]) : null,
    embedding: parseEmbedding(data.embedding),
  };
}
