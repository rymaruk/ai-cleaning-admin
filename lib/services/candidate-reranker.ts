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

/** Чи є товар у категорії "Техніка" (за category_name). */
function isTechnika(p: ProductMatch): boolean {
  const cat = (p.category_name ?? "").trim();
  return cat === "Техніка" || cat.toLowerCase().includes("техніка");
}

/** Повертає кандидатів-техніку, відсортованих за similarity (найвищий спочатку). */
function getTechnikaCandidates(matches: ProductMatch[]): ProductMatch[] {
  return matches.filter(isTechnika).sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
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

    const systemPrompt = `Ти — експерт з техніки Karcher та хімії та прибирання. Обери 1–5 найкращі товари з наданого списку кандидатів для запиту користувача.

    Ключова вимога — ТЕХНІКА ЗАВЖДИ В РЕКОМЕНДАЦІЇ:
    - Якщо серед кандидатів Є хоч один товар з category "Техніка" — у top_picks ОБОВ'ЯЗКОВО має бути щонайменше 1 позиція-техніка. Це правило виконуй незалежно від similarity/релевантності: техніку показуй завжди, якщо вона є в списку.
    - Якщо є "Хімія" і є "Техніка" — у top_picks бажано також 1 хімія (комплект: техніка + хімія).
    - Аксесуари можна додавати як 3-тю позицію, якщо доповнюють техніку/хімію.
    - Якщо "Техніка" у кандидатах НЕМАЄ — тоді рекомендація лише з "Хімія" та/або "Аксесуар" (1–3 позиції).
    
    Правила:
    - Обери ТІЛЬКИ з наданих кандидатів (id зі списку). Не вигадуй товари.
    - Дотримуйся AND-логіки для хімії/аксесуарів; для техніки — достатньо наявності в списку, обов'язково включи щонайменше одну.
    - Поверни 1–3 позиції максимум у top_picks.
    - Якщо техніки кілька: обери найбільш доречну під контекст (наприклад "після ремонту" -> збір пилу) і поясни чому.
    
    Формат top_picks:
    - Кожен top_pick: 
      - id (рядок з списку)
      - reason (коротке пояснення українською чому підходить)
      - usage_tip (одне речення як використовувати)
      - confidence (0.0–1.0)
    
    advice_text — ОБОВ'ЯЗКОВО, у вигляді HTML:
    - Українською, 3–8 речень. Кожен абзац обгорни в <p>...</p>. Найважливіше по релевантності виділяй <strong>...</strong>. Дозволені теги тільки <p>, </p>, <strong>, </strong>.
    - Останній абзац поради — ключовий висновок: ОБОВ'ЯЗКОВО обгорни його повністю в <strong></p>.
    - Коли згадуєш товар у тексті — пиши його назву ТОЧНО так, як у списку кандидатів (поле name), символ в символ: без скорочень, перефразування чи змін. Копіюй name з кандидата 1 в 1.
    - Порівняй кандидатів коротко.
    - Поясни, чому саме ці 1–3 найкращі.
    - З чого почати, чого уникати.
    - Якщо у top_picks є "Техніка" і "Хімія" — ОБОВ'ЯЗКОВО згадай обидва типи у тексті та прив’яжи їх до сценарію ("спочатку техніка..., потім/разом хімія...").
    - Посилайся на товари за назвою (і ціною). Не вигадуй товари.
    
    notes — необов'язкова коротка примітка.
    
    Повертай тільки валідний JSON з полями top_picks, advice_text (HTML з <p> та <strong>) та опційно notes.`;

  const pc = options?.productContext;
  const contextBlock =
    pc?.id && pc.name?.trim()
      ? `Обраний товар для контексту (запит користувача стосується цього товару): id="${pc.id}" name="${pc.name.trim()}".
Якщо цей товар є в списку кандидатів — обов'язково включи його в top_picks серед перших (якщо це відповідає запиту), і зроби пораду релевантною до нього.

`
      : "";

  const userContent = `${contextBlock}Запит користувача: "${originalQuery}"

Структурований перепис (Stage 1): 
${rewrittenBlob}

Кандидати (id обов'язково використовуй як у списку):
${buildCandidatesText(matches)}

Обери 1–3 найкращі товари. Якщо в списку є category "Техніка" — обов'язково включи щонайменше одну техніку в top_picks. Поверни JSON з top_picks та advice_text у вигляді HTML: абзаци в <p>, важливе в <strong>.`;

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
    const technikaCandidates = getTechnikaCandidates(matches);
    const hasTechnikaInPicks = filtered.some((p) => {
      const m = matches.find((x) => x.id === p.id);
      return m && isTechnika(m);
    });
    // Якщо в кандидатах є техніка, а в рекомендаціях її немає — обов'язково додати одну (незалежно від релевантності).
    if (technikaCandidates.length > 0 && !hasTechnikaInPicks) {
      const bestTechnika = technikaCandidates[0];
      const confidence = Math.min(1, Math.max(0, bestTechnika.similarity ?? 0.8));
      const syntheticPick = {
        id: bestTechnika.id,
        reason: "Техніка для задачі прибирання, рекомендована до комплекту.",
        usage_tip: "Використовуйте згідно з інструкцією до приладу.",
        confidence,
      };
      filtered = [syntheticPick, ...filtered.filter((p) => p.id !== bestTechnika.id)].slice(0, 3);
    }
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
