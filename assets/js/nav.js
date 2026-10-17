/* phone and tablet menu: the burger in the site header opens the side panel (markup in scripts/glass_common.py) */
(function () {
  var btn = document.querySelector('.nav-burger'), nav = document.getElementById('side-nav');
  if (!btn || !nav) return;
  nav.hidden = false;
  function set(open) {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 992) set(false); });
})();
