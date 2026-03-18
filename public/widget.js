(function () {
  var WIDGET_URL = "https://ai-cleaning-admin.vercel.app";
  var ALLOWED_ORIGIN = "https://appiclean.com.ua";

  if (window.location.origin !== ALLOWED_ORIGIN) {
    return;
  }

  var isMobile = window.innerWidth <= 768;
  var isOpen = false;

  // Iframe
  var iframe = document.createElement("iframe");
  iframe.src = WIDGET_URL;
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

  // Toggle button
  var btn = document.createElement("button");
  btn.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:flex-start;margin-right:8px;gap:8px">' +
    '<span style="font-size:14px;font-weight:600;white-space:nowrap;">Експерт з прибирання</span>' +
    '<span id="ai-cleaning-widget-typing" style="font-size:14px;font-weight:500;white-space:nowrap;"></span>' +
    "</div>" +
    '<img src="https://ai-cleaning-admin.vercel.app/_next/image?url=%2Fcleaning-robot-3d-icon-png-download-13763983.png&w=128&q=75&dpl=dpl_GAxsCZRip8byAL3Ts69Jip9R6X6A" alt="АІ Експерт з прибирання" style="width:68px;height:68px;margin-right:10px;flex-shrink:0;position:absolute;right:-32px;top:-7px;" />';
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
    // Trigger transition on next frame
    requestAnimationFrame(function () {
      iframe.style.opacity = "1";
      iframe.style.transform = "translateY(0)";
    });
    btn.innerHTML =
      '<span style="font-size:14px;font-weight:600;">Закрити</span>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:8px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    btn.style.padding = "8px 18px";
    btn.style.right = "20px";
    btn.style.height = "44px";
    btn.style.display = isMobile ? "none" : "block"

      setTimeout(() => {
        iframe.contentWindow.postMessage(
          { type: "AI_WIDGET_FOCUS_INPUT" },
          "https://ai-cleaning-admin.vercel.app"
        );
      }, 500);
  }

  function close() {
    isOpen = false;
    iframe.style.opacity = "0";
    iframe.style.transform = "translateY(12px)";
    setTimeout(function () {
      iframe.style.display = "none";
    }, 200);
    btn.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:flex-start;margin-right:8px;gap:8px">' +
      '<span style="font-size:14px;font-weight:600;white-space:nowrap; display: flex;">Експерт з прибирання</span>' +
      '<span id="ai-cleaning-widget-typing" style="font-size:14px;font-weight:500;white-space:nowrap; height: 22px; display: flex;"></span>' +
      "</div>" +
      '<img src="https://ai-cleaning-admin.vercel.app/_next/image?url=%2Fcleaning-robot-3d-icon-png-download-13763983.png&w=128&q=75&dpl=dpl_GAxsCZRip8byAL3Ts69Jip9R6X6A" alt="АІ Експерт з прибирання" style="width:68px;height:68px;margin-right:10px;flex-shrink:0;position:absolute;right:-32px;top:-7px;" />';
    btn.style.padding = "8px 48px 3px 18px";
    btn.style.height = "64px";
    btn.style.right = "37px";
    btn.style.background = btnGradient;
    btn.style.display = "block"
  }

  // Allow the iframe app to request closing the widget
  window.addEventListener("message", function (event) {
    if (event.origin !== WIDGET_URL) return;
    var data = event.data || {};
    if (data.type === "AI_WIDGET_CLOSE") {
      close();
    }
  });

  btn.addEventListener("click", function () {
    isOpen ? close() : open();

  });

  // Simple typing animation for the secondary line of text
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

    // If button is in 'open' state or element missing, retry later
    if (!el || isOpen) {
      setTimeout(runTyping, 300);
      return;
    }

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

  // Start typing loop
  runTyping();

  window.addEventListener("DOMContentLoaded", function () {
    var _isMobile = window.innerWidth <= 768;
    iframe.style.right = _isMobile ? "0px" : "-76px";
    iframe.style.bottom = _isMobile ? "0px" : "50px";
    iframe.style.top = _isMobile ? "0px" : "0px";
  });
  document.body.appendChild(iframe);
  document.body.appendChild(btn);
})();
