import { getOpenAIClient } from "@/lib/clients/openai";
import { getSupabaseClient } from "@/lib/clients/supabase";
import { z } from "zod";

const ProjectProductMatchSchema = z.object({
  id: z.string(),
  external_id: z.string().nullable(),
  name: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  url: z.string().nullable(),
  extra_data: z.record(z.unknown()).nullable(),
  similarity: z.number().nullable(),
});

export type ProjectProductMatch = z.infer<typeof ProjectProductMatchSchema>;

export type MatchProjectProductsOptions = {
  matchCount?: number;
  minSimilarity?: number;
  embeddingText?: string;
};

/**
 * Embed text and search project-scoped products via match_project_products RPC.
 */
export async function matchProjectProductsByQuery(
  query: string,
  projectId: string,
  options: MatchProjectProductsOptions = {}
): Promise<ProjectProductMatch[]> {
  const { matchCount = 10, minSimilarity = 0.3, embeddingText } = options;
  const trimmed = query.trim();
  if (!trimmed) throw new Error("query is required");

  const textToEmbed = (embeddingText ?? trimmed).trim() || trimmed;

  const openai = getOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: textToEmbed,
  });

  const embedding = embeddingResponse.data?.[0]?.embedding as
    | number[]
    | undefined;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Failed to compute embedding");
  }

  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase.rpc("match_project_products", {
    query_embedding: embedding,
    p_project_id: projectId,
    match_count: matchCount,
    min_similarity: minSimilarity,
  });

  if (error) {
    throw new Error(`Project search failed: ${error.message}`);
  }

  const matches: ProjectProductMatch[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const parsed = ProjectProductMatchSchema.safeParse({
      id: row.id ?? "",
      external_id: row.external_id ?? null,
      name: row.name ?? null,
      brand: row.brand ?? null,
      category: row.category ?? null,
      price: row.price != null ? Number(row.price) : null,
      currency: row.currency ?? null,
      images: Array.isArray(row.images) ? row.images : null,
      url: row.url ?? null,
      extra_data: row.extra_data ?? null,
      similarity: row.similarity != null ? Number(row.similarity) : null,
    });
    if (parsed.success) matches.push(parsed.data);
  }
  return matches;
}
