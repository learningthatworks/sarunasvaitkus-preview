/* Homepage hero: three rotating slides in the site heading and lead styles (markup in scripts/build-home.py).
   Slide 1 shows first. Slides change every 7 seconds; hovering or focusing a slide holds them.
   A slide tab or a link in a slide stops the rotation; the play button starts it again.
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
  play.addEventListener("click", function () { held = false; setAuto(!auto); });
  // pause while the visitor is reading a slide; the tabs and the play button sit outside the stage,
  // so pressing play is never cancelled by the pointer or focus resting on the controls
  live.addEventListener("mouseenter", function () { held = true; restart(); });
  live.addEventListener("mouseleave", function () { held = false; restart(); });
  live.addEventListener("focusin", function () { held = true; restart(); });
  live.addEventListener("focusout", function (e) { if (!live.contains(e.relatedTarget)) { held = false; restart(); } });
  // a link or button inside a slide counts as interaction: stop the rotation
  box.addEventListener("click", function (e) { if (e.target.closest(".hs a, .hs button")) setAuto(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else restart(); });

  // "See learning work" and similar links: jump to Selected work and switch its filter
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-pf-filter]");
    if (!a) return;
    var b = document.querySelector('.pf-filters button[data-filter="' + a.getAttribute("data-pf-filter") + '"]');
    if (b) setTimeout(function () { b.click(); }, 60);
  });

  // headlines on one line where they fit: shrink to fit (down to 55%); longer ones wrap at 80% (owner, 19 Nov 2026)
  function fit() {
    var w = box.querySelector(".hs-stage").clientWidth;
    box.querySelectorAll(".hs-h").forEach(function (h) {
      h.style.setProperty("--hs-fit", "1"); h.classList.add("is-one-line");
      var need = h.scrollWidth;
      var f = need > w ? w / need * 0.99 : 1;
      if (f < 0.55) { f = 0.8; h.classList.remove("is-one-line"); }   // too long for one line: wrap at a readable size
      h.style.setProperty("--hs-fit", f.toFixed(3));
    });
  }
  var ft; addEventListener("resize", function () { clearTimeout(ft); ft = setTimeout(fit, 120); });
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  setAuto(auto);
  show(0, false);
})();
