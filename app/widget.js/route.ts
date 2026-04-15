import { NextRequest, NextResponse } from "next/server";
import { validateWidgetToken } from "@/lib/services/validate-widget-token";

export const runtime = "nodejs";

const WIDGET_URL = "https://ai-cleaning-admin.vercel.app";
const LEGACY_ALLOWED_ORIGIN = "https://appiclean.com.ua";

/** Returns the full widget JavaScript with the token baked in. */
function getWidgetJs(token: string | null): string {
  const iframeSrc = token ? `${WIDGET_URL}?t=${token}` : WIDGET_URL;

  return `(function () {
  var WIDGET_URL = ${JSON.stringify(WIDGET_URL)};
  var IFRAME_SRC = ${JSON.stringify(iframeSrc)};
  var HAS_CLICKED_KEY = "ai_cleaning_widget_has_clicked";

  var isMobile = window.innerWidth <= 768;
  var isOpen = false;
  var hasClicked = false;

  try {
    hasClicked = window.localStorage.getItem(HAS_CLICKED_KEY) === "1";
  } catch (e) {}

  var iframe = document.createElement("iframe");
  iframe.src = IFRAME_SRC;
  iframe.setAttribute("allowtransparency", "true");
  iframe.style.cssText = [
    "display: none",
    "position: fixed",
    "top: 0px",
    "right: -76px",
    "max-width: 990px",
    "width: 100%",
    "height: 100%",
    "border: none",
    "border-radius: 0",
    "box-shadow: none",
    "z-index: 2147483646",
    "background: transparent",
    "transition: opacity 0.2s ease, transform 0.2s ease",
    "opacity: 0",
    "transform: translateY(12px)",
  ].join(";");

  function isProductPage() {
    return !!document.querySelector('.product[itemtype="https://schema.org/Product"][itemscope]');
  }

  function postProductContextToIframe() {
    if (!isProductPage()) return;
    try {
      iframe.contentWindow.postMessage(
        { type: "AI_WIDGET_SET_PRODUCT_CONTEXT", url: window.location.href },
        WIDGET_URL
      );
    } catch (e) {}
  }

  iframe.addEventListener("load", function () {
    setTimeout(postProductContextToIframe, 400);
  });

  var btn = document.createElement("button");

  function renderClosedButton() {
    if (hasClicked) {
      btn.innerHTML =
        '<span style="font-size:14px;font-weight:600;white-space:nowrap;">AI Експерт</span>' +
        '<img src="' + WIDGET_URL + '/_next/image?url=%2Fcleaning-robot-3d-icon-png-download-13763983.png&w=128&q=75" alt="" style="width:68px;height:68px;margin-right:10px;flex-shrink:0;position:absolute;right:-17px;top:-29px;" />';
      btn.style.padding = "6px 52px 3px 18px";
      btn.style.height = "37px";
      btn.style.right = "20px";
      btn.style.borderRadius = "999px";
      return;
    }
    btn.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:flex-start;margin-right:8px;gap:8px">' +
      '<span style="font-size:14px;font-weight:600;white-space:nowrap;">Експерт з прибирання</span>' +
      '<span id="ai-cleaning-widget-typing" style="font-size:14px;font-weight:500;white-space:nowrap;"></span>' +
      "</div>" +
      '<img src="' + WIDGET_URL + '/_next/image?url=%2Fcleaning-robot-3d-icon-png-download-13763983.png&w=128&q=75" alt="" style="width:68px;height:68px;margin-right:10px;flex-shrink:0;position:absolute;right:-32px;top:-7px;" />';
    btn.style.padding = "6px 44px 3px 18px";
    btn.style.height = "64px";
    btn.style.right = "37px";
    btn.style.borderRadius = "999px 0px 999px 999px";
  }

  renderClosedButton();
  btn.style.cssText = [
    "position: fixed",
    "bottom: 92px",
    "right: 37px",
    "height: 64px",
    "display: flex",
    "align-items: center",
    "background: linear-gradient(257deg, rgb(255 151 151), rgb(118, 82, 255))",
    "color: #fff",
    "border: none",
    "border-radius: 999px 0px 999px 999px",
    "padding: 6px 44px 3px 18px",
    "cursor: pointer",
    "z-index: 2147483647",
    "box-shadow: rgba(118, 82, 255, 0.4) 0px 4px 16px, inset 0px -1px 0px #ffffff6e",
    "font-family: inherit",
    "line-height: 1",
    "transition: background 0.15s ease, transform 0.15s ease",
  ].join(";");
  renderClosedButton();

  function applyProductPageClickedState() {
    if (!isProductPage()) return;
    hasClicked = true;
    try { window.localStorage.setItem(HAS_CLICKED_KEY, "1"); } catch (e) {}
    renderClosedButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyProductPageClickedState);
  } else {
    applyProductPageClickedState();
  }

  var btnGradient = "linear-gradient(257deg, rgb(255 151 151), rgb(118, 82, 255))";
  var btnGradientHover = "linear-gradient(257deg, rgb(235 131 131), rgb(98, 62, 235))";

  btn.addEventListener("mouseover", function () {
    btn.style.background = btnGradientHover;
    btn.style.transform = "scale(1.03)";
  });
  btn.addEventListener("mouseout", function () {
    btn.style.background = btnGradient;
    btn.style.transform = "scale(1)";
  });

  function open() {
    isOpen = true;
    iframe.style.display = "block";
    requestAnimationFrame(function () {
      iframe.style.opacity = "1";
      iframe.style.transform = "translateY(0)";
    });
    btn.style.display = "none";
    setTimeout(function () {
      iframe.contentWindow.postMessage({ type: "AI_WIDGET_FOCUS_INPUT" }, WIDGET_URL);
    }, 500);
  }

  function close() {
    isOpen = false;
    iframe.style.opacity = "0";
    iframe.style.transform = "translateY(12px)";
    setTimeout(function () { iframe.style.display = "none"; }, 200);
    renderClosedButton();
    btn.style.background = btnGradient;
    btn.style.display = "block";
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== WIDGET_URL) return;
    var data = event.data || {};
    if (data.type === "AI_WIDGET_CLOSE") close();
  });

  btn.addEventListener("click", function () {
    if (!hasClicked) {
      hasClicked = true;
      try { window.localStorage.setItem(HAS_CLICKED_KEY, "1"); } catch (e) {}
    }
    isOpen ? close() : open();
  });

  var typingPhrases = [
    "Підібрати рішення чистоти ? :)",
    "Ідеально помити вікна ? ;)",
    "... або ж почистити бруківку ? :)",
    "Підберемо ідеальне рішення...",
    "Справимось з будь-яким забрудненням ;)",
  ];
  var typingIndex = 0;
  var typingCharIndex = 0;
  var typingSpeed = 60;
  var typingPause = 6000;

  function runTyping() {
    var el = document.getElementById("ai-cleaning-widget-typing");
    if (hasClicked || !el || isOpen) { setTimeout(runTyping, 300); return; }
    var phrase = typingPhrases[typingIndex];
    el.textContent = phrase.slice(0, typingCharIndex + 1);
    typingCharIndex++;
    if (typingCharIndex >= phrase.length) {
      setTimeout(function () {
        typingCharIndex = 0;
        typingIndex = (typingIndex + 1) % typingPhrases.length;
        setTimeout(runTyping, typingSpeed);
      }, typingPause);
    } else {
      setTimeout(runTyping, typingSpeed);
    }
  }
  runTyping();

  window.addEventListener("DOMContentLoaded", function () {
    var _isMobile = window.innerWidth <= 768;
    iframe.style.right = _isMobile ? "0px" : "-76px";
    iframe.style.bottom = _isMobile ? "0px" : "50px";
    iframe.style.top = _isMobile ? "0px" : "0px";
  });
  document.body.appendChild(iframe);
  document.body.appendChild(btn);
})();`;
}

