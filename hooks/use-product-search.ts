"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import type { ProductMatch, ProductContextBrief } from "@/lib/product-types";
import type { RewriterOutput } from "@/lib/match-pipeline-types";
import type { RerankerOutput } from "@/lib/match-pipeline-types";
import type { RecommendedItem } from "@/lib/utils/recommendations";
import { getRecommendedList } from "@/lib/utils/recommendations";

export const DEFAULT_MATCH_COUNT = 10;
export const DEFAULT_MIN_SIMILARITY = 0.3;

export type UseProductSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  submittedQuery: string;
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
  contextProduct: ProductContextBrief | null;
  loadProductContextByUrl: (url: string) => Promise<void>;
  clearProductContext: () => void;
  search: (overrideQuery?: string) => Promise<void>;
  handleKeyDown: (e: unknown) => void;
  adviceSectionRef: React.RefObject<HTMLDivElement | null>;
};

export function useProductSearch(): UseProductSearchResult {
  // Read widget token from iframe URL (passed by widget.js via ?t=TOKEN)
  const widgetToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("t") || null;
  }, []);

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [matchCount, setMatchCount] = useState(DEFAULT_MATCH_COUNT);
  const [minSimilarity, setMinSimilarity] = useState(DEFAULT_MIN_SIMILARITY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [rewritten, setRewritten] = useState<RewriterOutput | null>(null);
  const [recommendation, setRecommendation] = useState<RerankerOutput | null>(null);
  const [contextProduct, setContextProduct] = useState<ProductContextBrief | null>(null);
  const adviceSectionRef = useRef<HTMLDivElement>(null);

  const loadProductContextByUrl = useCallback(async (rawUrl: string) => {
    const u = rawUrl.trim();
    if (!u) return;
    setError(null);
    try {
      const res = await fetch(`/api/product-context?url=${encodeURIComponent(u)}`);
      const data = (await res.json()) as { error?: string; id?: string; name?: string; url?: string; images?: unknown };
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Не вдалося завантажити товар");
        return;
      }
      const images = data.images;
      const first =
        Array.isArray(images) && typeof images[0] === "string" ? (images[0] as string) : null;
      setContextProduct({
        id: String(data.id ?? ""),
        name: String(data.name ?? ""),
        url: String(data.url ?? u),
        imageUrl: first,
      });
    } catch {
      setError("Помилка мережі або сервера");
    }
  }, []);

  const clearProductContext = useCallback(() => {
    setContextProduct(null);
    setQuery("");
    setSubmittedQuery("");
    setMatches([]);
    setRewritten(null);
    setRecommendation(null);
    setError(null);
  }, []);

  const search = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q) {
        setError("Введіть запит для пошуку.");
        return;
      }
      setError(null);
      setLoading(true);
      setSubmittedQuery(q);
      setMatches([]);
      setRewritten(null);
      setRecommendation(null);
      try {
        const body: Record<string, unknown> = {
          query: q,
          matchCount,
          minSimilarity,
        };
        if (contextProduct?.url) {
          body.productUrl = contextProduct.url;
        }
        if (widgetToken) {
          body.widgetToken = widgetToken;
        }
        const res = await fetch("/api/match-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data?.code === "SUBSCRIPTION_EXPIRED") {
            setError("Підписка на віджет закінчилась. Зверніться до адміністратора сайту.");
          } else {
            setError(data?.error ?? "Помилка пошуку");
          }
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
    },
    [query, matchCount, minSimilarity, contextProduct?.url, widgetToken]
  );

  const handleKeyDown = useCallback(
    (e: unknown) => {
      const ev = e as KeyboardEvent;
      if (ev.key === "Enter" || (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey))) {
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
    submittedQuery,
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
    contextProduct,
    loadProductContextByUrl,
    clearProductContext,
    search,
    handleKeyDown,
    adviceSectionRef,
  };
}
