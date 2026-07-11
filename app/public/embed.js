/* Gavah embed loader.
 * Usage:
 *   <script src="https://DOMAIN/embed.js" async></script>
 *   <div data-gavah-wall="your-slug"></div>
 * Injects an iframe per div and auto-resizes it via postMessage.
 * Vanilla JS, no dependencies — keep under 4KB.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    return;
  }

  function mount(el) {
    if (el.getAttribute("data-gavah-mounted")) return;
    var slug = el.getAttribute("data-gavah-wall");
    if (!slug || !/^[a-z0-9-]{3,32}$/.test(slug)) return;
    el.setAttribute("data-gavah-mounted", "1");

    var frame = document.createElement("iframe");
    frame.src = origin + "/w/" + encodeURIComponent(slug);
    frame.title = "Gavah wall";
    frame.loading = "lazy";
    frame.style.width = "100%";
    frame.style.border = "0";
    frame.style.display = "block";
    frame.style.minHeight = "200px";
    frame.setAttribute("allow", "autoplay; fullscreen");
    el.appendChild(frame);

    window.addEventListener("message", function (event) {
      if (event.origin !== origin) return;
      var data = event.data;
      if (!data || data.type !== "gavah:height" || data.slug !== slug) return;
      if (event.source !== frame.contentWindow) return;
      var h = Number(data.height);
      if (h > 0 && h < 100000) frame.style.height = h + "px";
    });
  }

  function init() {
    var els = document.querySelectorAll("[data-gavah-wall]");
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
