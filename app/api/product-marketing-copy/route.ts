import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProductMarketingCopy } from "@/lib/services/product-marketing-copy";

export const runtime = "nodejs";

const RequestBodySchema = z.object({
  product_description: z.string().min(1, "product_description is required").max(48_000),
  product_name: z.string().max(500).optional(),
  category: z.string().max(500).optional(),
  brand: z.string().max(500).optional(),
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error", hint: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const { product_description, product_name, category, brand } = parsed.data;

    const result = await generateProductMarketingCopy({
      product_description,
      product_name: product_name ?? null,
      category: category ?? null,
      brand: brand ?? null,
    });

    if (!result.ok) {
      const status = result.error === "product_description is required" ? 400 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[product-marketing-copy] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
