import { getOpenAIClient } from "@/lib/clients/openai";
import { RewriterOutputSchema, type RewriterOutput } from "@/lib/match-pipeline-types";

const REWRITER_MODEL = "gpt-4o-mini";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 15_000;

const cache = new Map<
  string,
  { result: RewriterOutput; timestamp: number }
>();

export type ProductContextForRewriter = { name: string; url?: string };

function cacheKey(query: string, productContext?: ProductContextForRewriter | null): string {
  const base = query.trim().toLowerCase();
  if (!productContext?.name?.trim()) return base;
  return `${base}::ctx::${productContext.name.trim().toLowerCase()}`;
}

function getCached(key: string): RewriterOutput | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCached(key: string, result: RewriterOutput): void {
  cache.set(key, { result, timestamp: Date.now() });
}

const SYSTEM_PROMPT = `Ти — асистент для переписування пошукових запитів про прибирання та побутову хімію.
Твоя задача: перетворити вільний запит користувача на структурований текст (AND-логіка), щоб пошук за embeddings повертав товари, що відповідають УСІМ частинам запиту.

Вхідний текст може містити орфографічні помилки; апострофи у словах можуть бути відсутні або поставлені неправильно. Завжди сприймай такий текст як намір користувача: усунь помилки мислено, відновлюй правильні форми слів (з апострофами, де потрібно) і на цій основі сформуй результат. Не копіюй помилки в rewritten_query — там має бути коректна українська для embeddings.

Правила:
- Не вигадуй деталі. Якщо щось незрозуміло — залишай порожні масиви.
- Зберігай формулювання користувача як ключові слова всередині rewritten_query.
- rewritten_query має бути 3–8 речень українською, структурований текст для embeddings.
- intent: коротко що треба зробити.
- surfaces: поверхні (підлога, плитка, стільниця тощо); якщо не вказано — можна узагальнити "тверді поверхні".
- dirt: види забруднень.
- context: контекст (наприклад "після ремонту", "будівельний пил").
- constraints: обмеження (наприклад "без різкого запаху").

Приклад rewritten_query:
"Задача: прибирання після ремонту.
Забруднення: будівельний пил, дрібний цементний наліт.
Поверхні: підлога, плитка.
Потрібне: техніка для збирання пилу та миючий засіб для залишків."
Повертай тільки валідний JSON.`;

const PRODUCT_CONTEXT_NOTE = `
Додатково: якщо в повідомленні користувача вказано контекст обраного товару — усі формулювання в rewritten_query мають поєднувати запит користувача з цим товаром (застосування, сумісність, догляд, безпека тощо). Явно згадай назву товару в rewritten_query або в полі context, якщо це допомагає embeddings.`;

export type RewriterResult = { ok: true; data: RewriterOutput } | { ok: false; error: string };

export type RewriteQueryOptions = {
  productContext?: ProductContextForRewriter | null;
};

/**
 * Stage 1: Rewrite user query into AND-like structured text for embeddings.
 * Uses in-memory cache (same query within 5 min returns cached result).
 */
export async function rewriteQueryForSearch(
  userQuery: string,
  options?: RewriteQueryOptions
): Promise<RewriterResult> {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    return { ok: false, error: "query is required" };
  }

  const productContext = options?.productContext ?? null;
  const key = cacheKey(trimmed, productContext);
  const cached = getCached(key);
  if (cached) return { ok: true, data: cached };

  const openai = getOpenAIClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const systemContent =
    productContext?.name?.trim() ? `${SYSTEM_PROMPT}${PRODUCT_CONTEXT_NOTE}` : SYSTEM_PROMPT;

  const userContent = productContext?.name?.trim()
    ? `Контекст: користувач обрав товар "${productContext.name.trim()}"${
        productContext.url?.trim() ? ` (сторінка: ${productContext.url.trim()})` : ""
      }.
Усі питання та запити стосуються в першу чергу цього товару (поради, сумісність, використання).

Запит користувача:
${trimmed}`
    : trimmed;

  try {
    const completion = await openai.chat.completions.create(
      {
        model: REWRITER_MODEL,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "Empty rewriter response" };
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = RewriterOutputSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false, error: `Invalid rewriter schema: ${validated.error.message}` };
    }

    const data = validated.data;
    if (!data.rewritten_query?.trim()) {
      return { ok: false, error: "rewritten_query is empty" };
    }

    setCached(key, data);
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
