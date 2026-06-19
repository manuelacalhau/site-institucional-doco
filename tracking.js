(function initDocoTracking(windowObject, documentObject) {
  "use strict";

  const containerId = "GTM-WJ7MXFDT";
  const siteName = "site_institucional";

  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.docoTrack = function docoTrack(eventName, parameters = {}) {
    windowObject.dataLayer.push({
      event: eventName,
      site_name: siteName,
      page_path: windowObject.location.pathname,
      ...parameters
    });
  };

  windowObject.dataLayer.push({
    event: "doco_context",
    site_name: siteName,
    page_type: documentObject.body.classList.contains("start-digital-page") ? "product" : "content"
  });

  const gtmScript = documentObject.createElement("script");
  gtmScript.async = true;
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  documentObject.head.appendChild(gtmScript);

  if (documentObject.body.classList.contains("start-digital-page")) {
    windowObject.docoTrack("view_item", {
      item_id: "start_digital",
      item_name: "Start Digital"
    });
  }

  documentObject.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const url = new URL(link.href, windowObject.location.href);
    const ctaText = link.textContent.trim().replace(/\s+/g, " ").slice(0, 100);
    const common = {
      cta_text: ctaText,
      link_domain: url.hostname,
      link_path: url.pathname
    };

    if (["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname)) {
      windowObject.docoTrack("whatsapp_click", common);
      return;
    }

    if (url.hostname === "pay.hotmart.com") {
      windowObject.docoTrack("begin_checkout", {
        ...common,
        item_id: "start_digital",
        item_name: "Start Digital"
      });
      return;
    }

    if (url.hostname === "cal.com") {
      windowObject.docoTrack("schedule_click", common);
      return;
    }

    if (url.hostname === "quiz.agenciadoco.com.br") {
      windowObject.docoTrack("quiz_click", common);
      return;
    }

    if (url.hostname === "gestaodejornada.agenciadoco.com.br") {
      windowObject.docoTrack("product_click", {
        ...common,
        item_id: "gestao_de_jornada"
      });
      return;
    }

    if (link.classList.contains("button") || link.classList.contains("nav-cta")) {
      windowObject.docoTrack("cta_click", common);
      return;
    }

    if (link.closest(".blog-card")) {
      windowObject.docoTrack("select_content", {
        ...common,
        content_type: "article"
      });
      return;
    }

    windowObject.docoTrack("link_click", common);
  });

  let scroll75Tracked = false;
  windowObject.addEventListener("scroll", () => {
    if (scroll75Tracked) return;
    const scrollableHeight = documentObject.documentElement.scrollHeight - windowObject.innerHeight;
    if (scrollableHeight > 0 && windowObject.scrollY / scrollableHeight >= 0.75) {
      scroll75Tracked = true;
      windowObject.docoTrack("scroll_75", { percent_scrolled: 75 });
    }
  }, { passive: true });
})(window, document);
