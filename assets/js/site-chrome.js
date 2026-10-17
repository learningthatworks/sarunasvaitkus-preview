/* Header controls shared by every page: theme switch (clock / sun / moon), blinds button, rain link.
   The theme itself is set before first paint by the small inline script in each page's <head>. */
(function () {
  var d = document.documentElement;
  var NAMES = { morning: 'rainy morning', day: 'sunny day', night: 'night' };

  // ---------- theme: automatic (visitor's clock) -> sun (rainy morning) -> moon (night) -> automatic ----------
  function apply(mode) {
    var scene = mode === 'dark' ? 'night' : mode === 'light' ? 'morning' : window.svByClock();
    var changed = scene !== d.getAttribute('data-scene');
    d.setAttribute('data-theme-mode', mode); d.setAttribute('data-scene', scene); d.setAttribute('data-theme', scene === 'night' ? 'dark' : 'light');
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      var next = mode === 'auto' ? 'morning view' : mode === 'light' ? 'night view' : 'automatic, by time of day';
      btn.setAttribute('aria-label', 'View: ' + (mode === 'auto' ? 'automatic, now ' + NAMES[scene] : NAMES[scene]) + '. Switch to ' + next);
      btn.title = btn.getAttribute('aria-label');
    });
    if (changed) window.dispatchEvent(new CustomEvent('sv-themechange', { detail: scene }));
  }
  function cycle() {
    var cur = d.getAttribute('data-theme-mode'), mode = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto';
    try { if (mode === 'auto') localStorage.removeItem('sv-theme'); else localStorage.setItem('sv-theme', mode); } catch (e) {}
    apply(mode);
  }
  // another tab or the popup frame changed the theme
  window.addEventListener('storage', function (e) { if (e.key === 'sv-theme') apply(e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'auto'); });

  function ready() {
    document.querySelectorAll('.theme-toggle').forEach(function (b) { b.addEventListener('click', cycle); });
    setInterval(function () { if (d.getAttribute('data-theme-mode') === 'auto') apply('auto'); }, 60000);
    apply(d.getAttribute('data-theme-mode') || 'auto');

    var wb = window.windowBg;
    // ---------- blinds button ----------
    var bt = document.querySelector('.blinds-toggle');
    if (bt && wb && wb.params.blinds) {
      var label = function () { var shut = wb.blinds() > 0.5; bt.textContent = shut ? 'Open blinds' : 'Close blinds'; bt.setAttribute('aria-pressed', String(shut)); };
      bt.addEventListener('click', function () {
        d.classList.add('blinds-anim'); setTimeout(function () { d.classList.remove('blinds-anim'); }, 1000);
        wb.setBlinds(wb.blinds() > 0.5 ? 0 : 1); label();
      });
      window.addEventListener('sv-blinds', label); label();
    } else if (bt) bt.hidden = true;
    // ---------- rain link: "Stop rain" while it rains, "Rain" when stopped or wiped ----------
    document.querySelectorAll('.rain-toggle').forEach(function (rl) {
      if (!wb) { rl.hidden = true; return; }
      var label = function () { var on = wb.rain(); rl.textContent = on ? 'Stop rain' : 'Rain'; rl.setAttribute('aria-pressed', String(!on)); };
      rl.addEventListener('click', function (e) { e.preventDefault(); wb.setRain(!wb.rain()); label(); });
      window.addEventListener('sv-windowwiped', label); label();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
