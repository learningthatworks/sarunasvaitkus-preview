/* "Message me" contact form in a modal. Any element with [data-contact] opens it.
   Sends to the same endpoint as the AI assistant's contact form (action "contact"),
   which forwards the message to Telegram and saves the lead. */
(function () {
  var ENDPOINT = "https://bmtnfhppzrkztmqzwrhx.supabase.co/functions/v1/chat";
  var LINKEDIN = "https://www.linkedin.com/in/vaitkus";

  var css =
    ".svc-dlg{width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 32px);padding:0;border:1px solid var(--glass-edge,#ddd);border-top:1px solid var(--red,#c80000);" +
    "background:var(--glass-panel,#f7f6f3);color:var(--ink,#141518);-webkit-backdrop-filter:blur(var(--panel-blur,18px));backdrop-filter:blur(var(--panel-blur,18px));" +
    "box-shadow:0 30px 80px -30px rgba(0,0,0,.5);overflow:auto}" +
    ".svc-dlg::backdrop{background:rgba(10,11,13,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
    ".svc-in{position:relative;padding:clamp(22px,4vw,40px)}" +
    ".svc-dlg h2{margin:0 40px 6px 0;font:400 clamp(26px,3vw,34px)/1.1 var(--display,Oswald,sans-serif);text-transform:uppercase;letter-spacing:.02em}" +
    ".svc-dlg .svc-sub{margin:0 0 20px;font:italic 400 16px/1.55 var(--body,'Open Sans',sans-serif);color:var(--ink-2,#2b2e33)}" +
    ".svc-x{position:absolute;top:14px;right:14px;width:40px;height:40px;border:1px solid var(--line,#cfccc5);border-radius:50%;background:transparent;color:var(--ink,#141518);font:300 22px/1 sans-serif;cursor:pointer}" +
    ".svc-x:hover{color:var(--red,#c80000);border-color:var(--red,#c80000)}" +
    ".svc-f{margin:0 0 14px}.svc-f label{display:block;margin:0 0 6px;font:400 12px/1.3 var(--display,Oswald,sans-serif);letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#3d4248)}" +
    ".svc-f label span{letter-spacing:0;text-transform:none;font-family:var(--body,sans-serif)}" +
    ".svc-f input,.svc-f textarea{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid var(--line,#cfccc5);border-radius:0;background:var(--card,#fff);color:var(--ink,#141518);font:400 16px/1.4 var(--body,'Open Sans',sans-serif)}" +
    ".svc-f input:focus,.svc-f textarea:focus{outline:2px solid var(--red,#c80000);outline-offset:1px}" +
    ".svc-f [aria-invalid=true]{border-color:var(--red,#c80000)}" +
    ".svc-priv{margin:4px 0 16px;font:400 13px/1.5 var(--body,sans-serif);color:var(--muted,#3d4248)}" +
    ".svc-err{min-height:1.2em;margin:0 0 10px;font:400 14px/1.4 var(--body,sans-serif);color:var(--red-text,#a80000)}" +
    ".svc-bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center}" +
    ".svc-send{min-height:46px;padding:0 24px;border:1px solid var(--ink,#141518);border-radius:50px;background:var(--ink,#141518);color:var(--paper,#fff);cursor:pointer;font:400 14px/1 var(--display,Oswald,sans-serif);letter-spacing:.14em;text-transform:uppercase}" +
    ".svc-send:hover{background:var(--red,#c80000);border-color:var(--red,#c80000);color:#fff}.svc-send[disabled]{opacity:.6;cursor:wait}" +
    ".svc-done{margin:6px 0 0;font:400 17px/1.6 var(--body,sans-serif)}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

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
      '<div class="svc-bar"><button type="submit" class="svc-send">' + S.send + '</button></div>' +
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
          '<a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a>.';
      });
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  function open(e) {
    if (e) e.preventDefault();
    if (!dlg) build();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    var first = dlg.querySelector("input");
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

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
