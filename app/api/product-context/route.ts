import { NextRequest, NextResponse } from "next/server";
import { fetchProductContextByUrl } from "@/lib/services/fetch-product-context";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")?.trim();
    if (!url) {
      return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
    }

    const missing = [
      !process.env.SUPABASE_URL && "SUPABASE_URL",
      !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Server configuration error", missing }, { status: 500 });
    }

    const row = await fetchProductContextByUrl(url);
    if (!row) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      url: row.url,
      images: row.images,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[product-context]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
