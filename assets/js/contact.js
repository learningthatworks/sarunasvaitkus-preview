/* Contact form on /contact/ and /lt/contact/.
   The fields are in the page HTML. This script only checks them and sends.
   Same endpoint as before (action "contact"): the chat function stores the lead
   and forwards the message to Telegram. */
(function () {
  var ENDPOINT = "https://bmtnfhppzrkztmqzwrhx.supabase.co/functions/v1/chat";
  // Find-bar and footer "Ask my AI assistant" links. The panel button is hidden
  // while the bar is on the page, so these links open it.
  document.addEventListener("click", function (e) {
    var ai = e.target.closest && e.target.closest("[data-ask-ai]");
    if (!ai) return;
    e.preventDefault();
    var b = document.querySelector(".sva-btn");
    if (b) b.click();
  });

  // Footer privacy link is /privacy/ on the live site and /<base>/privacy/ on the preview.
  function siteRoot() {
    var link = document.querySelector('#site-foot a[href*="priva"]');
    if (!link) return "";
    var href = link.getAttribute("href") || "";
    var at = href.search(/\/(?:lt\/)?priva/);
    return at > 0 ? href.slice(0, at) : "";
  }
  function thanksUrl(given) {
    var url = given || "thanks/";
    if (url.charAt(0) !== "/") return url;
    return siteRoot() + url;
  }

  var form = document.querySelector("form[data-contact-form]");
  if (!form) return;

  var note = form.elements.note;
  try {
    var topic = new URLSearchParams(location.search).get("topic");
    if (topic && note && !note.value.trim()) note.value = topic.replace(/\s+/g, " ").trim() + ": ";
  } catch (e) {}

  var err = form.querySelector(".svc-err");
  var fail = form.querySelector(".svc-fail");
  var send = form.querySelector(".svc-send");
  var lt = form.getAttribute("data-lt") === "1";

  function say(el, text) {
    if (el) el.textContent = text || "";
  }

  form.addEventListener("input", function (e) {
    if (e.target && e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false");
    say(err, "");
    if (fail) fail.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var consent = f.consent;
    var c = {
      name: f.name.value.trim(),
      organisation: f.org.value.trim(),
      email: f.email.value.trim(),
      note: f.note.value.trim()
    };
    if (f.when && f.when.value.trim()) c.note += "\n\nKada: " + f.when.value.trim();
    if (consent && consent.checked) {
      c.note += lt
        ? "\n\nSutikimas: siuntėjas sutiko, kad šie duomenys būtų naudojami atsakymui."
        : "\n\nConsent: the sender agreed these details may be used to reply.";
    }
    if (lt) c.note = "[LT svetainė] " + c.note;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);
    var consentOk = !!(consent && consent.checked);
    f.name.setAttribute("aria-invalid", String(!c.name));
    f.email.setAttribute("aria-invalid", String(!emailOk));
    if (consent) consent.setAttribute("aria-invalid", String(!consentOk));
    if (!c.name) { say(err, form.getAttribute("data-msg-name")); f.name.focus(); return; }
    if (!emailOk) { say(err, form.getAttribute("data-msg-email")); f.email.focus(); return; }
    if (!consentOk) { say(err, form.getAttribute("data-msg-consent")); consent.focus(); return; }
    send.disabled = true;
    send.textContent = form.getAttribute("data-msg-sending") || "Sending...";
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "contact", contact: c, messages: [] })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.sent) throw new Error((res.j && res.j.error) || "Not sent");
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "generate_lead", form: "contact" });
        var first = c.name.split(/\s+/)[0];
        try { sessionStorage.setItem("sv-contact-name", first); } catch (err2) {}
        location.assign(thanksUrl(form.getAttribute("data-thanks")));
      })
      .catch(function (e2) {
        send.disabled = false;
        send.textContent = form.getAttribute("data-msg-send") || "Send message";
        var server = e2 && e2.message && e2.message !== "Not sent" ? e2.message : "";
        if (/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.test(server)) server = "";
        say(err, server);
        if (fail) fail.hidden = false;
      });
  });
})();
