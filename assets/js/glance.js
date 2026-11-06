/* Homepage globe for "Where the work was done" (amCharts), beside the table in the client panel.
   Data: assets/data/glance.json, built from metabrain by scripts/build-glance-data.py.
   amCharts 5 (free linkware licence, logo kept) is bundled in assets/vendor/amcharts and
   loads only when the section scrolls into view. Colours follow the light and dark themes. */
(function () {
  var box = document.querySelector(".glance-grid");
  if (!box) return;
  // site root, worked out from this script's own address (works on the live site and on the preview)
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/assets\/js\/glance\.js.*$/, "") : "/";
  var roots = [], data = null, started = false;

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  }

  function draw() {
    var A = window.SVAm; if (!A || !data) return;
    var am5 = A.am5;
    roots.forEach(function (r) { r.dispose(); }); roots = [];
    var ink = am5.color(css("--ink") || "#141518"), ink2 = am5.color(css("--ink-2") || "#2b2e33"),
        muted = am5.color(css("--muted") || "#3d4248"), red = am5.color(css("--red") || "#c80000"),
        line = am5.color(css("--line") || "#cfccc5"), paper = am5.color(css("--paper") || "#f7f6f3");
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    function tone(name, fallback) { var v = css(name); return v || fallback; }
    var pal = [tone("--chart-1", "#2f75b6"), tone("--chart-2", "#f27b36"), tone("--chart-3", "#2a9d90"), tone("--chart-4", "#7553a2"), tone("--chart-5", "#e6a800")];
    var SECTOR = {
      "UN and international": pal[0],
      "Companies": pal[1],
      "Education and learning": pal[2],
      "Government and public": pal[3]
    };
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function root(id) {
      var r = am5.Root.new(id);
      var t = am5.Theme.new(r);
      t.rule("Label").setAll({ fontFamily: "'Open Sans', system-ui, sans-serif" });
      r.setThemes(reduce ? [t] : [A.am5themes_Animated.new(r), t]);
      r.interfaceColors.set("text", ink2);
      r.interfaceColors.set("grid", line);
      r.interfaceColors.set("background", paper);
      r.numberFormatter.set("numberFormat", "#");
      roots.push(r); return r;
    }
    function centre(r, chart, big, small) {
      chart.seriesContainer.children.push(am5.Label.new(r, {
        text: "[fontSize:30px fontFamily:Oswald]" + big + "[/]\n[fontSize:11px]" + small.toUpperCase() + "[/]",
        textAlign: "center", centerX: am5.p50, centerY: am5.p50, fill: ink, populateText: true
      }));
    }

    // 1. Where the work was done: a globe that turns slowly; drag to spin it
    (function () {
      var r = root("g-where"), M = A.am5map;
      var c = r.container.children.push(M.MapChart.new(r, {
        projection: M.geoOrthographic(), panX: "rotateX", panY: "rotateY", wheelY: "none", rotationX: -60, rotationY: -15
      }));
      var bg = c.series.push(M.MapPolygonSeries.new(r, {}));
      bg.mapPolygons.template.setAll({ fill: dark ? am5.color("#1d2024") : am5.color("#e7e4de"), fillOpacity: 1, strokeOpacity: 0 });
      bg.data.push({ geometry: M.getGeoRectangle(90, 180, -90, -180) });
      var land = c.series.push(M.MapPolygonSeries.new(r, { geoJSON: A.am5geodata_worldLow, exclude: ["AQ"] }));
      var worked = data.countries.map(function (d) { return d.id; });
      land.mapPolygons.template.setAll({ fill: dark ? am5.color("#3a3e44") : am5.color("#c9c5bd"), stroke: paper, strokeWidth: .5, tooltipText: "" });
      land.mapPolygons.template.adapters.add("fill", function (f, t) {
        var id = t.dataItem && t.dataItem.get("id"); return worked.indexOf(id) >= 0 ? (dark ? am5.color("#6b7178") : muted) : f;
      });
      var pts = c.series.push(M.MapPointSeries.new(r, { latitudeField: "latitude", longitudeField: "longitude" }));
      pts.bullets.push(function (root, series, di) {
        var n = di.dataContext.engagements;
        var circ = am5.Circle.new(root, { radius: 4 + Math.sqrt(n) * 3, fill: red, fillOpacity: .85, stroke: paper, strokeWidth: 1.5,
          tooltipText: /^lt/.test(document.documentElement.lang || "") ? "{name_lt} ({place_lt})\nUžsakymai: {engagements}, projektai: {projects}" : "{name} ({place})\n{engagements} engagements, {projects} projects" });
        return am5.Bullet.new(root, { sprite: circ });
      });
      var LTN = { "Switzerland": "Šveicarija", "Austria": "Austrija", "United Kingdom": "Jungtinė Karalystė", "Australia": "Australija", "Saudi Arabia": "Saudo Arabija", "Qatar": "Kataras" };
      var LTP = { "Geneva, remote": "Ženeva, nuotoliu", "Vienna, remote": "Viena, nuotoliu", "London": "Londonas", "Sydney and Melbourne": "Sidnėjus ir Melburnas", "Riyadh and remote": "Rijadas ir nuotoliu", "Doha": "Doha" };
      pts.data.setAll(data.countries.map(function (c) { var o = Object.assign({}, c); o.name_lt = LTN[c.name] || c.name; o.place_lt = LTP[c.place] || c.place; return o; }));
      if (!reduce) {
        var spin = c.animate({ key: "rotationX", from: -60, to: 300, duration: 60000, loops: Infinity });
        c.events.on("pointerover", function () { spin.pause(); });
        c.events.on("pointerout", function () { spin.play(); });
      }
      if (!reduce) c.appear(900, 100);
    })();

  }

  function start() {
    if (started) return; started = true;
    Promise.all([
      window.SVAm ? Promise.resolve() : load(base + "assets/vendor/amcharts/amcharts5-5.21.2.min.js"),
      fetch(base + "assets/data/glance.json").then(function (r) { return r.json(); }).then(function (j) { data = j; })
    ]).then(function () { box.classList.add("is-live"); draw(); })
      .catch(function () { box.classList.add("is-static"); });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: "300px" });
    io.observe(box);
  } else start();
  window.addEventListener("sv-themechange", function () { if (data) setTimeout(draw, 50); });
})();