/** Returns error JS that logs a warning to console. */
function getErrorJs(reason: string): string {
  return `console.warn("[AI Widget] ${reason}");`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  // No token — legacy mode: check origin = appiclean.com.ua
  if (!token) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    let refererOrigin: string | null = null;
    if (referer) {
      try { refererOrigin = new URL(referer).origin; } catch { /* ignore */ }
    }
    const isAllowed =
      origin === LEGACY_ALLOWED_ORIGIN || refererOrigin === LEGACY_ALLOWED_ORIGIN;

    if (!isAllowed) {
      return new NextResponse(getErrorJs("Forbidden: origin not allowed"), {
        status: 403,
        headers: { "Content-Type": "text/javascript; charset=utf-8" },
      });
    }

    return new NextResponse(getWidgetJs(null), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  // Token present — validate project + subscription + products
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try { requestOrigin = new URL(referer).origin; } catch { /* ignore */ }
  }

  const result = await validateWidgetToken(token, requestOrigin);

  if (!result.valid) {
    const messages: Record<string, string> = {
      not_found: "Invalid widget token",
      expired: "Widget subscription has expired. Contact the site administrator.",
      no_subscription: "Widget subscription has expired. Contact the site administrator.",
      domain_mismatch: "This widget token is not authorized for this domain.",
      no_products: "No products configured for this widget.",
    };
    return new NextResponse(getErrorJs(messages[result.reason] ?? "Token invalid"), {
      status: 403,
      headers: { "Content-Type": "text/javascript; charset=utf-8" },
    });
  }

  return new NextResponse(getWidgetJs(token), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
