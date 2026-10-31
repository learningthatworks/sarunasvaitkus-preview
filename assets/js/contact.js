/* "Message me" contact form in a modal. Any element with [data-contact] opens it.
   Sends to the same endpoint as the AI assistant's contact form (action "contact"),
   which forwards the message to Telegram and saves the lead. */
(function () {
  var ENDPOINT = "https://bmtnfhppzrkztmqzwrhx.supabase.co/functions/v1/chat";
  var LINKEDIN = "https://www.linkedin.com/in/vaitkus";

  // Styles live in assets/css/theme.css ("Contact form" / "AI assistant" sections), not in this script.

  var LT = /^lt/.test(document.documentElement.lang || "");
  var S = LT ? {
    close: "Uždaryti", title: "Aprašykite poreikį", sub: "Parašykite, ką darbuotojai turi išmokti, kokią sistemą diegiate ar kokia medžiaga neveikia. Atsakau per dvi darbo dienas.",
    name: "Vardas", org: "Organizacija", email: "El. paštas", note: "Ką norite išspręsti?", noteHint: "", when: "Kada sprendimo reikėtų?", opt: "neprivaloma",
    priv: "Jūsų duomenys pasieks tik Šarūną, kad jis galėtų atsakyti.", send: "Siųsti užklausą", sending: "Siunčiama…",
    noName: "Įrašykite savo vardą.", noEmail: "Įrašykite tinkamą el. pašto adresą, kad galėčiau atsakyti.",
    thanks: function (n) { return "Ačiū, " + n + ". Jūsų žinutė gauta, atsakysiu per dvi darbo dienas."; },
    fail: "Jei vis nepavyksta, parašykite Šarūnui "
  } : {
    close: "Close", title: "Message me", sub: "Tell me what you need, who it is for and the deadline. I reply within two working days.",
    name: "Your name", org: "Organisation or agency", email: "Email address", note: "Your project", noteHint: " <span>(what, for whom, by when)</span>", when: "", opt: "optional",
    priv: "Your details go to Šarūnas only, so he can reply.", send: "Send message", sending: "Sending…",
    noName: "Please add your name.", noEmail: "Please add a valid email address so I can reply.",
    thanks: function (n) { return "Thanks, " + n + ". Your message is with me, and I will reply within two working days."; },
    fail: "If it keeps failing, message Šarūnas on "
  };
  var dlg, form, err, send;
  function build() {
    dlg = document.createElement("dialog");
    dlg.className = "svc-dlg";
    dlg.setAttribute("aria-labelledby", "svc-h");
    dlg.innerHTML =
      '<div class="svc-in">' +
      '<button type="button" class="svc-x" aria-label="' + S.close + '">×</button>' +
      '<h2 id="svc-h">' + S.title + '</h2>' +
      '<p class="svc-sub">' + S.sub + '</p>' +
      '<form novalidate>' +
      field("name", S.name, "text", "name", true) +
      field("org", S.org, "text", "organization", false) +
      field("email", S.email, "email", "email", true) +
      '<div class="svc-f"><label for="svc-note">' + S.note + S.noteHint + '</label>' +
      '<textarea id="svc-note" name="note" rows="4" maxlength="2000"></textarea></div>' +
      (S.when ? field("when", S.when, "text", "off", false) : "") +
      '<p class="svc-priv">' + S.priv + '</p>' +
      '<p class="svc-err" role="alert"></p>' +
      '<div class="svc-bar"><button type="submit" class="sv-btn svc-send">' + S.send + '</button></div>' +
      "</form></div>";
    function field(k, label, type, ac, req) {
      return '<div class="svc-f"><label for="svc-' + k + '">' + label + (req ? "" : " <span>(" + S.opt + ")</span>") + "</label>" +
        '<input id="svc-' + k + '" name="' + k + '" type="' + type + '" autocomplete="' + ac + '" maxlength="200"' + (req ? " required" : "") + "></div>";
    }
    document.body.appendChild(dlg);
    form = dlg.querySelector("form");
    err = dlg.querySelector(".svc-err");
    send = dlg.querySelector(".svc-send");
    dlg.querySelector(".svc-x").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false");
      err.textContent = "";
    });
    form.addEventListener("submit", submit);
  }

  function submit(e) {
    e.preventDefault();
    var f = form.elements;
    var c = { name: f.name.value.trim(), organisation: f.org.value.trim(), email: f.email.value.trim(), note: f.note.value.trim() };
    if (f.when && f.when.value.trim()) c.note += "\n\nKada: " + f.when.value.trim();
    if (LT) c.note = "[LT svetainė] " + c.note;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);
    f.name.setAttribute("aria-invalid", String(!c.name));
    f.email.setAttribute("aria-invalid", String(!emailOk));
    if (!c.name) { err.textContent = S.noName; f.name.focus(); return; }
    if (!emailOk) { err.textContent = S.noEmail; f.email.focus(); return; }
    send.disabled = true;
    send.textContent = S.sending;
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "contact", contact: c, messages: [] }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.sent) throw new Error((res.j && res.j.error) || "Not sent");
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "generate_lead", form: "contact" });
        var first = c.name.split(/\s+/)[0];
        form.outerHTML = '<p class="svc-done" role="status">' + S.thanks(esc(first)) + "</p>";
      })
      .catch(function (e2) {
        send.disabled = false;
        send.textContent = S.send;
        var server = e2 && e2.message && e2.message !== "Not sent" ? e2.message : "";
        if (/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.test(server)) server = "";
        err.innerHTML = (server ? esc(server) + " " : "") + esc(S.fail) +
          '<a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn<span class="sv-vh">' +
          (LT ? " (atsidaro naujame skirtuke)" : " (opens in a new tab)") + "</span></a>.";
      });
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  function closeAssistant() {
    var panel = document.querySelector(".sva-panel.open");
    var x = panel && panel.querySelector(".sva-close");
    if (x) x.click();
  }
  // the homepage project popup (home.js) covers the page too: only one at a time
  function closePopup() {
    if (window.svPop && window.svPop.isOpen()) window.svPop.close();
  }
  function open(e) {
    if (e) e.preventDefault();
    closeAssistant();
    closePopup();
    if (!dlg) build();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    var first = dlg.querySelector("input");
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  document.addEventListener("click", function (e) {
    var pop = e.target.closest && e.target.closest("[data-pop]");
    if (pop) {
      closeAssistant();
      if (dlg && dlg.open) dlg.close();
    }
  }, true);
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-contact]");
    if (t) {
      open(e);
      // service buttons pass a topic, which starts the project note so the message says what it is about
      var topic = t.getAttribute("data-topic"), note = dlg && dlg.querySelector("#svc-note");
      if (topic && note && !note.value.trim()) note.value = topic + ": ";
      return;
    }
    // "Ask my AI assistant" links open the assistant panel
    var ai = e.target.closest && e.target.closest("[data-ask-ai]");
    if (ai) {
      e.preventDefault();
      var b = document.querySelector(".sva-btn");
      if (b) b.click();
    }
  });
  window.svContact = open;
})();
