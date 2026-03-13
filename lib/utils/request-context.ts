import type { NextRequest } from "next/server";

/**
 * Extracts IP and User-Agent from a Next.js request for logging.
 * Handles common proxy headers (Vercel, Cloudflare, etc.).
 */
export function getRequestLogContext(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ipAddress: ip, userAgent };
}
