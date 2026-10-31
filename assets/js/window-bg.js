/* Window background for index2: an office window high above the city, sanded glass, water on it.

   Layers, back to front:
     .win-city   the photo, softened by the frosted glass (CSS blur + contrast)
     .win-veil   a light tint of the frost; thickens as the page scrolls so text stays readable
     .win-patch  uneven frosting: some areas of the pane are more sanded than others
     .win-grain  fine sanded texture
     .win-clear  where water sits, the glass turns clear: drops and wet trails show the city sharp
     .win-rain   highlights and edges of the drops
     .win-glare  a faint reflection on the pane

   Scene: the head script sets <html data-scene="morning|day|night"> from the visitor's clock,
   or from the header switch (sun = morning, moon = night). The photo is assets/img/window/<scene>-<size>.jpg.

   Every setting can be given on #window-bg as a data attribute, and overridden in the address bar
   for tuning (for example ?wb-blur=14&wb-grain=.6). See PARAMS below for names and defaults. */
(function () {
  var root = document.getElementById('window-bg');
  if (!root) return;
  // inside a popup frame the parent page already shows the window
  if (document.documentElement.classList.contains('cs-embed')) { root.remove(); return; }

  // ---------- parameters ----------
  var PARAMS = {
    panelOpacity: 0.8, // how solid the content panels are, 0-1; WCAG AA is guaranteed at 0.8 and above
    panelBlur: 18,    // px of blur behind the panels
    blur: 9,          // px, how much the frosted glass blurs the city
    contrast: 1.25,   // contrast of the city behind the glass
    saturate: 1.15,   // colour strength of the city
    brightness: 1,    // brightness of the city
    veil: 0.2,        // 0-1, base tint of the frost at the top of the page
    veilScroll: 0.5,  // 0-1, extra tint added as the visitor scrolls down
    texture: 0.55,    // 0-1, how uneven the frosting is (patches)
    grain: 0.4,       // 0-1, strength of the fine sanded grain
    grainSize: 1,     // grain scale: 1 = fine, 2 = coarser
    drops: 1,         // amount of water on the glass (multiplier)
    dropSize: 1,      // size of the large drops (multiplier)
    speed: 1,         // how fast drops slide (multiplier); 0 = they never run
    trails: 1,        // 1 = running drops leave clear wet trails, 0 = no trails
    refog: 8,         // seconds for a wet trail to frost over again
    glare: 0.5,       // 0-1, reflection on the pane
    parallax: 0.4,    // how far the city drifts while scrolling (share of the screen height)
    wipe: 1,          // 1 = a fast left-right-left shake of the mouse (or finger) wipes the pane clear
    wipeReturn: 0,    // seconds until the pane frosts over and the rain returns; 0 = stays clear for the visit
    hd: 1,            // 1 = after a wipe, load the sharper <scene>-<size>-hd.jpg photo
    blinds: 1,        // 1 = venetian blinds (the Close blinds button), 0 = no blinds at all
    blindsAuto: 0,    // 1 = the blinds also close by themselves as the visitor scrolls down
    blindsClose: 1.2, // screen heights of scrolling until the blinds are fully closed
    blindsSlat: 34,   // px between slats
    hint: 1           // 1 = show "Shake to wipe the window" once per browser
  };
  var qs = new URLSearchParams(location.search);
  Object.keys(PARAMS).forEach(function (k) {
    var dash = k.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
    var v = qs.get('wb-' + dash);
    if (v === null) v = root.getAttribute('data-' + dash);
    if (v !== null && v !== '' && !isNaN(+v)) PARAMS[k] = +v;
  });
  var P = PARAMS;
  function setVars() {
    var h = document.documentElement.style;
    h.setProperty('--panel-alpha', Math.max(0, Math.min(1, P.panelOpacity)));
    h.setProperty('--panel-blur', P.panelBlur + 'px');
    var s = root.style;
    s.setProperty('--wb-blur', P.blur + 'px');
    s.setProperty('--wb-contrast', P.contrast);
    s.setProperty('--wb-saturate', P.saturate);
    s.setProperty('--wb-brightness', P.brightness);
    s.setProperty('--wb-veil', P.veil);
    s.setProperty('--wb-veil-scroll', P.veilScroll);
    s.setProperty('--wb-texture', P.texture);
    s.setProperty('--wb-grain', P.grain);
    s.setProperty('--wb-glare', P.glare);
  }
  setVars();
  // no wiping on phones and tablets: a finger swipe there should scroll the page, and the hint covers the hero
  if (window.matchMedia && (matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 720px)').matches)) P.wipe = 0;

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mode = qs.get('bg');
  try { if (mode) localStorage.setItem('win-bg', mode); else mode = localStorage.getItem('win-bg'); } catch (e) {}
  if (mode !== 'still') mode = 'live';
  if (reduced) mode = 'still';
  root.setAttribute('data-mode', mode);

  function sceneNow() { return document.documentElement.getAttribute('data-scene') || 'day'; }
  var scene = sceneNow(), dark = scene === 'night';

  var DPR = Math.min(window.devicePixelRatio || 1, 1.25);
  var cityCv = root.querySelector('.win-city'), clearCv = root.querySelector('.win-clear'), rainCv = root.querySelector('.win-rain');
  var patchCv = root.querySelector('.win-patch'), grainEl = root.querySelector('.win-grain');
  var cc = clearCv.getContext('2d'), rc = rainCv.getContext('2d');

  // sharp copy of the city (contrast and colour baked in); seen through drops and trails
  var city = document.createElement('canvas'), cityG = city.getContext('2d');
  var photo = null;
  function photoUrl() {
    var base = root.getAttribute('data-photos'); if (!base) return null;
    var aspect = (innerWidth * 1.1) / (innerHeight * 1.45);
    var size = aspect > 1.6 ? 'xl' : aspect > 0.8 ? 'l' : 's';
    return base + scene + '-' + size + (useHd ? '-hd' : '') + '.jpg';
  }
  var useHd = false;
  function drawPhoto() {
    var W = Math.ceil(innerWidth * 1.1), H = Math.ceil(innerHeight * 1.45);
    city.width = W; city.height = H;
    if (photo) {
      var s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight), dw = photo.naturalWidth * s, dh = photo.naturalHeight * s;
      cityG.filter = 'contrast(' + P.contrast + ') saturate(' + P.saturate + ') brightness(' + P.brightness + ')';
      cityG.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh); // centred
      cityG.filter = 'none';
    } else {
      var g = cityG.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, dark ? '#10141c' : '#c9d3dc'); g.addColorStop(1, dark ? '#05070a' : '#8a949e');
      cityG.fillStyle = g; cityG.fillRect(0, 0, W, H);
    }
    cityCv.width = W; cityCv.height = H; cityCv.getContext('2d').drawImage(city, 0, 0);
  }
  function loadPhoto(done) {
    var url = photoUrl();
    if (!url) { drawPhoto(); done(); return; }
    var img = new Image();
    img.onload = function () { photo = img; drawPhoto(); done(); };
    img.onerror = function () { photo = null; drawPhoto(); done(); };
    img.src = url;
  }

  // ---------- sanded glass: patches and grain ----------
  function noiseCanvas(w, h, lo, hi) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), d = g.createImageData(w, h);
    for (var i = 0; i < d.data.length; i += 4) { var v = lo + Math.random() * (hi - lo); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c;
  }
  function drawPatches() {
    // a few octaves of soft noise scaled up: cloudy, uneven frosting
    var W = patchCv.width = Math.ceil(innerWidth / 2), H = patchCv.height = Math.ceil(innerHeight / 2);
    var g = patchCv.getContext('2d');
    g.clearRect(0, 0, W, H);
    [[8, 0.55], [22, 0.3], [60, 0.18]].forEach(function (o) {
      var n = noiseCanvas(o[0], Math.max(2, Math.round(o[0] * H / W)), 0, 255);
      g.globalAlpha = o[1]; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(n, 0, 0, W, H);
    });
    g.globalAlpha = 1;
    // turn brightness into white frost with varying opacity
    var d = g.getImageData(0, 0, W, H), a = d.data;
    for (var i = 0; i < a.length; i += 4) {
      var v = a[i] / 255; v = Math.max(0, Math.min(1, (v - 0.35) * 1.8));
      a[i] = a[i + 1] = a[i + 2] = dark ? 170 : 255; a[i + 3] = Math.round(v * (dark ? 120 : 200));
    }
    g.putImageData(d, 0, 0);
  }
  function drawGrain() {
    var t = Math.round(160 * P.grainSize);
    grainEl.style.backgroundImage = 'url(' + noiseCanvas(t, t, 60, 200).toDataURL('image/png') + ')';
    grainEl.style.backgroundSize = Math.round(t / DPR) + 'px';
  }

  // ---------- water: clear spots in the frost ----------
  var dropMask = document.createElement('canvas'), dm = dropMask.getContext('2d');   // small drops, stay
  var trailMask = document.createElement('canvas'), tm = trailMask.getContext('2d'); // wet trails, fog over
  var hilite = document.createElement('canvas'), hl = hilite.getContext('2d');       // small drops' highlights
  var drops = [], cityOffset = 0;

  function size() {
    var w = Math.round(innerWidth * DPR), h = Math.round(innerHeight * DPR);
    [clearCv, rainCv, dropMask, trailMask, hilite].forEach(function (c) { c.width = w; c.height = h; });
    [dm, tm, hl].forEach(function (g) { g.setTransform(DPR, 0, 0, DPR, 0, 0); });
    var n = Math.round(innerWidth * innerHeight / 1500 * P.drops);
    for (var i = 0; i < n; i++) smallDrop(Math.random() * innerWidth, Math.random() * innerHeight);
    drops = [];
    var m = Math.round(innerWidth / 45 * P.drops);
    for (var j = 0; j < m; j++) drops.push(bigDrop(Math.random() * innerWidth, Math.random() * innerHeight));
  }
  function smallDrop(x, y, r) {
    r = r || 0.7 + Math.random() * Math.random() * 3.6;
    dm.fillStyle = '#000'; dm.beginPath(); dm.ellipse(x, y, r, r * 1.05, 0, 0, 7); dm.fill();
    // a bright rim on the top left, a dark edge at the bottom: light bending through water
    hl.lineWidth = Math.max(0.6, r * 0.28);
    hl.strokeStyle = dark ? 'rgba(0,0,0,.55)' : 'rgba(30,36,44,.38)';
    hl.beginPath(); hl.arc(x, y, r * 0.9, 0.2, Math.PI - 0.2); hl.stroke();
    hl.fillStyle = 'rgba(255,255,255,' + (dark ? .55 : .85) + ')';
    hl.beginPath(); hl.arc(x - r * 0.35, y - r * 0.4, Math.max(0.5, r * 0.22), 0, 7); hl.fill();
  }
  function bigDrop(x, y) {
    return { x: x, y: y, r: (4.5 + Math.random() * 7.5) * P.dropSize, vy: 0, moving: Math.random() < 0.35, wait: Math.random() * 5000, wob: Math.random() * 6, ly: y };
  }
  function drawBig(d) {
    // each large drop is a small lens: a sharp, upside-down view of the city behind it
    var r = d.r, x = d.x, y = d.y;
    rc.save();
    rc.beginPath(); rc.ellipse(x, y, r * 0.92, r * 1.1, 0, 0, 7); rc.clip();
    var sx = x + innerWidth * 0.05, sy = y + cityOffset, span = r * 7;
    rc.translate(x, y); rc.scale(1, -1);
    rc.drawImage(city, sx - span / 2, sy - span / 2, span, span, -r, -r * 1.1, r * 2, r * 2.2);
    rc.restore();
    var gr = rc.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.1);
    gr.addColorStop(0, 'rgba(255,255,255,.9)');
    gr.addColorStop(0.16, 'rgba(255,255,255,.15)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0)');
    gr.addColorStop(1, dark ? 'rgba(0,0,0,.65)' : 'rgba(30,36,44,.5)');
    rc.fillStyle = gr; rc.beginPath(); rc.ellipse(x, y, r * 0.92, r * 1.1, 0, 0, 7); rc.fill();
  }

  var last = 0, spawn = 0;
  function frame(t) {
    var dt = Math.min(50, t - (last || t)); last = t;
    var live = mode === 'live';
    // drops run, wet the glass behind them, and the wet trails frost over again
    if (live) {
      if (P.refog > 0) {
        tm.save(); tm.setTransform(1, 0, 0, 1, 0, 0);
        tm.globalCompositeOperation = 'destination-out';
        tm.fillStyle = 'rgba(0,0,0,' + Math.min(1, dt / (P.refog * 1000) * 3).toFixed(4) + ')';
        tm.fillRect(0, 0, trailMask.width, trailMask.height); tm.restore();
      }
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        if (!d.moving) { d.wait -= dt; if (d.wait < 0 && P.speed > 0 && Math.random() < 0.002 * dt) d.moving = true; continue; }
        d.vy = Math.min(d.vy + 0.0009 * dt * d.r * P.speed, (0.045 * d.r + 0.1) * P.speed);
        if (Math.random() < 0.012) d.vy *= 0.15; // catches on the glass, then lets go
        d.ly = d.y; d.y += d.vy * dt; d.x += Math.sin((d.y + d.wob * 40) / 23) * 0.18;
        if (P.trails) { // a wet, clear trail a bit narrower than the drop
          tm.strokeStyle = '#000'; tm.lineCap = 'round'; tm.lineWidth = d.r * 1.1;
          tm.beginPath(); tm.moveTo(d.x, d.ly - d.r * 0.4); tm.lineTo(d.x, d.y - d.r * 0.4); tm.stroke();
        }
        // it gathers the small drops on its way
        dm.save(); dm.globalCompositeOperation = 'destination-out'; dm.beginPath(); dm.arc(d.x, d.y, d.r * 1.15, 0, 7); dm.fill(); dm.restore();
        hl.save(); hl.globalCompositeOperation = 'destination-out'; hl.beginPath(); hl.arc(d.x, d.y, d.r * 1.25, 0, 7); hl.fill(); hl.restore();
        if (P.trails && Math.random() < 0.18) smallDrop(d.x + (Math.random() - 0.5) * d.r * 1.4, d.y - d.r * 2.5, 0.5 + Math.random() * 1.1);
        d.r = Math.max(2.4, d.r - 0.0005 * dt);
        if (d.y - d.r > innerHeight) drops.splice(i, 1);
      }
      spawn += dt;
      if (spawn > 300 / P.drops) {
        spawn = 0; smallDrop(Math.random() * innerWidth, Math.random() * innerHeight);
        if (drops.length < innerWidth / 38 * P.drops) drops.push(bigDrop(Math.random() * innerWidth, Math.random() * innerHeight * 0.6));
      }
    }
    // clear glass: the sharp city seen through every wet spot
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalCompositeOperation = 'source-over';
    cc.clearRect(0, 0, clearCv.width, clearCv.height);
    cc.drawImage(dropMask, 0, 0); cc.drawImage(trailMask, 0, 0);
    cc.globalCompositeOperation = 'source-in';
    cc.drawImage(city, -innerWidth * 0.05 * DPR, -cityOffset * DPR, city.width * DPR, city.height * DPR);
    cc.globalCompositeOperation = 'source-over';
    // drop highlights and the large lens drops
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, rainCv.width, rainCv.height);
    rc.drawImage(hilite, 0, 0);
    rc.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (var k = 0; k < drops.length; k++) drawBig(drops[k]);
  }
  var running = false;
  function loop(t) { if (!running) return; frame(t); requestAnimationFrame(loop); }
  var wiped = false;
  function start() { if (running || mode !== 'live' || wiped) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  // ---------- scrolling: the city drifts, the veil thickens ----------
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      var p = Math.min(1, scrollY / max);
      cityOffset = p * innerHeight * P.parallax;
      root.style.setProperty('--city-y', (-cityOffset).toFixed(1) + 'px');
      root.style.setProperty('--frost', Math.min(1, scrollY / (innerHeight * 0.75)).toFixed(3));
      if (!running) frame(performance.now());
    });
  }

  function init() {
    root.setAttribute('data-scene', scene);
    stop(); size(); drawPatches(); drawGrain();
    loadPhoto(function () { root.classList.add('ready'); frame(performance.now()); start(); });
    onScroll();
  }
  var rs;
  addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(function () { photo = null; init(); }, 200); });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  // rest while a popup or the contact form covers the page (both are <dialog> elements)
  function checkCover() { if (document.querySelector('dialog[open]')) stop(); else if (!document.hidden) start(); }
  document.addEventListener('click', function () { setTimeout(checkCover, 400); });
  // a dialog closed with Escape fires no click: its "close" event resumes the rain (close does not bubble, so listen in the capture phase)
  document.addEventListener('close', function () { setTimeout(checkCover, 50); }, true);
  window.addEventListener('sv-themechange', function () {
    var s = sceneNow(); if (s === scene) return; scene = s; dark = s === 'night'; photo = null; init();
  });
  function unwipe() {
    if (!wiped) return;
    root.classList.remove('wiped'); wiped = false; useHd = false;
    size(); loadPhoto(function () {}); start();
    window.dispatchEvent(new CustomEvent('sv-windowwiped'));
  }
  function wipeAll() {} // replaced below when wiping is on

  // ---------- wipe the window: shake the mouse left-right-left ----------
  // While the pointer moves fast it wipes a wide clear band along its path; three or more quick
  // direction changes covering most of the screen width wipe the whole pane and stop the rain.
  if (P.wipe) {
    var lx = null, ly = null, lt = 0, ldir = 0, flips = [], travel = [];
    function wipeBand(x0, y0, x1, y1) {
      tm.save(); tm.globalCompositeOperation = 'source-over'; tm.strokeStyle = '#000'; tm.lineCap = 'round';
      tm.lineWidth = Math.max(70, innerWidth * 0.09);
      tm.beginPath(); tm.moveTo(x0, y0); tm.lineTo(x1, y1); tm.stroke(); tm.restore();
      // the hand also takes the drops with it
      dm.save(); dm.globalCompositeOperation = 'destination-out'; dm.lineWidth = Math.max(70, innerWidth * 0.09); dm.lineCap = 'round';
      dm.beginPath(); dm.moveTo(x0, y0); dm.lineTo(x1, y1); dm.stroke(); dm.restore();
      hl.save(); hl.globalCompositeOperation = 'destination-out'; hl.lineWidth = Math.max(80, innerWidth * 0.1); hl.lineCap = 'round';
      hl.beginPath(); hl.moveTo(x0, y0); hl.lineTo(x1, y1); hl.stroke(); hl.restore();
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i], ex = x1 - x0, ey = y1 - y0, len = ex * ex + ey * ey || 1;
        var u = Math.max(0, Math.min(1, ((d.x - x0) * ex + (d.y - y0) * ey) / len));
        var px = x0 + u * ex - d.x, py = y0 + u * ey - d.y;
        if (px * px + py * py < Math.pow(Math.max(70, innerWidth * 0.09) / 2 + d.r, 2)) drops.splice(i, 1);
      }
      if (!running) frame(performance.now());
    }
    wipeAll = function () {
      if (wiped) return;
      wiped = true; stop(); drops = [];
      root.classList.add('wiped');
      window.dispatchEvent(new CustomEvent('sv-windowwiped'));
      if (P.hd) setTimeout(function () { useHd = true; var keep = photo; loadPhoto(function () { if (!photo) { photo = keep; drawPhoto(); } }); }, 1200);
      hideHint();
      if (P.wipeReturn > 0) setTimeout(unwipe, P.wipeReturn * 1000);
    };
    function move(x, y) {
      var now = performance.now();
      if (lx !== null && now - lt < 260 && !wiped) {
        var dx = x - lx, dt = Math.max(1, now - lt), speed = Math.abs(dx) / dt;
        if (speed > 0.7) {
          wipeBand(lx, ly, x, y);
          var dir = dx > 0 ? 1 : -1;
          if (ldir && dir !== ldir) flips.push(now);
          ldir = dir; travel.push([now, Math.abs(dx)]);
        }
        flips = flips.filter(function (f) { return now - f < 1600; });
        travel = travel.filter(function (m) { return now - m[0] < 1600; });
        var dist = travel.reduce(function (s, m) { return s + m[1]; }, 0);
        if (flips.length >= 3 && dist > Math.min(1400, innerWidth * 1.2)) wipeAll();
      }
      lx = x; ly = y; lt = now;
    }
    addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); }, { passive: true });
    addEventListener('touchmove', function (e) { var t0 = e.touches[0]; if (t0) move(t0.clientX, t0.clientY); }, { passive: true });
    addEventListener('touchend', function () { lx = null; }, { passive: true });
  }

  // ---------- venetian blinds: they close as the page scrolls; a button can open or close them ----------
  var blindsManual = null; // null = follow scroll, 0 = open, 1 = closed
  function blindsAmount() {
    if (!P.blinds) return 0;
    if (blindsManual !== null) return blindsManual;
    if (!P.blindsAuto) return 0; // open until the visitor closes them
    return Math.max(0, Math.min(1, scrollY / (innerHeight * P.blindsClose)));
  }
  function setBlinds() {
    var b = blindsAmount();
    document.documentElement.style.setProperty('--blinds', b.toFixed(3));
    root.classList.toggle('blinds-on', b > 0.001 || blindsManual !== null);
    root.classList.toggle('blinds-manual', blindsManual !== null);
    root.classList.toggle('blinds-shut', b > 0.5);   // pages can make text stand out over the slats
    window.dispatchEvent(new CustomEvent('sv-blinds', { detail: b }));
  }
  if (P.blinds) {
    root.style.setProperty('--slat', P.blindsSlat + 'px');
    root.classList.add('has-blinds');
    addEventListener('scroll', function () { if (blindsManual === null) setBlinds(); }, { passive: true });
    setBlinds();
  }

  // ---------- one-time hint ----------
  var hintEl = null;
  function hideHint() { if (hintEl) { hintEl.classList.remove('on'); setTimeout(function () { if (hintEl) hintEl.remove(); hintEl = null; }, 600); } }
  if (P.wipe && P.hint && mode === 'live') {
    var seen = false; try { seen = localStorage.getItem('sv-wipe-hint') === '1'; } catch (e) {}
    if (!seen) setTimeout(function () {
      if (wiped || mode !== 'live') return;
      hintEl = document.createElement('div'); hintEl.className = 'wipe-hint'; hintEl.setAttribute('role', 'status');
      var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      var lt = /^lt/.test(document.documentElement.lang || '');
      hintEl.textContent = lt ? (touch ? 'Braukite į šonus, kad nuvalytumėte langą' : 'Pakratykite pelę, kad nuvalytumėte langą') : (touch ? 'Swipe side to side to wipe the window' : 'Shake to wipe the window');
      document.body.appendChild(hintEl);
      requestAnimationFrame(function () { hintEl && hintEl.classList.add('on'); });
      try { localStorage.setItem('sv-wipe-hint', '1'); } catch (e) {}
      setTimeout(hideHint, 4000);
    }, 2500);
  }

  // ---------- rain on / off (the "Rain" / "Stop rain" link) ----------
  function setMode(m) {
    if (m === 'live' && wiped) unwipe();
    mode = m === 'still' ? 'still' : 'live';
    if (reduced && mode === 'live') mode = 'still';
    root.setAttribute('data-mode', mode);
    try { localStorage.setItem('win-bg', mode); } catch (e) {}
    if (mode === 'live') start(); else { stop(); hideHint(); }
    window.dispatchEvent(new CustomEvent('sv-windowwiped'));
  }

  window.windowBg = {
    rain: function () { return mode === 'live' && !wiped; },
    setRain: function (on) { setMode(on ? 'live' : 'still'); },
    blinds: function () { return blindsAmount(); },
    setBlinds: function (v) { blindsManual = v; setBlinds(); },
    // global panel control: windowBg.setPanels(0.85, 20)
    setPanels: function (opacity, blur) { if (opacity != null) P.panelOpacity = +opacity; if (blur != null) P.panelBlur = +blur; setVars(); }, mode: mode, params: P, scene: function () { return scene; }, wiped: function () { return wiped; } };
  init();
})();
