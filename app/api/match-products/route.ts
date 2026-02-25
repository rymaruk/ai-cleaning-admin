import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchProductsByQuery } from "@/lib/services/match-products";
import { rewriteQueryForSearch } from "@/lib/services/query-rewriter";
import { rerankCandidates } from "@/lib/services/candidate-reranker";
import { generateProductReasons } from "@/lib/services/product-reasons";
import { ProductMatchSchema } from "@/lib/product-types";

export const runtime = "nodejs";

const DEFAULT_PIPELINE_MATCH_COUNT = 30;
const DEFAULT_PIPELINE_MIN_SIMILARITY = 0.25;

const RequestBodySchema = z.object({
  query: z.string().min(1, "query is required"),
  matchCount: z.number().int().min(1).max(100).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
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
    const { query } = parsed.data;
    const matchCount = parsed.data.matchCount ?? DEFAULT_PIPELINE_MATCH_COUNT;
    const minSimilarity = parsed.data.minSimilarity ?? DEFAULT_PIPELINE_MIN_SIMILARITY;

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
    const rewriterResult = await rewriteQueryForSearch(query);
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
    });

    // Stage 2: Reranker (if fail, still return matches with fallback recommendation)
    const FALLBACK_ADVICE =
      "Не вдалося сформувати пораду. Перегляньте підбрані товари нижче.";
    let recommendation: {
      top_picks: Array<{ id: string; reason: string; usage_tip: string; confidence: number }>;
      advice_text: string;
      notes?: string;
    } | null = null;
    const rerankerResult = await rerankCandidates(query, rewritten, matches);
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
    const reasonsResult = await generateProductReasons(query, matchesValidated);
    if (reasonsResult.ok) {
      productReasons = reasonsResult.data;
    } else {
      console.warn("[match-products] productReasons failed:", reasonsResult.error);
    }

    return NextResponse.json({
      query,
      rewritten,
      matches: matchesValidated,
      recommendation,
      productReasons,
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
