import { z } from "zod";

// ---- Stage 1: Query rewriter output ----
export const RewriterOutputSchema = z.object({
  intent: z.string(),
  surfaces: z.array(z.string()),
  dirt: z.array(z.string()),
  context: z.array(z.string()),
  constraints: z.array(z.string()),
  rewritten_query: z.string(),
});

export type RewriterOutput = z.infer<typeof RewriterOutputSchema>;

// ---- Stage 2: Reranker top pick ----
export const TopPickSchema = z.object({
  id: z.string(),
  reason: z.string(),
  usage_tip: z.string(),
  confidence: z.number().min(0).max(1),
});

export const RerankerOutputSchema = z.object({
  top_picks: z.array(TopPickSchema),
  advice_text: z.string(),
  notes: z.string().optional(),
});

export type TopPick = z.infer<typeof TopPickSchema>;
export type RerankerOutput = z.infer<typeof RerankerOutputSchema>;

// ---- API response ----
export const MatchProductsResponseSchema = z.object({
  query: z.string(),
  rewritten: RewriterOutputSchema.nullable(),
  matches: z.array(z.any()), // ProductMatch[] validated separately
  recommendation: RerankerOutputSchema.nullable(),
});

export type MatchProductsResponse = z.infer<typeof MatchProductsResponseSchema>;
