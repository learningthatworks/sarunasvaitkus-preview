/* sarunasvaitkus.com AI assistant widget.
   Talks to the Supabase Edge Function "site-chat". No dependencies. */
(function () {
  "use strict";
  var ENDPOINT = "https://bmtnfhppzrkztmqzwrhx.supabase.co/functions/v1/site-chat";
  var PUBLISHABLE_KEY = "sb_publishable_A8RWHL2jW7DWAlSM78ikJA_nchtZbRR";
  var STORE = "sv-assistant-v2";
  var LT = /^lt/.test(document.documentElement.lang || "");
  var UI = LT ? {
    ask: "Paklausti AI asistento",
    title: "Šarūno AI asistentas",
    close: "Uždaryti asistentą",
    question: "Jūsų klausimas",
    placeholder: "Klauskite apie jo darbą",
    send: "Siųsti",
    hint: "Užpildykite formą viršuje.",
    cancel: "Atšaukti",
    sendTo: "Siųsti Šarūnui",
    greeting: "Sveiki, aš Šarūno AI asistentas. Atsakau į klausimus apie jo darbą pagal paskelbtą medžiagą ir galiu perduoti jam žinutę.",
    disclaimer: "AI asistentas. Atsakymai paremti Šarūno paskelbta medžiaga ir gali būti netikslūs. Dėl įpareigojančių dalykų paprašykite perduoti žinutę.",
    sources: "Šaltiniai:",
    contactAria: "Susisiekti su Šarūnu",
    contactH: "Parašykite Šarūnui",
    name: "Jūsų vardas",
    org: "Jūsų organizacija",
    email: "Jūsų el. pašto adresas",
    note: "Trumpa pastaba apie numatytą rolę",
    optional: "neprivaloma",
    privacy: "Jūsų duomenys ir šis pokalbis pasieks tik Šarūną, kad jis galėtų atsakyti.",
    needName: "Įrašykite savo vardą.",
    needEmail: "Įrašykite tinkamą el. pašto adresą, kad Šarūnas galėtų atsakyti.",
    sending: "Siunčiama…",
    sent: "Žinutė išsiųsta Šarūnui.",
    thinking: "Galvoju…"
  } : {
    ask: "Ask my AI assistant",
    title: "Šarūnas's AI assistant",
    close: "Close assistant",
    question: "Your question",
    placeholder: "Ask about his work",
    send: "Send",
    hint: "Fill in the form above.",
    cancel: "Cancel",
    sendTo: "Send to Šarūnas",
    greeting: "Hi, I'm Šarūnas's AI assistant. I answer questions about his work from his published material, and I can pass a message to him.",
    disclaimer: "AI assistant. Answers come from Šarūnas's published material and can be wrong. For anything binding, ask for a handoff.",
    sources: "Sources:",
    contactAria: "Contact Šarūnas",
    contactH: "Send Šarūnas a message",
    name: "Your name",
    org: "Your organisation",
    email: "Your email address",
    note: "A short note on the role you have in mind",
    optional: "optional",
    privacy: "Your details and this conversation go to Šarūnas only, so he can reply.",
    needName: "Please add your name.",
    needEmail: "Please add a valid email address so Šarūnas can reply.",
    sending: "Sending…",
    sent: "Message sent to Šarūnas.",
    thinking: "Thinking…"
  };
  var GREETING = UI.greeting;
  var DISCLAIMER = UI.disclaimer;
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

  // Styles live in assets/css/theme.css ("Contact form" / "AI assistant" sections), not in this script.

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sva-btn";
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-controls", "sva-panel");
  btn.innerHTML = ICON + "<span>" + UI.ask + "</span>";

  var panel = document.createElement("section");
  panel.id = "sva-panel";
  panel.className = "sva-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "sva-title");
  panel.innerHTML =
    '<div class="sva-head"><h2 id="sva-title">' + UI.title + '</h2>' +
    '<button type="button" class="sva-close" aria-label="' + UI.close + '">×</button></div>' +
    '<p class="sva-note"></p>' +
    '<div class="sva-log" aria-live="polite"></div>' +
    '<form class="sva-form"><label for="sva-input" style="position:absolute;left:-9999px">' + UI.question + '</label>' +
    '<textarea id="sva-input" rows="1" maxlength="2000" placeholder="' + UI.placeholder + '"></textarea>' +
    '<button type="submit" class="sv-btn sva-send">' + UI.send + '</button></form>' +
    '<div class="sva-formbar"><p class="sva-hint">' + UI.hint + '</p>' +
    '<button type="button" class="sv-btn-outline sva-cancel">' + UI.cancel + '</button>' +
    '<button type="submit" class="sv-btn-2 sva-formsend">' + UI.sendTo + '</button></div>';

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
    return UI.sources + "\n" + citations.map(function (c) { return c.title + ": " + c.url; }).join("\n");
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
        return '<a href="' + href + '" target="_blank" rel="noopener">' + clean +
          '<span class="sv-vh">' + (LT ? " (atsidaro naujame skirtuke)" : " (opens in a new tab)") + "</span></a>" + tail;
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
    if (!on) { formSend.removeAttribute("form"); formSend.disabled = false; formSend.textContent = UI.sendTo; }
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
    card.setAttribute("aria-label", UI.contactAria);
    card.innerHTML =
      "<h3>" + UI.contactH + "</h3>" +
      field("name", UI.name, "text", "name", true) +
      field("org", UI.org, "text", "organization", false) +
      field("email", UI.email, "email", "email", true) +
      '<div class="sva-field"><label for="sva-c-note-' + n + '">' + UI.note + ' <span>(' + UI.optional + ')</span></label>' +
      '<textarea id="sva-c-note-' + n + '" name="note" maxlength="2000" rows="3"></textarea></div>' +
      '<p class="sva-privacy">' + UI.privacy + '</p>' +
      '<p class="sva-err" role="alert"></p>';
    function field(key, label, type, ac, req) {
      return '<div class="sva-field"><label for="sva-c-' + key + "-" + n + '">' + label + (req ? "" : " <span>(" + UI.optional + ")</span>") + "</label>" +
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
      if (!contact.name) { err.textContent = UI.needName; f.name.focus(); return; }
      if (!emailOk) { err.textContent = UI.needEmail; f.email.focus(); return; }
      err.textContent = "";
      submit.disabled = true;
      submit.textContent = UI.sending;
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
          card.innerHTML = '<p class="sva-done">' + UI.sent + '</p>';
          formMode(false);
          bubble("assistant", res.j.reply);
          state.messages.push({ role: "assistant", content: res.j.reply, sig: res.j.sig });
          save();
        })
        .catch(function (e2) {
          submit.disabled = false;
          submit.textContent = UI.sendTo;
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
    if (open) {
      var contact = document.querySelector("dialog.svc-dlg[open]");
      if (contact) contact.close();
      if (window.svPop && window.svPop.isOpen()) window.svPop.close();   // the homepage project popup (home.js)
    }
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
    var typing = bubble("assistant", UI.thinking, "sva-typing");
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

  window.svAssistant = { open: function () { setOpen(true); }, close: function () { setOpen(false); } };
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
