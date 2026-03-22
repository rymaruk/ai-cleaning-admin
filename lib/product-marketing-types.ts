import { z } from "zod";

/** Відповідь LLM: короткий текст для картки товару та вступ для чат-віджета. */
export const ProductMarketingCopySchema = z.object({
  card_teaser: z.string(),
  chat_intro: z.string(),
});

export type ProductMarketingCopy = z.infer<typeof ProductMarketingCopySchema>;
