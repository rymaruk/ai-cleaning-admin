import type { ProductMatch } from "@/lib/product-types";
import type { RerankerOutput } from "@/lib/match-pipeline-types";
import { normalizeForMatch } from "./advice-html";

function getProductNamesFromAdviceText(html: string): string[] {
  const names: string[] = [];
  html.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, _tag, innerText) => {
    const n = normalizeForMatch(innerText);
    if (n && !names.includes(n)) names.push(n);
    return _;
  });
  return names;
}

export type RecommendedItem = {
  product: ProductMatch;
  reason: string;
  usageTip: string;
  confidence: number;
};

/** Список рекомендацій: спочатку top_picks, потім товари з matches, згадані в пораді, але не в top_picks. */
export function getRecommendedList(
  recommendation: RerankerOutput | null,
  matches: ProductMatch[],
  adviceText: string | undefined
): RecommendedItem[] {
  if (!recommendation) return [];
  const result: RecommendedItem[] = [];
  const addedIds = new Set<string>();

  for (const pick of recommendation.top_picks) {
    const product = matches.find((m) => m.id === pick.id);
    if (product) {
      result.push({
        product,
        reason: pick.reason,
        usageTip: pick.usage_tip,
        confidence: pick.confidence,
      });
      addedIds.add(pick.id);
    }
  }

  if (adviceText?.trim()) {
    const namesInText = getProductNamesFromAdviceText(adviceText);
    const nameToProduct = new Map<string, ProductMatch>();
    for (const m of matches) {
      const key = normalizeForMatch(m.name);
      if (!key) continue;
      if (!nameToProduct.has(key) || (nameToProduct.get(key)!.name?.length ?? 0) < (m.name?.length ?? 0)) {
        nameToProduct.set(key, m);
      }
    }
    for (const name of namesInText) {
      const product = nameToProduct.get(name);
      if (product && !addedIds.has(product.id)) {
        result.push({
          product,
          reason: "Згадано в пораді",
          usageTip: "",
          confidence: 0,
        });
        addedIds.add(product.id);
      }
    }
  }

  return result;
}
