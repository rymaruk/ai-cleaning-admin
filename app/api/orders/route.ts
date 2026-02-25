import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MOCK_ORDERS = [
  {
    id: "mock-1",
    customer_name: "Олена Петренко",
    customer_phone: "+380 67 123 45 67",
    total: 1250,
    items: [
      { product_id: "p1", name: "Засіб для миття вікон", price: 450, quantity: 1, image_url: null },
      { product_id: "p2", name: "Мікрофібра для скла", price: 400, quantity: 2, image_url: null },
    ],
    created_at: "2025-02-20T10:00:00Z",
  },
  {
    id: "mock-2",
    customer_name: "Іван Коваленко",
    customer_phone: "+380 50 987 65 43",
    total: 759,
    items: [
      { product_id: "p3", name: "Засіб для прибирання килимів", price: 759, quantity: 1, image_url: null },
    ],
    created_at: "2025-02-21T14:30:00Z",
  },
  {
    id: "mock-3",
    customer_name: "Марія Сидоренко",
    customer_phone: "+380 63 111 22 33",
    total: 4060,
    items: [
      { product_id: "p4", name: "Пилосос", price: 3500, quantity: 1, image_url: null },
      { product_id: "p5", name: "Засіб універсальний", price: 280, quantity: 2, image_url: null },
    ],
    created_at: "2025-02-22T09:15:00Z",
  },
];

function filterMockOrders(search: string) {
  if (!search) return MOCK_ORDERS;
  const q = search.toLowerCase();
  return MOCK_ORDERS.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
      o.id.toLowerCase().includes(q)
  );
}

/**
 * Fetches orders from KeyCRM when configured; otherwise returns mock orders for testing.
 * Set KEYCRM_ORDERS_URL (or KEYCRM_API_URL) and KEYCRM_API_KEY for real data.
 * Optional query: ?search= for filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.KEYCRM_ORDERS_URL ?? process.env.KEYCRM_API_URL;
    const apiKey = process.env.KEYCRM_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() ?? "";

    if (!apiUrl || !apiKey) {
      const orders = filterMockOrders(search);
      return NextResponse.json({ orders });
    }

    const url = new URL(apiUrl);
    if (search) {
      url.searchParams.set("search", search);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.KEYCRM_HEADER_NAME && process.env.KEYCRM_HEADER_VALUE
          ? { [process.env.KEYCRM_HEADER_NAME]: process.env.KEYCRM_HEADER_VALUE }
          : {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "KeyCRM orders fetch failed",
          status: res.status,
          details: data,
        },
        { status: 502 }
      );
    }

    // Normalize: KeyCRM may return { data: [] } or direct array
    const rawOrders = Array.isArray(data) ? data : data?.data ?? data?.orders ?? [];
    const orders = (Array.isArray(rawOrders) ? rawOrders : []).map((o: Record<string, unknown>) => ({
      id: String(o.id ?? o._id ?? ""),
      customer_name: String(o.customer_name ?? o.customerName ?? ""),
      customer_phone: String(o.customer_phone ?? o.customerPhone ?? o.phone ?? ""),
      total: Number(o.total ?? 0),
      items: normalizeOrderItems(o.products ?? o.items ?? []),
      created_at: o.created_at ?? o.createdAt ?? undefined,
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[orders] KeyCRM request error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

function normalizeOrderItems(raw: unknown[]): Array<{ product_id: string; name: string; price: number; quantity: number; image_url?: string | null }> {
  return raw.map((item: Record<string, unknown>) => ({
    product_id: String(item.product_id ?? item.productId ?? item.id ?? ""),
    name: String(item.name ?? ""),
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    image_url: item.image_url ?? item.imageUrl ?? item.image ?? null,
  }));
}
