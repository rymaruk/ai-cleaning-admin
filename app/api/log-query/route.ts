import { NextRequest, NextResponse } from "next/server";
import { getRequestLogContext } from "@/lib/utils/request-context";
import { insertAiAgentQueryLog } from "@/lib/services/log-ai-query";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  query_text: z.string().min(1, "query_text is required"),
  user_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/log-query
 * Logs an AI agent query. Call from client (e.g. via useQueryLog) or from server.
 * Server captures IP and user-agent from request; client may send user_id if authenticated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query_text, user_id, metadata } = parsed.data;
    const { ipAddress, userAgent } = getRequestLogContext(request);

    const ok = await insertAiAgentQueryLog({
      queryText: query_text,
      userId: user_id ?? null,
      ipAddress,
      userAgent,
      metadata,
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Query was empty or logging failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[log-query] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
