/* A small note on client demos opened on their own (from a shared link or search), pointing to the project page.
   Added to each demo's start page by scripts/build-work.py. Hidden when the demo runs inside the site's popup or project page. */
(function () {
  try { if (window.self !== window.top) return; } catch (e) { return; }
  var me = document.currentScript;
  if (!me) return;
  var href = me.getAttribute("data-href"), title = me.getAttribute("data-title") || "", client = me.getAttribute("data-client") || "";
  function add() {
    var bar = document.createElement("div");
    bar.setAttribute("role", "note");
    bar.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);" +
      "padding:8px 8px 8px 14px;border-radius:999px;background:rgba(17,18,20,.92);color:#f4f2ee;box-shadow:0 8px 24px rgba(0,0,0,.3);" +
      "font:13px/1.3 'Open Sans',Arial,sans-serif;letter-spacing:.01em";
    var text = document.createElement("span");
    text.textContent = "Demo" + (client ? " from " + client : "") + (title ? ": " + title : "");
    text.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    var link = document.createElement("a");
    link.href = href; link.textContent = "Read the brief";
    link.style.cssText = "flex:none;padding:6px 12px;border-radius:999px;background:#c80000;color:#fff;text-decoration:none;font-weight:600";
    var close = document.createElement("button");
    close.type = "button"; close.setAttribute("aria-label", "Hide this note"); close.textContent = "×";
    close.style.cssText = "flex:none;width:28px;height:28px;border:0;border-radius:50%;background:transparent;color:#f4f2ee;font-size:18px;cursor:pointer";
    close.onclick = function () { bar.remove(); };
    bar.appendChild(text); bar.appendChild(link); bar.appendChild(close);
    document.body.appendChild(bar);
  }
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();
