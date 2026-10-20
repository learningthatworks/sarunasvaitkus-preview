/* sarunasvaitkus.com AI assistant widget.
   Talks to the Supabase Edge Function "site-chat". No dependencies. */
(function () {
  "use strict";
  var ENDPOINT = "https://bmtnfhppzrkztmqzwrhx.supabase.co/functions/v1/site-chat";
  var PUBLISHABLE_KEY = "sb_publishable_A8RWHL2jW7DWAlSM78ikJA_nchtZbRR";
  var STORE = "sv-assistant-v2";
  var GREETING =
    "Hi, I'm Šarūnas's AI assistant. I answer questions about his work from his published material, and I can pass a message to him.";
  var DISCLAIMER =
    "AI assistant. Answers come from Šarūnas's published material and can be wrong. For anything binding, ask for a handoff.";
  var LT = /^lt/.test(document.documentElement.lang || "");
  var LINKEDIN = "https://www.linkedin.com/in/vaitkus";
  var HANDOFF = LT
    ? "Naudokite kontaktų formą arba parašykite Šarūnui „LinkedIn“: " + LINKEDIN
    : "Use the contact form or message Šarūnas on LinkedIn: " + LINKEDIN;
  var OFFLINE = LT
    ? "Asistento šiuo metu pasiekti nepavyksta. " + HANDOFF
    : "The assistant can't be reached right now. " + HANDOFF;
  var WENT_WRONG = LT
    ? "Atsiprašome, kažkas nepavyko. " + HANDOFF
    : "Sorry, something went wrong. " + HANDOFF;
  var FORM_FAIL = (LT ? "Jei vis nepavyksta, " : "If it keeps failing, ") + HANDOFF.charAt(0).toLowerCase() + HANDOFF.slice(1);
  var ICON =
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';

  var state = { open: false, busy: false, messages: [], sent: false };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.messages)) state.messages = saved.messages.slice(-20);
    if (saved && saved.sent) state.sent = true;
  } catch (e) { /* storage unavailable */ }

  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify({ messages: state.messages, sent: state.sent })); } catch (e) { /* ignore */ }
  }

  var css =
    ".sva-btn{position:fixed;right:20px;bottom:84px;z-index:9998;display:flex;align-items:center;gap:8px;" +
    "background:var(--sva-ink);color:var(--sva-bg);border:0;border-left:5px solid var(--red, #c80000);border-radius:0;min-height:44px;padding:12px 18px;font:500 16px/1 Oswald,'Arial Narrow',sans-serif;letter-spacing:.5px;text-transform:uppercase;" +
    "box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}" +
    ".sva-btn:focus-visible,.sva-panel button:focus-visible,.sva-panel textarea:focus-visible,.sva-panel input:focus-visible{outline:3px solid var(--red, #c80000);outline-offset:2px}" +
    "/* Vaitkus EdTech design system values (assets/css/tokens.css); hard-coded because the homepage does not load tokens.css */" +
    ".sva-btn,.sva-panel{--sva-bg:#fafafa;--sva-ink:#2a2a2a;--sva-muted:#5b6168;--sva-line:#dde0e4;--sva-me:#f4f5f7;--sva-bot:#fbeaea;--sva-card:#f8f9fa;--sva-err:#b00020}" +
    ":root[data-theme=dark] .sva-btn,:root[data-theme=dark] .sva-panel{--sva-bg:#1a1d20;--sva-ink:#eceef0;--sva-muted:#a3a9b0;--sva-line:#2f3439;--sva-me:#0e1116;--sva-bot:#2c1d1f;--sva-card:#111315;--sva-err:#ff8a8a}" +
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .sva-btn,:root:not([data-theme=light]) .sva-panel{--sva-bg:#1a1d20;--sva-ink:#eceef0;--sva-muted:#a3a9b0;--sva-line:#2f3439;--sva-me:#0e1116;--sva-bot:#2c1d1f;--sva-card:#111315;--sva-err:#ff8a8a}}" +
    // the panel is a <section>: theme.css pads every section by 80px, so padding and margin are reset
    ".sva-panel{position:fixed;right:20px;bottom:84px;z-index:9999;width:min(400px,calc(100vw - 32px));height:min(600px,calc(100vh - 120px));height:min(600px,calc(100dvh - 120px));padding:0;margin:0;" +
    "display:none;flex-direction:column;background:var(--sva-bg);color:var(--sva-ink);border:1px solid var(--sva-line);border-radius:0;" +
    "box-shadow:0 12px 40px rgba(0,0,0,.3);font:15px/1.5 'Open Sans',system-ui,sans-serif;overflow:hidden}" +
    ".sva-panel.open{display:flex}" +
    ".sva-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--sva-bg);color:var(--sva-ink);border-top:4px solid var(--red, #c80000);border-bottom:1px solid var(--sva-line)}" +
    ".sva-head h2{margin:0;font:500 19px/1.2 Oswald,'Arial Narrow',sans-serif;letter-spacing:.5px;color:var(--sva-ink);text-transform:uppercase}" +
    ".sva-close{background:transparent;border:0;color:var(--sva-ink);font-size:24px;line-height:1;cursor:pointer;min-width:44px;min-height:44px}" +
    ".sva-note{margin:0;padding:8px 14px;font-size:12px;color:var(--sva-muted);border-bottom:1px solid var(--sva-line)}" +
    ".sva-log{flex:1;min-height:0;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px}" +
    ".sva-msg{max-width:88%;padding:8px 12px;border-radius:0;white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".sva-msg a{color:var(--sva-ink);text-decoration-color:var(--red, #c80000);text-decoration-thickness:2px;text-underline-offset:3px}" +
    ".sva-bot{align-self:flex-start;background:var(--sva-bot)}" +
    ".sva-me{align-self:flex-end;background:var(--sva-me)}" +
    ".sva-typing{color:var(--sva-muted);font-style:italic}" +
    ".sva-card{align-self:stretch;background:var(--sva-card);border:1px solid var(--sva-line);border-radius:0;padding:12px;display:grid;gap:10px}" +
    ".sva-card h3{margin:0;font:600 14px/1.3 'Open Sans',system-ui,sans-serif}" +
    ".sva-field{display:grid;gap:4px}" +
    ".sva-field label{font-size:13px;font-weight:600}" +
    ".sva-field label span{font-weight:400;color:var(--sva-muted)}" +
    ".sva-field input,.sva-field textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--sva-line);border-radius:0;background:var(--sva-bg);color:var(--sva-ink);font:inherit;font-size:14px}" +
    ".sva-field textarea{resize:vertical;min-height:64px}" +
    ".sva-field [aria-invalid=true]{border-color:var(--sva-err)}" +
    ".sva-err{font-size:12px;color:var(--sva-err);min-height:1em;margin:0}" +
    ".sva-card .sva-privacy{font-size:12px;color:var(--sva-muted);margin:0}" +
    ".sva-primary{background:var(--sva-ink);color:var(--sva-bg);border:0;border-radius:0;min-height:44px;padding:9px 14px;font:600 14px 'Open Sans',sans-serif;cursor:pointer}" +
    ".sva-primary[disabled]{opacity:.55;cursor:default}" +
    ".sva-done{font-size:14px;margin:0}" +
    ".sva-form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--sva-line)}" +
    ".sva-form textarea{flex:1;resize:none;min-height:44px;max-height:120px;padding:9px 10px;border:1px solid var(--sva-line);border-radius:0;" +
    "background:var(--sva-bg);color:var(--sva-ink);font:inherit}" +
    ".sva-send{background:var(--sva-ink);color:var(--sva-bg);border:0;border-radius:0;min-width:44px;padding:0 14px;font-weight:600;cursor:pointer}" +
    ".sva-send[disabled]{opacity:.5;cursor:default}" +
    ".sva-formbar{display:none;gap:8px;align-items:center;justify-content:space-between;padding:10px;border-top:1px solid var(--sva-line);background:var(--sva-card)}" +
    ".sva-formbar .sva-hint{font-size:12px;color:var(--sva-muted);margin:0;flex:1}" +
    ".sva-ghost{background:transparent;color:var(--sva-ink);border:1px solid var(--sva-line);border-radius:0;min-height:44px;padding:9px 12px;font:600 14px 'Open Sans',sans-serif;cursor:pointer}" +
    ".sva-panel.sva-formmode{height:min(760px,calc(100vh - 104px));height:min(760px,calc(100dvh - 104px))}" +
    ".sva-panel.sva-formmode .sva-form{display:none}" +
    ".sva-panel.sva-formmode .sva-formbar{display:flex}" +
    // phones, the Galaxy Fold and short landscape screens: the panel fills the visible screen;
    // --sva-h and --sva-top come from fit() below and follow the on-screen keyboard
    "@media (max-width:767px),(max-height:560px){" +
      ".sva-panel,.sva-panel.sva-formmode{left:0;right:0;bottom:auto;top:var(--sva-top,0px);width:100%;max-width:none;height:100vh;height:100dvh;" +
      "border:0;box-shadow:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box}" +
      ".sva-panel.sva-fit{height:var(--sva-h)}" +
      ".sva-panel textarea,.sva-panel input{font-size:16px}" +  /* below 16px iPhones zoom in on focus */
      ".sva-btn{right:12px;bottom:76px}" +
      "html.sva-lock,html.sva-lock body{overflow:hidden!important;overscroll-behavior:none}" +
    "}" +
    // touch screens of any size (iPads too) zoom in on inputs smaller than 16px
    "@media (pointer:coarse){.sva-panel textarea,.sva-panel input{font-size:16px}}" +
    "@media print{.sva-btn,.sva-panel{display:none!important}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sva-btn";
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-controls", "sva-panel");
  btn.innerHTML = ICON + "<span>Ask my AI assistant</span>";

  var panel = document.createElement("section");
  panel.id = "sva-panel";
  panel.className = "sva-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "sva-title");
  panel.innerHTML =
    '<div class="sva-head"><h2 id="sva-title">Šarūnas\'s AI assistant</h2>' +
    '<button type="button" class="sva-close" aria-label="Close assistant">×</button></div>' +
    '<p class="sva-note"></p>' +
    '<div class="sva-log" aria-live="polite"></div>' +
    '<form class="sva-form"><label for="sva-input" style="position:absolute;left:-9999px">Your question</label>' +
    '<textarea id="sva-input" rows="1" maxlength="2000" placeholder="Ask about his work"></textarea>' +
    '<button type="submit" class="sva-send">Send</button></form>' +
    '<div class="sva-formbar"><p class="sva-hint">Fill in the form above.</p>' +
    '<button type="button" class="sva-ghost sva-cancel">Cancel</button>' +
    '<button type="submit" class="sva-primary sva-formsend">Send to Šarūnas</button></div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var log = panel.querySelector(".sva-log");
  var input = panel.querySelector("#sva-input");
  var send = panel.querySelector(".sva-send");
  panel.querySelector(".sva-note").textContent = DISCLAIMER;

  function apiHeaders() {
    return { "Content-Type": "application/json", apikey: PUBLISHABLE_KEY };
  }

  function formatSources(citations) {
    return "Sources:\n" + citations.map(function (c) { return c.title + ": " + c.url; }).join("\n");
  }

  function linkify(text) {
    var div = document.createElement("div");
    div.textContent = text;
    var html = div.innerHTML;
    // An address in a reply is never shown. The visitor is sent to the form or LinkedIn instead.
    html = html.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, HANDOFF);
    html = html.replace(
      /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|ai|dev|org|lt)(?:\/[^\s<]*)?)/gi,
      function (m) {
        var clean = m.replace(/[.,)]+$/, "");
        var tail = m.slice(clean.length);
        var href = /^https?:\/\//i.test(clean) ? clean : "https://" + clean;
        return '<a href="' + href + '" target="_blank" rel="noopener">' + clean + "</a>" + tail;
      }
    );
    return html;
  }

  function bubble(role, text, extra) {
    var el = document.createElement("div");
    el.className = "sva-msg " + (role === "user" ? "sva-me" : "sva-bot") + (extra ? " " + extra : "");
    el.innerHTML = linkify(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  var formCount = 0;
  var formSend = panel.querySelector(".sva-formsend");
  var formCancel = panel.querySelector(".sva-cancel");

  // While the contact form is open, the chat box is swapped for a footer bar with the
  // form's own Send and Cancel buttons, so the right button is always visible.
  function formMode(on) {
    panel.classList.toggle("sva-formmode", on);
    if (!on) { formSend.removeAttribute("form"); formSend.disabled = false; formSend.textContent = "Send to Šarūnas"; }
  }
  formCancel.addEventListener("click", function () {
    var c = log.querySelector(".sva-card");
    if (c) c.remove();
    formMode(false);
    input.focus();
  });

  function contactCard() {
    if (state.sent) return;
    var old = log.querySelector(".sva-card");
    if (old) old.remove();
    var n = ++formCount;
    var card = document.createElement("form");
    card.id = "sva-card-" + n;
    card.className = "sva-card";
    card.noValidate = true;
    card.setAttribute("aria-label", "Contact Šarūnas");
    card.innerHTML =
      "<h3>Send Šarūnas a message</h3>" +
      field("name", "Your name", "text", "name", true) +
      field("org", "Your organisation", "text", "organization", false) +
      field("email", "Your email address", "email", "email", true) +
      '<div class="sva-field"><label for="sva-c-note-' + n + '">A short note on the role you have in mind <span>(optional)</span></label>' +
      '<textarea id="sva-c-note-' + n + '" name="note" maxlength="2000" rows="3"></textarea></div>' +
      '<p class="sva-privacy">Your details and this conversation go to Šarūnas only, so he can reply.</p>' +
      '<p class="sva-err" role="alert"></p>';
    function field(key, label, type, ac, req) {
      return '<div class="sva-field"><label for="sva-c-' + key + "-" + n + '">' + label + (req ? "" : " <span>(optional)</span>") + "</label>" +
        '<input id="sva-c-' + key + "-" + n + '" name="' + key + '" type="' + type + '" autocomplete="' + ac + '" maxlength="200"' + (req ? " required" : "") + "></div>";
    }
    log.appendChild(card);
    formSend.setAttribute("form", card.id);
    formMode(true);
    // Show the form from its heading, with the reply above it still in reach.
    setTimeout(function () { log.scrollTop = Math.max(0, card.offsetTop - log.offsetTop - 8); }, 0);
    var err = card.querySelector(".sva-err");
    var submit = formSend;
    card.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false");
      err.textContent = "";
    });
    card.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = card.elements;
      var contact = {
        name: f.name.value.trim(),
        organisation: f.org.value.trim(),
        email: f.email.value.trim(),
        note: f.note.value.trim(),
      };
      f.name.setAttribute("aria-invalid", String(!contact.name));
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
      f.email.setAttribute("aria-invalid", String(!emailOk));
      if (!contact.name) { err.textContent = "Please add your name."; f.name.focus(); return; }
      if (!emailOk) { err.textContent = "Please add a valid email address so Šarūnas can reply."; f.email.focus(); return; }
      err.textContent = "";
      submit.disabled = true;
      submit.textContent = "Sending…";
      fetch(ENDPOINT, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ action: "contact", contact: contact, messages: state.messages.slice(-20) }),
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.sent) throw new Error((res.j && (res.j.error || res.j.reply)) || "Not sent");
          state.sent = true;
          save();
          card.innerHTML = '<p class="sva-done">Message sent to Šarūnas.</p>';
          formMode(false);
          bubble("assistant", res.j.reply);
          state.messages.push({ role: "assistant", content: res.j.reply, sig: res.j.sig });
          save();
        })
        .catch(function (e2) {
          submit.disabled = false;
          submit.textContent = "Send to Šarūnas";
          var server = e2 && e2.message && e2.message !== "Not sent" ? e2.message : "";
          if (/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.test(server)) server = "";
          err.textContent = (server ? server + " " : "") + FORM_FAIL;
        });
    });
    setTimeout(function () { card.querySelector("input").focus({ preventScroll: true }); }, 50);
  }

  function render() {
    log.innerHTML = "";
    formMode(false);
    bubble("assistant", GREETING);
    state.messages.forEach(function (m) {
      bubble(m.role, m.content);
      if (m.role === "assistant" && m.citations && m.citations.length) {
        bubble("assistant", formatSources(m.citations));
      }
    });
  }

  // Phones: size the panel to the part of the screen the visitor can see. visualViewport shrinks when the
  // on-screen keyboard opens and when the browser bars show, so the input always stays in view.
  var small = window.matchMedia("(max-width: 767px), (max-height: 560px)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var vv = window.visualViewport;
  function fit() {
    var on = state.open && small.matches;
    document.documentElement.classList.toggle("sva-lock", on);   // the page behind does not scroll
    panel.classList.toggle("sva-fit", on);
    if (!on) return;
    panel.style.setProperty("--sva-h", (vv ? vv.height : window.innerHeight) + "px");
    panel.style.setProperty("--sva-top", (vv ? vv.offsetTop : 0) + "px");
    if (document.activeElement === input) log.scrollTop = log.scrollHeight;
  }
  if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
  window.addEventListener("resize", fit);
  if (small.addEventListener) small.addEventListener("change", fit);

  var chatTracked = false;
  function setOpen(open) {
    state.open = open;
    panel.classList.toggle("open", open);
    btn.style.display = open ? "none" : "flex";
    btn.setAttribute("aria-expanded", String(open));
    fit();
    if (open && !chatTracked) {
      chatTracked = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "chat_open" });
    }
    if (open) {
      render();
      // with a mouse, type straight away; on touch screens wait for a tap so the keyboard does not cover the greeting
      if (finePointer.matches) setTimeout(function () { input.focus(); }, 30);
      else panel.querySelector(".sva-close").focus({ preventScroll: true });
    } else { btn.focus(); }
  }

  function ask(text) {
    state.messages.push({ role: "user", content: text });
    save();
    bubble("user", text);
    var typing = bubble("assistant", "Thinking…", "sva-typing");
    state.busy = true;
    send.disabled = true;
    fetch(ENDPOINT, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ messages: state.messages.slice(-20) }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var reply = (j && j.reply) || WENT_WRONG;
        var turn = { role: "assistant", content: reply };
        if (j && j.sig) turn.sig = j.sig;
        if (j && j.citations && j.citations.length) turn.citations = j.citations.slice();
        state.messages.push(turn);
        save();
        typing.remove();
        bubble("assistant", reply);
        if (turn.citations && turn.citations.length) bubble("assistant", formatSources(turn.citations));
        if (j && j.form) contactCard();
      })
      .catch(function () {
        typing.remove();
        bubble("assistant", OFFLINE);
      })
      .then(function () {
        state.busy = false;
        send.disabled = false;
        if (!log.querySelector(".sva-card")) input.focus();
      });
  }

  btn.addEventListener("click", function () { setOpen(true); });
  panel.querySelector(".sva-close").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state.open) setOpen(false); });
  panel.querySelector(".sva-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || state.busy) return;
    input.value = "";
    ask(text);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); panel.querySelector(".sva-form").requestSubmit(); }
  });
})();
