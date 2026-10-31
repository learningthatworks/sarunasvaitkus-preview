/* ==========================================================================
   Homepage behaviour (/ and /lt/). Plain JavaScript, no libraries.

   1. Popup      One popup for projects, tools and case studies. It is the
                 browser's own <dialog> element with the page shown in a frame.
                 Project and case study pages already have an "embed" mode
                 (glass_common.py adds .cs-embed inside a frame), so the popup
                 shows the same page a visitor would open in a new tab.
                 While it is open, the address bar shows that page's own
                 address, and the share icon copies it, so a shared link lands
                 on the project, tool or case study page itself.
   2. Filter     The "Client work" buttons show or hide cards by category.
                 Cards are already sorted newest first by build-home.py.
   3. Slider     The recommendations: one at a time, with arrows, dots,
                 arrow keys and swipe.

   Replaces jQuery, Bootstrap JS, Magnific Popup, Owl Carousel, Isotope and
   the old theme.js (removed 29 Oct 2026).
   ========================================================================== */
(function () {
  "use strict";

  var LT = /^lt/.test(document.documentElement.lang || "");
  var T = LT
    ? {
        close: "Uždaryti",
        copy: "Dalintis nuoroda",
        copied: "Nuoroda nukopijuota",
        project: "Projektas",
        tool: "Įrankis",
        case: "Projekto istorija",
        rec: "Rekomendacija",
      }
    : { close: "Close", copy: "Share link", copied: "Link copied", project: "Project", tool: "Tool", case: "Case study", rec: "Recommendation" };

  /* ---------- 1. Popup ---------------------------------------------------- */

  var dlg = null,
    frame = null,
    label = null,
    share = null,
    pageUrl = "", // the page shown in the popup
    homeUrl = location.pathname + location.search + location.hash; // the address under the popup

  // Build the dialog once, on first use.
  function build() {
    dlg = document.createElement("dialog");
    dlg.className = "pop";
    dlg.innerHTML =
      '<div class="pop-bar"><span class="pop-label"></span>' +
      '<span class="pop-tools"><button type="button" class="pop-share" aria-label="' +
      T.copy +
      '" title="' +
      T.copy +
      '">' +
      ICON_SHARE +
      "</button>" +
      '<button type="button" class="pop-x" autofocus aria-label="' +
      T.close +
      '">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      "</button></span></div>" +
      '<iframe class="pop-frame" title=""></iframe>';
    document.body.appendChild(dlg);
    frame = dlg.querySelector(".pop-frame");
    label = dlg.querySelector(".pop-label");
    share = dlg.querySelector(".pop-share");
    share.addEventListener("click", shareLink);

    dlg.querySelector(".pop-x").addEventListener("click", close);
    // a click on the dimmed backdrop (outside the sheet) closes the popup
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) close();
    });
    // the frame fades in once its page has loaded
    frame.addEventListener("load", function () {
      frame.classList.add("is-ready");
    });
    // Escape: use the same fading close instead of the browser's instant one
    dlg.addEventListener("cancel", function (e) {
      e.preventDefault();
      close();
    });
    // tidy up after every kind of close
    dlg.addEventListener("close", function () {
      frame.classList.remove("is-ready");
      load("about:blank"); // stops videos and demos
      document.documentElement.classList.remove("pop-open");
      // closed with the button, Escape, the backdrop or Back: the homepage address returns.
      // replaceState, not history.back(): it is instant, so quick open and close never leaves the page.
      try {
        history.replaceState({ svHome: 1 }, "", homeUrl);
      } catch (e) {}
    });
  }

  // Load a page into the frame without adding a history entry, so Back closes the popup
  // instead of stepping back inside the frame.
  function load(href) {
    try {
      frame.contentWindow.location.replace(href);
    } catch (e) {
      frame.src = href;
    }
  }

  // The address bar shows the page in the popup. Back closes the popup.
  function showAddress(href, replace) {
    pageUrl = href;
    var u = new URL(href, location.href);
    var path = u.pathname + u.search;
    var st = history.state || {};
    try {
      // one history entry for the popup at most: reuse it, or the homepage entry a popup left behind
      if (replace || st.svPop || st.svHome) history.replaceState({ svPop: 1 }, "", path);
      else history.pushState({ svPop: 1 }, "", path);
    } catch (e) {}
  }
  window.addEventListener("popstate", function (e) {
    if (dlg && dlg.open && !(e.state && e.state.svPop)) close();
  });

  // Share icon in the popup bar; a tick and "Link copied" for two seconds after a copy
  var ICON_SHARE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  var ICON_DONE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function setShare(done) {
    share.innerHTML = done ? ICON_DONE : ICON_SHARE;
    share.setAttribute("aria-label", done ? T.copied : T.copy);
    share.title = done ? T.copied : T.copy;
  }

  // Copy link: the share sheet on phones, the clipboard elsewhere
  function shareLink() {
    var url = new URL(pageUrl, location.href).href;
    var done = function () {
      setShare(true);
      setTimeout(function () {
        setShare(false);
      }, 2000);
    };
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      navigator.share({ title: frame.contentDocument ? frame.contentDocument.title : "", url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () {
        window.prompt(T.copy, url);
      });
    } else {
      window.prompt(T.copy, url);
    }
  }

  // Open a page in the popup. kind: "project", "tool" or "case".
  function open(href, kind) {
    if (!dlg) build();
    closeOthers();
    label.textContent = T[kind] || T.project;
    frame.title = label.textContent;
    dlg.classList.remove("is-closing");
    frame.classList.remove("is-ready");
    load(href);
    if (share) setShare(false);
    showAddress(href);
    document.documentElement.classList.add("pop-open");
    if (!dlg.open) dlg.showModal();
  }

  // Close with a short fade (home.css .is-closing). Without motion, or if the
  // animation never ends, the dialog still closes after 300ms.
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function close() {
    if (!dlg || !dlg.open || dlg.classList.contains("is-closing")) return;
    if (REDUCE) return dlg.close();
    dlg.classList.add("is-closing");
    var done = function () {
      dlg.removeEventListener("animationend", done);
      clearTimeout(t);
      if (!dlg.classList.contains("is-closing")) return; // reopened meanwhile
      dlg.classList.remove("is-closing");
      if (dlg.open) dlg.close();
    };
    var t = setTimeout(done, 300);
    dlg.addEventListener("animationend", done);
  }

  // The contact form and the AI assistant also cover the page: only one at a time.
  function closeOthers() {
    var contact = document.querySelector("dialog.svc-dlg[open]");
    if (contact) contact.close();
    var x = document.querySelector(".sva-panel.open .sva-close");
    if (x) x.click();
  }

  // Shared with contact.js and assistant.js, which close the popup before they open.
  window.svPop = {
    open: open,
    close: close,
    isOpen: function () {
      return !!(dlg && dlg.open);
    },
  };

  // Which links open in the popup: cards and tool links carry data-pop, and every
  // case study link on the homepage opens there too (except the "full page" ones).
  function kindOf(a) {
    if (a.hasAttribute("data-pop")) return a.getAttribute("data-pop") || "project";
    if (/\/case-studies\/[^/]+\/$/.test(a.getAttribute("href") || "") && !a.classList.contains("case-full"))
      return "case";
    return null;
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented) return;
    // Ctrl, Cmd, Shift or a middle click keeps the browser's own behaviour: the page opens in another tab.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var kind = kindOf(a);
    if (!kind) return;
    e.preventDefault();
    open(a.href, kind);
  });

  // A case study inside the popup asks for another case study: load it in the same frame.
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || !e.data.svCase || !frame) return;
    frame.classList.remove("is-ready");
    load(e.data.svCase);
    showAddress(e.data.svCase, true);
  });

  // Old links such as /#pgi-popup-3 or /#sms open that project (map written by build-home.py).
  function openFromHash() {
    var id = (location.hash || "").slice(1),
      slug = (window.SV_WORK || {})[id];
    if (!slug) return;
    var a = document.querySelector('a[data-pop][href$="/work/' + slug + '/"]');
    if (a) open(a.href, a.getAttribute("data-pop") || "project");
  }

  /* ---------- 2. Portfolio filter ------------------------------------------ */

  function filter() {
    var buttons = [].slice.call(document.querySelectorAll(".pf-filters [data-filter]"));
    var cards = [].slice.call(document.querySelectorAll(".pfs > .pf"));
    if (!buttons.length) return;
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.classList.contains("active")));
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter"); // "*" or a class selector such as ".motion"
        buttons.forEach(function (o) {
          o.classList.toggle("active", o === b);
          o.setAttribute("aria-pressed", String(o === b));
        });
        cards.forEach(function (c) {
          c.hidden = !(f === "*" || c.matches(f));
          // shown cards fade and rise in again (home.css .pf-in)
          c.classList.remove("pf-in");
          if (!c.hidden) {
            void c.offsetWidth; // restart the animation
            c.classList.add("pf-in");
          }
        });
      });
    });
  }

  /* ---------- 3. Recommendations slider ------------------------------------ */

  function slider() {
    var box = document.getElementById("quotes");
    if (!box) return;
    var slides = box.querySelectorAll(".q"),
      dots = box.querySelector(".qs-dots"),
      count = box.querySelector(".qs-count"),
      cur = 0;
    slides.forEach(function (sl, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "qs-dot";
      d.setAttribute("aria-label", T.rec + " " + (i + 1));
      d.addEventListener("click", function () {
        go(i);
      });
      dots.appendChild(d);
    });
    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (sl, k) {
        sl.classList.toggle("is-on", k === cur);
        sl.setAttribute("aria-hidden", String(k !== cur));
      });
      dots.querySelectorAll(".qs-dot").forEach(function (d, k) {
        d.setAttribute("aria-current", String(k === cur));
      });
      count.textContent = cur + 1 + " / " + slides.length;
    }
    box.querySelectorAll(".qs-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        go(cur + +b.dataset.d);
      });
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(cur + 1);
      if (e.key === "ArrowLeft") go(cur - 1);
    });
    var x0 = null; // swipe: a horizontal drag of more than 50px changes the slide
    box.addEventListener("pointerdown", function (e) {
      x0 = e.clientX;
    });
    box.addEventListener("pointerup", function (e) {
      if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(cur + (e.clientX < x0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  }

  function start() {
    filter();
    slider();
    openFromHash();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
