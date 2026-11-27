/* ==========================================================================
   Standard footer for tools and apps that live outside sarunasvaitkus.com
   (VibeList, FlexTab, SCORM Package Editor, Vaikend, Kidness, School Tracker…).

   Add one line before </body> in the app:
     <script src="https://sarunasvaitkus.com/assets/js/sv-footer.js" defer
             data-app="VibeList"></script>

   Optional attributes:
     data-app     the app's name, used in the link's tracking (default: the host name)
     data-lang    "en" or "lt" (default: the page's <html lang>, then English)
     data-theme   "light", "dark" or "auto" (default "auto": follows the visitor's system)
     data-target  a CSS selector; the footer goes inside that element instead of
                  at the end of <body> (for apps whose layout needs it elsewhere)

   The footer sits in a shadow root, so the app's CSS cannot change it and its CSS
   cannot change the app. It is hidden when the app runs inside a frame (for example
   in the popup on sarunasvaitkus.com), because the site already shows its own frame.
   Links carry utm_source=<app>&utm_medium=app-footer, so Google Analytics shows
   which app sent the visit. Change this file once and every app updates.
   ========================================================================== */
(function () {
  "use strict";
  try {
    if (window.self !== window.top) return; // inside a frame: the host page has its own footer
  } catch (e) {
    return;
  }
  var me = document.currentScript;
  if (!me || document.querySelector("sv-app-footer")) return; // only once per page

  var SITE = "https://sarunasvaitkus.com";
  var app = me.getAttribute("data-app") || location.hostname;
  var lang = (me.getAttribute("data-lang") || document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  var theme = me.getAttribute("data-theme") || "auto";
  var LT = lang === "lt";
  // The standard text. Links: metability.ai, the site, its work list and its services.
  // EN: "© metability.ai | Made by sarunasvaitkus.com | Need something similar? Explore my work and services."
  var T = LT
    ? { made: "Sukūrė", need: "Reikia kažko panašaus?", explore: "Peržiūrėkite mano", work: "darbus", and: "ir", services: "paslaugas", label: "Apie kūrėją" }
    : { made: "Made by", need: "Need something similar?", explore: "Explore my", work: "work", and: "and", services: "services", label: "About the maker" };
  var base = SITE + (LT ? "/lt/" : "/");

  function track(url) {
    var sep = url.indexOf("?") > -1 ? "&" : "?";
    var hash = "";
    var i = url.indexOf("#");
    if (i > -1) {
      hash = url.slice(i);
      url = url.slice(0, i);
    }
    return url + sep + "utm_source=" + encodeURIComponent(app) + "&utm_medium=app-footer&utm_campaign=tools" + hash;
  }

  var CSS =
    ":host{all:initial;display:block}" +
    ".f{--ink:#141518;--muted:#5d6067;--line:rgba(20,21,24,.14);--bg:#f7f6f3;--red:#c80000;" +
    "box-sizing:border-box;width:100%;margin:0;padding:12px clamp(16px,4vw,40px);text-align:center;" +
    "background:var(--bg);color:var(--muted);border-top:1px solid var(--line);" +
    "font:400 14px/1.6 Inter,'Segoe UI',system-ui,-apple-system,Arial,sans-serif}" +
    ".f.dark{--ink:#f1efea;--muted:#b4b7bd;--line:rgba(255,255,255,.14);--bg:#16181b;--red:#ff6b6b}" +
    "@media (prefers-color-scheme:dark){.f.auto{--ink:#f1efea;--muted:#b4b7bd;--line:rgba(255,255,255,.14);--bg:#16181b;--red:#ff6b6b}}" +
    ".part{white-space:nowrap}" +           /* each part wraps as a whole on narrow screens */
    ".sep{margin:0 .6em;opacity:.6}" +
    "a{color:var(--ink);text-decoration:underline 1px var(--red);text-underline-offset:3px;" +
    "display:inline-block;padding:10px 0}" + /* 44px tall touch target with the line height */
    "a:hover{text-decoration-thickness:2px}" +
    "a:focus-visible{outline:2px solid var(--red);outline-offset:3px;border-radius:2px}" +
    "@media (max-width:640px){.f{line-height:1.5}.sep{display:none}.part{display:block;white-space:normal;padding:4px 0}a{display:inline;padding:0}}";

  function build() {
    if (document.querySelector("sv-app-footer")) return;
    var host = document.createElement("sv-app-footer");
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style");
    style.textContent = CSS;
    var box = document.createElement("p");
    box.className = "f " + (theme === "dark" ? "dark" : theme === "light" ? "" : "auto");
    box.setAttribute("role", "complementary");
    box.setAttribute("aria-label", T.label);
    box.setAttribute("lang", LT ? "lt" : "en");

    function link(text, href) {
      var a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      return a;
    }
    function part(nodes) {
      var span = document.createElement("span");
      span.className = "part";
      nodes.forEach(function (n) {
        span.appendChild(typeof n === "string" ? document.createTextNode(n) : n);
      });
      return span;
    }
    function sep() {
      var span = document.createElement("span");
      span.className = "sep";
      span.setAttribute("aria-hidden", "true");
      span.textContent = "|";
      return span;
    }
    // © metability.ai | Made by sarunasvaitkus.com | Need something similar? Explore my work and services.
    box.appendChild(part(["© ", link("metability.ai", "https://metability.ai/?utm_source=" + encodeURIComponent(app) + "&utm_medium=app-footer")]));
    box.appendChild(sep());
    box.appendChild(part([T.made + " ", link("sarunasvaitkus.com", track(base))]));
    box.appendChild(sep());
    box.appendChild(
      part([T.need + " " + T.explore + " ", link(T.work, track(base + "#work")), " " + T.and + " ", link(T.services, track(base + "#what")), "."])
    );

    root.appendChild(style);
    root.appendChild(box);

    var sel = me.getAttribute("data-target");
    var parent = (sel && document.querySelector(sel)) || document.body;
    parent.appendChild(host);
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
