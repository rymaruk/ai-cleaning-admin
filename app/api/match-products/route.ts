import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchProductsByQuery } from "@/lib/services/match-products";
import { fetchProductContextByUrl } from "@/lib/services/fetch-product-context";
import { rewriteQueryForSearch } from "@/lib/services/query-rewriter";
import { rerankCandidates } from "@/lib/services/candidate-reranker";
import { generateProductReasons } from "@/lib/services/product-reasons";
import { ProductMatchSchema } from "@/lib/product-types";
import { getRequestLogContext } from "@/lib/utils/request-context";
import { insertAiAgentQueryLog } from "@/lib/services/log-ai-query";

export const runtime = "nodejs";

const DEFAULT_PIPELINE_MATCH_COUNT = 30;
const DEFAULT_PIPELINE_MIN_SIMILARITY = 0.25;

const RequestBodySchema = z.object({
  query: z.string().min(1, "query is required"),
  matchCount: z.number().int().min(1).max(100).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
  /** URL товару з таблиці products — пошук у контексті цього товару (embedding + промпти). */
  productUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, productUrl } = parsed.data;
    const matchCount = parsed.data.matchCount ?? DEFAULT_PIPELINE_MATCH_COUNT;
    const minSimilarity = parsed.data.minSimilarity ?? DEFAULT_PIPELINE_MIN_SIMILARITY;

    let contextRow: Awaited<ReturnType<typeof fetchProductContextByUrl>> = null;
    if (productUrl?.trim()) {
      contextRow = await fetchProductContextByUrl(productUrl.trim());
      if (!contextRow) {
        return NextResponse.json(
          { error: "Товар за вказаним URL не знайдено" },
          { status: 404 }
        );
      }
    }

    const { ipAddress, userAgent } = getRequestLogContext(request);

    const missing = [
      !process.env.OPENAI_API_KEY && "OPENAI_API_KEY",
      !process.env.SUPABASE_URL && "SUPABASE_URL",
      !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);

    if (missing.length > 0) {
      console.error("[match-products] Missing env:", missing.join(", "));
      return NextResponse.json(
        {
          error: "Server configuration error",
          missing: missing as string[],
          hint: "Set env in ai-cleaning-admin/.env and restart the dev server (yarn dev).",
        },
        { status: 500 }
      );
    }

    // Stage 1: Query rewriter (with fallback: if fail, use raw query for embedding)
    const rewriterResult = await rewriteQueryForSearch(query, {
      productContext:
        contextRow && contextRow.name
          ? { name: contextRow.name, url: contextRow.url }
          : undefined,
    });
    const rewritten = rewriterResult.ok ? rewriterResult.data : null;
    const embeddingText = rewritten?.rewritten_query ?? null;
    if (!rewriterResult.ok) {
      console.warn("[match-products] Stage1 rewriter failed, using raw query:", rewriterResult.error);
    }

    // Embedding + RPC (use rewritten text for AND-like search when available)
    const matches = await matchProductsByQuery(query, {
      matchCount,
      minSimilarity,
      embeddingText: embeddingText ?? undefined,
      contextProductEmbedding: contextRow?.embedding ?? null,
    });

    // Stage 2: Reranker (if fail, still return matches with fallback recommendation)
    const FALLBACK_ADVICE =
      "Не вдалося сформувати пораду. Перегляньте підбрані товари нижче.";
    let recommendation: {
      top_picks: Array<{ id: string; reason: string; usage_tip: string; confidence: number }>;
      advice_text: string;
      notes?: string;
    } | null = null;
    const rerankerResult = await rerankCandidates(query, rewritten, matches, {
      productContext:
        contextRow && contextRow.id
          ? { id: contextRow.id, name: contextRow.name }
          : undefined,
    });
    if (rerankerResult.ok) {
      recommendation = rerankerResult.data;
    } else {
      console.warn("[match-products] Stage2 reranker failed:", rerankerResult.error);
      recommendation = { top_picks: [], advice_text: FALLBACK_ADVICE };
    }

    const matchesValidated = matches.map((m) => {
      const p = ProductMatchSchema.safeParse(m);
      return p.success ? p.data : null;
    }).filter(Boolean) as z.infer<typeof ProductMatchSchema>[];

    // Reason + usage_tip per product (by name + query) for general list hover
    let productReasons: Record<string, { reason: string; usage_tip: string }> = {};
    const reasonsResult = await generateProductReasons(query, matchesValidated, {
      contextProductName: contextRow?.name ?? undefined,
    });
    if (reasonsResult.ok) {
      productReasons = reasonsResult.data;
    } else {
      console.warn("[match-products] productReasons failed:", reasonsResult.error);
    }

    // Build results_shown: all matches with is_recommended flag
    const recommendedIds = new Set(
      recommendation?.top_picks?.map((p) => p.id) ?? []
    );
    const resultsShown = matchesValidated.map((m) => ({
      id: m.id,
      name: m.name,
      brand: m.brand ?? null,
      price: m.price ?? null,
      similarity: m.similarity ?? null,
      is_recommended: recommendedIds.has(m.id),
    }));

    // Log AI agent query for analytics (server-side, after pipeline completes)
    void insertAiAgentQueryLog({
      queryText: query,
      ipAddress,
      userAgent,
      metadata: {
        source: "match-products",
        matchCount,
        minSimilarity,
        productUrl: productUrl?.trim() || undefined,
      },
      resultsShown,
    }).catch((err) => console.warn("[match-products] Query log failed:", err));

    return NextResponse.json({
      query,
      rewritten,
      matches: matchesValidated,
      recommendation,
      productReasons,
      productContext: contextRow
        ? { id: contextRow.id, name: contextRow.name, url: contextRow.url }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[match-products] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
