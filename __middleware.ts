import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGIN = "https://appiclean.com.ua";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // widget.js is now handled by app/widget.js/route.ts (dynamic route)
  // Only protect the main widget app iframe route (/)

  if (pathname === "/") {
    const hasToken = !!searchParams.get("t");

    // If a widget token is present, allow from any origin (validated at API level)
    if (hasToken) {
      return NextResponse.next();
    }

    // Legacy mode: only allow iframe from appiclean.com.ua
    const referer = request.headers.get("referer");
    const secFetchDest = request.headers.get("sec-fetch-dest");

    let refererOrigin: string | null = null;
    if (referer) {
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        refererOrigin = null;
      }
    }

    const isIframe = secFetchDest === "iframe";
    const isAllowedParent = refererOrigin === ALLOWED_ORIGIN;

    if (!isIframe || !isAllowedParent) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message:
            "This widget can only be loaded in an iframe on https://appiclean.com.ua/",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
