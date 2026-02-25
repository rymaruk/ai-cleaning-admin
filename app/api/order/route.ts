import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const KeyCRMProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  picture: z.string().optional(),
  comment: z.string().optional(),
});

const BuyerSchema = z.object({
  full_name: z.string().min(1, "Buyer full_name is required"),
  phone: z.string().min(1, "Buyer phone is required"),
  email: z.string().optional(),
});

const RequestBodySchema = z.object({
  buyer: BuyerSchema,
  products: z.array(KeyCRMProductSchema).min(1, "At least one product required"),
  total: z.number(),
  buyer_comment: z.string().optional(),
  ordered_at: z.string().optional(),
});

/**
 * Sends order to KeyCRM create order API.
 * KeyCRM docs: https://docs.keycrm.app/#/Order/createNewOrder
 * Configure KEYCRM_API_URL and KEYCRM_API_KEY in environment.
 */
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

    const apiUrl = process.env.KEYCRM_API_URL;
    const apiKey = process.env.KEYCRM_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        {
          error: "KeyCRM not configured",
          hint: "Set KEYCRM_API_URL and KEYCRM_API_KEY in environment",
        },
        { status: 503 }
      );
    }

    const { buyer, products, total, buyer_comment, ordered_at } = parsed.data;

    // Payload per https://docs.keycrm.app/#/Order/createNewOrder
    const orderPayload = {
      source_id: 17, // `17` for AI agent in KeyCRM
      buyer: {
        full_name: buyer.full_name,
        phone: buyer.phone,
        ...(buyer.email && { email: buyer.email }),
      },
      products: products.map((p) => ({
        ...(p.sku && { sku: p.sku }),
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        ...(p.picture && { picture: p.picture }),
        ...(p.comment && { comment: p.comment }),
      })),
      ...(buyer_comment && { buyer_comment: `Товар обрано по запиту користувача: ${buyer_comment}` }),
      ...(ordered_at && { ordered_at }),
    };

    console.log(orderPayload);
    const res = await fetch(`${apiUrl}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.KEYCRM_HEADER_NAME && process.env.KEYCRM_HEADER_VALUE
          ? { [process.env.KEYCRM_HEADER_NAME]: process.env.KEYCRM_HEADER_VALUE }
          : {}),
      },
      body: JSON.stringify(orderPayload),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "KeyCRM order creation failed",
          status: res.status,
          details: responseData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: responseData,
    });
  } catch (err) {
    console.error("[order] KeyCRM request error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
