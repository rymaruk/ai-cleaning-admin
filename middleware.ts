import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGIN = "https://appiclean.com.ua";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect widget.js so it can only be embedded from https://appiclean.com.ua
  if (pathname === "/widget.js") {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    let refererOrigin: string | null = null;
    if (referer) {
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        refererOrigin = null;
      }
    }

    const isAllowed =
      origin === ALLOWED_ORIGIN || refererOrigin === ALLOWED_ORIGIN;

    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message:
            "Forbidden",
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

  // Protect main widget app so it can only be loaded in an iframe
  // on https://appiclean.com.ua
  if (pathname === "/") {
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
            "Forbidden",
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
  matcher: ["/widget.js", "/"],
};

