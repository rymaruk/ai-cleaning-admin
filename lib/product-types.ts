import { z } from "zod";

export const ProductMatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  category_name: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  url: z.string().nullable(),
  similarity: z.number().nullable(),
});

export type ProductMatch = z.infer<typeof ProductMatchSchema>;
