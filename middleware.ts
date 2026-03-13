import { NextResponse, type NextRequest } from "next/server";

// Allowed frontend origin
const ALLOWED_ORIGIN = "https://appiclean.com.ua";

// Common CORS headers for successful responses
function buildCorsHeaders(origin: string | null) {
  const headers = new Headers();

  if (origin === ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Vary", "Origin");
  }

  return headers;
}

// Helper to create a 403 Forbidden JSON response for disallowed origins
function forbiddenOriginResponse(origin: string | null) {
  const jsonBody = JSON.stringify({
    error: "Forbidden origin",
    message: "Requests are only allowed from https://appiclean.com.ua",
    origin,
  });

  const res = new NextResponse(jsonBody, {
    status: 403,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // CORS headers are intentionally not added for forbidden origins
  return res;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin === ALLOWED_ORIGIN;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      return forbiddenOriginResponse(origin);
    }

    // Preflight success with 204 No Content
    const headers = buildCorsHeaders(origin);
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // For non-preflight requests, block disallowed origins (when Origin header is present)
  if (origin && !isAllowedOrigin) {
    return forbiddenOriginResponse(origin);
  }

  // Allow the request to continue to the route handler
  const response = NextResponse.next();

  // Attach CORS headers for allowed origins
  if (isAllowedOrigin) {
    const headers = buildCorsHeaders(origin);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Apply this middleware only to API routes
export const config = {
  matcher: ["/api/:path*"],
};

