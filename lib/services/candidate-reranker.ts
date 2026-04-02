import { getOpenAIClient } from "@/lib/clients/openai";
import type { RewriterOutput } from "@/lib/match-pipeline-types";
import { RerankerOutputSchema, type RerankerOutput } from "@/lib/match-pipeline-types";
import type { ProductMatch } from "@/lib/product-types";

const RERANKER_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 20_000;

function buildCandidatesText(matches: ProductMatch[]): string {
  return matches
    .slice(0, 30)
    .map(
      (p, i) =>
        `${i + 1}. id="${p.id}" name="${p.name}" brand="${p.brand ?? ""}" category="${p.category_name ?? ""}" price=${p.price ?? "?"} similarity=${p.similarity ?? "?"}`
    )
    .join("\n");
}

export type RerankerResult = { ok: true; data: RerankerOutput } | { ok: false; error: string };

export type RerankProductContext = { id: string; name: string };

/**
 * Stage 2: From top N candidates, select 1–3 best fits with reasoning.
 * Chooses ONLY from provided candidates; prefers AND-like match to constraints.
 */
export async function rerankCandidates(
  originalQuery: string,
  rewritten: RewriterOutput | null,
  matches: ProductMatch[],
  options?: { productContext?: RerankProductContext | null }
): Promise<RerankerResult> {
  if (matches.length === 0) {
    return {
      ok: true,
      data: {
        top_picks: [],
        advice_text: "Немає підходящих товарів за вашим запитом. Спробуйте змінити опис.",
        notes: "Немає кандидатів для рекомендації.",
      },
    };
  }

  const openai = getOpenAIClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const rewrittenBlob = rewritten
    ? JSON.stringify(
        {
          intent: rewritten.intent,
          surfaces: rewritten.surfaces,
          dirt: rewritten.dirt,
          context: rewritten.context,
          constraints: rewritten.constraints,
          rewritten_query: rewritten.rewritten_query,
        },
        null,
        2
      )
    : "не було переписування (використано оригінальний запит)";

    const systemPrompt = `Ти — експерт з техніки Karcher, побутової хімії та прибирання. Обери 1–3 найкращі товари З НАДАНОГО списку кандидатів для запиту користувача.

Пріоритет — РЕАЛЬНА ВІДПОВІДНІСТЬ задачі, поверхні, методу та типу товару. Не рекомендуй товар як основне рішення, якщо його клас/призначення логічно не закриває запит (наприклад робот-пилосос для миття бруківки на вулиці, сухий пилосос як єдиний інструмент для важкого зовнішнього миття під тиском).

Комплектація типів (гнучко, без жорстких квот):
- Якщо задача природно потребує і техніку, і хімію — і обидва типи є серед доречних кандидатів — бажано поєднати в top_picks (наприклад спочатки збір пилу/миття, потім засіб).
- Якщо доречна лише хімія або лише техніка — не додавай другий тип «для галочки».
- Аксесуари — коли вони логічно доповнюють обраний сценарій.

Правила чесності:
- Якщо серед кандидатів є товар з високим similarity, але він НЕ підходить під суть запиту (не та функція, не та поверхня, небезпечно/неможливо за призначенням) — НЕ включай його в top_picks як «найкращий». Краще обери менш схожий за числом, але предметно відповідний за типом.
- Якщо запит передбачає дію, якої жоден кандидат не виконує — обери найближчі корисні позиції з поясненням обмежень у reason та у advice_text; запропонуй альтернативний підхід узагальнено (інший клас техніки або методу), не вигадуючи товарів поза списком.
- Якщо користувач питає про обмеження конкретного товару — не стверджуй, що він підходить, коли ні; поясни обмеження і що з кандидатів ближче до потреби.

Технічні правила:
- Обери ТІЛЬКИ з наданих кандидатів (id зі списку). Не вигадуй товари.
- Дотримуйся AND-логіки: усі обрані позиції мають бути осмисленою відповіддю на запит (або чесним частковим рішенням з поясненням).
- Поверни 1–3 позиції у top_picks.
- confidence: вищий, коли відповідність однозначна; нижчий при частковій відповідності — тоді reason має це відображати.

Формат top_picks (кожен елемент):
- id (рядок зі списку)
- reason: українською — чому підходить або в чому обмеження + що саме закриває
- usage_tip: одне речення — як застосувати або що розглянути замість/додатково
- confidence (0.0–1.0)

advice_text — ОБОВ'ЯЗКОВО, HTML:
- Українською, 3–8 речень. Кожен абзац у <p>...</p>. Важливе виділяй <strong>...</strong>. Дозволені лише <p>, <strong>.
- Останній абзац — ключовий висновок: увесь абзац обгорни в <p><strong>...</strong></p>.
- Назви товарів копіюй з поля name кандидата символ в символ.
- Коротко порівняй обрані позиції; згадай обмеження та альтернативні класи рішень, якщо запит цього потребує.
- Якщо в top_picks є і техніка, і хімія — прив’яжи їх до сценарію (послідовність або сумісність), якщо це логічно.

notes — опційна коротка службова примітка.

Повертай JSON: top_picks, advice_text, опційно notes.`;

  const pc = options?.productContext;
  const contextBlock =
    pc?.id && pc.name?.trim()
      ? `Контекст: користувач дивиться товар id="${pc.id}" name="${pc.name.trim()}".
Якщо цей товар є серед кандидатів і ВІДПОВІДАЄ запиту (використання, сумісність, догляд) — можеш дати йому пріоритет у top_picks.
Якщо запит про те, чим цей товар НЕ може допомогти, або він не підходить — НЕ виставляй його як «найкращий варіант»; чесно поясни в reason/advice_text і запропонуй з кандидатів кращі за типом або опиши альтернативний підхід.

`
      : "";

  const userContent = `${contextBlock}Запит користувача: "${originalQuery}"

Структурований перепис (Stage 1): 
${rewrittenBlob}

Кандидати (id обов'язково використовуй як у списку):
${buildCandidatesText(matches)}

Обери 1–3 найкращі товари за реальною відповідністю запиту (не змушуй техніку в рекомендацію, якщо вона нерелевантна). Поверни JSON з top_picks та advice_text (HTML: абзаци в <p>, важливе в <strong>).`;

  try {
    const completion = await openai.chat.completions.create(
      {
        model: RERANKER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
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
      return { ok: false, error: "Empty reranker response" };
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = RerankerOutputSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false, error: `Invalid reranker schema: ${validated.error.message}` };
    }

    const data = validated.data;
    const validIds = new Set(matches.map((m) => m.id));
    let filtered = data.top_picks.filter((p) => validIds.has(p.id)).slice(0, 3);
    const ctxId = options?.productContext?.id;
    if (ctxId) {
      const ctxMatch = matches.find((m) => m.id === ctxId);
      const hasCtx = filtered.some((p) => p.id === ctxId);
      if (ctxMatch && !hasCtx) {
        filtered = [
          {
            id: ctxMatch.id,
            reason: "Товар, який користувач обрав для контексту запиту.",
            usage_tip: "Дотримуйтесь інструкції виробника до цього товару.",
            confidence: Math.min(1, Math.max(0.65, ctxMatch.similarity ?? 0.85)),
          },
          ...filtered.filter((p) => p.id !== ctxId),
        ].slice(0, 3);
      }
    }
    const advice_text =
      data.advice_text.trim()
        ? data.advice_text.trim()
        : "Рекомендовано обрати один із товарів вище згідно з вашим запитом.";
    return {
      ok: true,
      data: { top_picks: filtered, advice_text, notes: data.notes },
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
