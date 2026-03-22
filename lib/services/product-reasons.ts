import { getOpenAIClient } from "@/lib/clients/openai";
import type { ProductMatch } from "@/lib/product-types";

const MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_PRODUCTS = 30;

export type ProductReasonEntry = { reason: string; usage_tip: string };

export type ProductReasonsResult =
  | { ok: true; data: Record<string, ProductReasonEntry> }
  | { ok: false; error: string };

/**
 * For each product, generates a short reason (why it fits the query) and usage_tip (how to use)
 * using the user query and product name (+ brand/category). One batch LLM call.
 */
export type ProductReasonsOptions = {
  /** Користувач задав контекст конкретного товару — пояснення мають бути релевантні й до нього. */
  contextProductName?: string | null;
};

export async function generateProductReasons(
  query: string,
  products: ProductMatch[],
  options?: ProductReasonsOptions
): Promise<ProductReasonsResult> {
  if (products.length === 0) {
    return { ok: true, data: {} };
  }

  const list = products.slice(0, MAX_PRODUCTS).map(
    (p, i) =>
      `${i + 1}. id="${p.id}" name="${p.name}" brand="${p.brand ?? ""}" category="${p.category_name ?? ""}"`
  ).join("\n");

  const openai = getOpenAIClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const systemPrompt = `Ти — експерт з прибирання та товарів для дому. Для кожного товару з списку поверни:
- reason: одне-два речення українською, чому цей товар підходить під запит користувача (зв'язок назви/категорії з запитом).
- usage_tip: одне коротке речення українською, як використовувати цей товар у контексті запиту.

Повертай тільки валідний JSON об'єкт, де ключі — це id товарів з списку (рядки в лапках), а значення — об'єкти з полями "reason" та "usage_tip". Приклад:
{"id1": {"reason": "...", "usage_tip": "..."}, "id2": {...}}`;

  const ctx =
    options?.contextProductName?.trim() &&
    `Контекст: користувач обрав товар "${options.contextProductName.trim()}" — пояснюй зв'язок кожного кандидата з цим запитом і з контекстом товару, де доречно.

`;

  const userContent = `${ctx ?? ""}Запит користувача: "${query}"

Список товарів (id використовуй як ключ у відповіді):
${list}

Поверни JSON з reason та usage_tip для кожного id.`;

  try {
    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "Empty product-reasons response" };
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const validIds = new Set(products.slice(0, MAX_PRODUCTS).map((p) => p.id));
    const data: Record<string, ProductReasonEntry> = {};

    for (const id of validIds) {
      const raw = parsed[id];
      if (raw && typeof raw === "object" && "reason" in raw && "usage_tip" in raw) {
        const reason = String((raw as { reason: unknown }).reason ?? "").trim();
        const usage_tip = String((raw as { usage_tip: unknown }).usage_tip ?? "").trim();
        data[id] = { reason: reason || "Підходить під ваш запит.", usage_tip: usage_tip || "Використовуйте згідно з інструкцією." };
      } else {
        data[id] = {
          reason: "Підходить під ваш запит.",
          usage_tip: "Використовуйте згідно з інструкцією.",
        };
      }
    }

    return { ok: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
