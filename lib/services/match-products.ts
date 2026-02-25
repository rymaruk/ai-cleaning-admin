import { getOpenAIClient } from "@/lib/clients/openai";
import { getSupabaseClient } from "@/lib/clients/supabase";
import { ProductMatchSchema, type ProductMatch } from "@/lib/product-types";

export type MatchProductsOptions = {
  matchCount?: number;
  minSimilarity?: number;
  /** If set, this text is embedded instead of query (e.g. rewritten_query from Stage 1). */
  embeddingText?: string;
};

/**
 * Single service: embed text with OpenAI, then match products via Supabase RPC.
 * Uses OpenAI and Supabase client instances from lib/clients.
 * When embeddingText is provided, it is used for the embedding; otherwise query is used.
 */
export async function matchProductsByQuery(
  query: string,
  options: MatchProductsOptions = {}
): Promise<ProductMatch[]> {
  const { matchCount = 10, minSimilarity = 0.3, embeddingText } = options;
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("query is required");
  }

  const textToEmbed = (embeddingText ?? trimmed).trim() || trimmed;
  const openai = getOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: textToEmbed,
  });

  const embedding = embeddingResponse.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Failed to compute embedding");
  }

  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase.rpc("match_products", {
    query_embedding: embedding,
    match_count: matchCount,
    min_similarity: minSimilarity,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  const matches: ProductMatch[] = [];
  const raw = Array.isArray(rows) ? rows : [];
  for (const row of raw) {
    const parsed = ProductMatchSchema.safeParse({
      id: row.id ?? "",
      name: row.name ?? "",
      brand: row.brand ?? null,
      category_name: row.category_name ?? null,
      price: row.price != null ? Number(row.price) : null,
      currency: row.currency ?? null,
      images: Array.isArray(row.images) ? row.images : null,
      url: row.url ?? null,
      similarity: row.similarity != null ? Number(row.similarity) : null,
    });
    if (parsed.success) {
      matches.push(parsed.data);
    }
  }
  return matches;
}
