/* Homepage hero: three rotating slides in the site heading and lead styles (markup in scripts/build-home.py).
   Slide 1 shows first. Slides change every 7 seconds; hovering or focusing the hero pauses them,
   and any click on a slide button or the pause button stops the rotation for good.
   With reduced motion the slides never change on their own. All slide text is in the HTML. */
(function () {
  var box = document.querySelector(".hero-slides");
  if (!box) return;
  var slides = [].slice.call(box.querySelectorAll(".hs"));
  var tabs = [].slice.call(box.querySelectorAll(".hs-tab"));
  var play = box.querySelector(".hs-play");
  var live = box.querySelector(".hs-stage");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DELAY = 7000, cur = 0, timer = null, auto = !reduce, held = false;

  function show(i, fromUser) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle("is-on", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      if ("inert" in s) s.inert = !on;
    });
    tabs.forEach(function (t, k) {
      t.setAttribute("aria-selected", k === cur ? "true" : "false");
      t.tabIndex = k === cur ? 0 : -1;
    });
    // announce only changes the visitor asked for
    live.setAttribute("aria-live", fromUser ? "polite" : "off");
    restart();
  }
  function restart() {
    clearTimeout(timer);
    box.classList.remove("is-timing");
    if (!auto || held) return;
    void box.offsetWidth; // restart the progress bar animation
    box.classList.add("is-timing");
    timer = setTimeout(function () { show(cur + 1, false); }, DELAY);
  }
  function setAuto(on) {
    auto = on;
    box.classList.toggle("is-paused", !on);
    var lt = /^lt/.test(document.documentElement.lang || "");
    play.setAttribute("aria-label", lt ? (on ? "Sustabdyti skaidres" : "Paleisti skaidres") : (on ? "Pause the slides" : "Play the slides"));
    play.setAttribute("aria-pressed", on ? "false" : "true");
    restart();
  }

  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { setAuto(false); show(k, true); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault(); setAuto(false); show(cur + d, true); tabs[cur].focus();
    });
  });
  play.addEventListener("click", function () { setAuto(!auto); });
  // pause while the visitor is reading or using the hero
  box.addEventListener("mouseenter", function () { held = true; restart(); });
  box.addEventListener("mouseleave", function () { held = false; restart(); });
  box.addEventListener("focusin", function () { held = true; restart(); });
  box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) { held = false; restart(); } });
  // a link or button inside a slide counts as interaction: stop the rotation
  box.addEventListener("click", function (e) { if (e.target.closest(".hs a, .hs button")) setAuto(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else restart(); });

  // "See learning work" and similar links: jump to Selected work and switch its filter
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-pf-filter]");
    if (!a) return;
    var b = document.querySelector('.filters button[data-filter="' + a.getAttribute("data-pf-filter") + '"]');
    if (b) setTimeout(function () { b.click(); }, 60);
  });

  setAuto(auto);
  show(0, false);
})();
