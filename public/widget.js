(function () {
  var WIDGET_URL = "https://ai-cleaning-admin.vercel.app";
  var ALLOWED_ORIGIN = "https://appiclean.com.ua";

  if (window.location.origin !== ALLOWED_ORIGIN) {
    return;
  }

  var isOpen = false;

  // Iframe
  var iframe = document.createElement("iframe");
  iframe.src = WIDGET_URL;
  iframe.setAttribute("allowtransparency", "true");
  iframe.style.cssText = [
    "display: none",
    "position: fixed",
    "bottom: 30px",
    "right: -36px",
    "width: 440px",
    "height: 640px",
    "border: none",
    "border-radius: 16px",
    "box-shadow: 0 8px 40px rgba(0,0,0,0.18)",
    "z-index: 2147483646",
    "background: #fff",
    "transition: opacity 0.2s ease, transform 0.2s ease",
    "opacity: 0",
    "transform: translateY(12px)",
  ].join(";");

  // Toggle button
  var btn = document.createElement("button");
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
    '<span style="margin-left:8px;font-size:14px;font-weight:600;">Підібрати засіб</span>';
  btn.style.cssText = [
    "position: fixed",
    "bottom: 24px",
    "right: 24px",
    "display: flex",
    "align-items: center",
    "background: #2563eb",
    "color: #fff",
    "border: none",
    "border-radius: 999px",
    "padding: 12px 20px",
    "cursor: pointer",
    "z-index: 2147483647",
    "box-shadow: 0 4px 16px rgba(37,99,235,0.4)",
    "font-family: inherit",
    "line-height: 1",
    "transition: background 0.15s ease, transform 0.15s ease",
  ].join(";");

  btn.addEventListener("mouseover", function () {
    btn.style.background = "#1d4ed8";
    btn.style.transform = "scale(1.03)";
  });
  btn.addEventListener("mouseout", function () {
    btn.style.background = "#2563eb";
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
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '<span style="margin-left:8px;font-size:14px;font-weight:600;">Закрити</span>';
  }

  function close() {
    isOpen = false;
    iframe.style.opacity = "0";
    iframe.style.transform = "translateY(12px)";
    setTimeout(function () {
      iframe.style.display = "none";
    }, 200);
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<span style="margin-left:8px;font-size:14px;font-weight:600;">Підібрати засіб</span>';
  }

  btn.addEventListener("click", function () {
    isOpen ? close() : open();
  });

  document.body.appendChild(iframe);
  document.body.appendChild(btn);
})();
