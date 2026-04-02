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

  const systemPrompt = `Ти — експерт з прибирання та товарів для дому (техніка, хімія, аксесуари). Для КОЖНОГО id зі списку (навіть якщо релевантність низька) поверни чесну оцінку:

- reason: 1–3 речення українською.
  • Якщо товар добре відповідає запиту — поясни зв'язок (назва, категорія, тип пристрою/засобу) із задачею.
  • Якщо відповідність часткова — напиши, для чого саме з запиту товар підходить і що він НЕ закриває.
  • Якщо товар НЕ підходить під запит або запитаний метод/функція для цієї задачі недоцільний або неможливий (наприклад: робот-пилосос для миття бруківки на вулиці, сухий пилосос як єдиний засіб для застарілого жиру на фасаді) — ОБОВ'ЯЗКОВО скажи це прямо: «цим товаром не варто / не можна …», коротко чому (фізика процесу, тип поверхні, призначення категорії). Не вигадуй можливості, яких немає в типі товару.

- usage_tip: одне-два короткі речення українською.
  • Якщо товар підходить — конкретна порада використання під задачу.
  • Якщо товар не підходить — не прикидайся, що він «таки підійде». Замість цього порадь АЛЬТЕРНАТИВНИЙ підхід або тип засобу/техніки узагальнено (наприклад: мийка високого тиску або ручне миття з щіткою та відповідним засобом; для квартири — швабра/пароочисник тощо). Не називай конкретні товари з каталогу, яких немає у списку; можна називати класи рішень.

Загальні орієнтири (застосовуй за змістом запиту):
- Не плутай призначення: внутрішнє сухе прибирання ≠ миття великих зовнішніх зон під тиском; збір пилу ≠ видалення нагару без хімії.
- Для делікатних поверхнів — вказуй обережність і перевірку інструкції, якщо товар може бути несумісний.

Повертай тільки валідний JSON: ключі — id зі списку (рядки), значення — {"reason": "...", "usage_tip": "..."}. Приклад:
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
        data[id] = {
          reason: reason || "Оцініть відповідність товару вашій задачі за назвою та категорією.",
          usage_tip: usage_tip || "Дотримуйтесь інструкції виробника.",
        };
      } else {
        data[id] = {
          reason: "Оцініть відповідність товару вашій задачі за назвою та категорією.",
          usage_tip: "Дотримуйтесь інструкції виробника.",
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
