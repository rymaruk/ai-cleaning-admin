"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import type { ProductMatch } from "@/lib/product-types";
import type { RewriterOutput } from "@/lib/match-pipeline-types";
import type { RerankerOutput } from "@/lib/match-pipeline-types";
import type { RecommendedItem } from "@/lib/utils/recommendations";
import { getRecommendedList } from "@/lib/utils/recommendations";

export const DEFAULT_MATCH_COUNT = 10;
export const DEFAULT_MIN_SIMILARITY = 0.3;

export type UseProductSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  matchCount: number;
  setMatchCount: (n: number) => void;
  minSimilarity: number;
  setMinSimilarity: (n: number) => void;
  loading: boolean;
  error: string | null;
  matches: ProductMatch[];
  rewritten: RewriterOutput | null;
  recommendation: RerankerOutput | null;
  recommendedList: RecommendedItem[];
  search: (overrideQuery?: string) => Promise<void>;
  handleKeyDown: (e: unknown) => void;
  adviceSectionRef: React.RefObject<HTMLDivElement | null>;
};

export function useProductSearch(): UseProductSearchResult {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(DEFAULT_MATCH_COUNT);
  const [minSimilarity, setMinSimilarity] = useState(DEFAULT_MIN_SIMILARITY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [rewritten, setRewritten] = useState<RewriterOutput | null>(null);
  const [recommendation, setRecommendation] = useState<RerankerOutput | null>(null);
  const adviceSectionRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      setError("Введіть запит для пошуку.");
      return;
    }
    setError(null);
    setLoading(true);
    setMatches([]);
    setRewritten(null);
    setRecommendation(null);
    try {
      const res = await fetch("/api/match-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          matchCount,
          minSimilarity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Помилка пошуку");
        return;
      }
      setMatches(data.matches ?? []);
      setRewritten(data.rewritten ?? null);
      setRecommendation(data.recommendation ?? null);
    } catch {
      setError("Помилка мережі або сервера");
    } finally {
      setLoading(false);
    }
  }, [query, matchCount, minSimilarity]);

  const handleKeyDown = useCallback(
    (e: unknown) => {
      const ev = e as KeyboardEvent;
      if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
        ev.preventDefault();
        search();
      }
    },
    [search]
  );

  useEffect(() => {
    if (!loading && matches.length > 0 && recommendation?.advice_text && adviceSectionRef.current) {
      adviceSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, matches.length, recommendation?.advice_text]);

  const recommendedList = getRecommendedList(
    recommendation,
    matches,
    recommendation?.advice_text
  );

  return {
    query,
    setQuery,
    matchCount,
    setMatchCount,
    minSimilarity,
    setMinSimilarity,
    loading,
    error,
    matches,
    rewritten,
    recommendation,
    recommendedList,
    search,
    handleKeyDown,
    adviceSectionRef,
  };
}
