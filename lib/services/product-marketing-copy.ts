import { getOpenAIClient } from "@/lib/clients/openai";
import {
  ProductMarketingCopySchema,
  type ProductMarketingCopy,
} from "@/lib/product-marketing-types";

const MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = `Ти — маркетинговий редактор інтернет-магазину прибирання та побутової техніки (Karcher, хімія, аксесуари).

Твоя задача: з наданого опису товару (може бути сирий, довгий або з перекладацькими шорсткостями) зробити короткий, переконливий текст для покупця українською.

Вимоги до стилю:
- Дружній, але професійний тон; без крику, без зайвих фраз на кшталт «унікальна пропозиція», «найкращий у світі», без капслоку.
- Зосередься на вигоді: що саме робить товар, для яких задач/поверхонь/сценаріїв, що важливо знати (безпека, сумісність, тип забруднень) — лише якщо це є в описі або логічно випливає з нього.
- Не вигадуй характеристик, цифр, гарантій, комплектації, якщо їх немає у вхідному описі.
- Якщо в описі є орфографічні помилки або відсутні апострофи — виправ у готовому тексті.
- Не вставляй посилання, ціни, SKU, якщо їх не дали вхідні дані.
- Не вигадуй назву товару: якщо вхід містить офіційну назву — використовуй її точно; якщо назви немає — узагальнюй нейтрально («цей засіб», «цей прилад»).

Формат виходу (JSON):
{
  "card_teaser": "1–2 речення для картки товару на сайті",
  "chat_intro": "2–4 речення для чат-віджета: коротко по суті + можна одне уточнювальне питання користувачу"
}

Обмеження довжини:
- card_teaser: до ~220 символів
- chat_intro: до ~550 символів

Якщо вхідний опис порожній або зовсім неінформативний — поверни в обох полях короткий нейтральний текст, що просить користувача уточнити задачу (без вигаданих властивостей товару).

Повертай тільки валідний JSON з полями card_teaser та chat_intro.`;

export type ProductMarketingCopyInput = {
  product_description: string;
  product_name?: string | null;
  category?: string | null;
  brand?: string | null;
};

export type ProductMarketingCopyResult =
  | { ok: true; data: ProductMarketingCopy }
  | { ok: false; error: string };

function buildUserContent(input: ProductMarketingCopyInput): string {
  const desc = input.product_description.trim();
  const name = input.product_name?.trim();
  const category = input.category?.trim();
  const brand = input.brand?.trim();

  const meta: string[] = [];
  if (name) meta.push(`назва товару: ${name}`);
  if (category) meta.push(`категорія: ${category}`);
  if (brand) meta.push(`бренд: ${brand}`);

  const metaBlock = meta.length > 0 ? `\n\nДодатково: ${meta.join("; ")}.` : "";

  return `Опис товару (сирий текст):
"""
${desc}
"""${metaBlock}`;
}

/**
 * Генерує короткий продаючий текст для картки та вступ для чат-віджета з опису товару.
 */
export async function generateProductMarketingCopy(
  input: ProductMarketingCopyInput
): Promise<ProductMarketingCopyResult> {
  const trimmed = input.product_description?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, error: "product_description is required" };
  }

  const openai = getOpenAIClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent({ ...input, product_description: trimmed }) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "Empty response from model" };
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = ProductMarketingCopySchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false, error: `Invalid schema: ${validated.error.message}` };
    }

    return { ok: true, data: validated.data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
