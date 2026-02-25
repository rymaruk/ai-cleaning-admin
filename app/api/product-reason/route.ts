import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProductReasons } from "@/lib/services/product-reasons";
import { ProductMatchSchema } from "@/lib/product-types";

const RequestBodySchema = z.object({
  query: z.string().min(1, "query is required"),
  product: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().nullable().optional(),
    category_name: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    images: z.array(z.string()).nullable().optional(),
    url: z.string().nullable().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, product } = parsed.data;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error", hint: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const productValid = ProductMatchSchema.safeParse(product);
    const match = productValid.success ? productValid.data : {
      ...product,
      brand: product.brand ?? null,
      category_name: product.category_name ?? null,
      price: product.price ?? null,
      currency: null,
      images: product.images ?? null,
      url: product.url ?? null,
      similarity: null,
    } as z.infer<typeof ProductMatchSchema>;

    const result = await generateProductReasons(query, [match]);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    const entry = result.data[match.id];
    if (!entry) {
      return NextResponse.json(
        { error: "No reason generated for this product" },
        { status: 502 }
      );
    }
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[product-reason] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
