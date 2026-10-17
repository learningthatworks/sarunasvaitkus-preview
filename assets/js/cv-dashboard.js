/* CV dashboard: tabs (Dashboard / Print and PDF), a globe and a serpentine work timeline.
   Data: assets/data/glance.json, built from metabrain by scripts/build-glance-data.py.
   amCharts 5 (free linkware licence, logo kept) loads only when the dashboard is shown. */
(function () {
  var dash = document.getElementById("cv-dash"), sheet = document.getElementById("cv-print");
  if (!dash || !sheet) return;
  var tabs = [].slice.call(document.querySelectorAll(".cv-tabs [role=tab]"));
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/assets\/js\/cv-dashboard\.js.*$/, "") : "/";

  // ---------- tabs ----------
  function show(which, focus) {
    var isDash = which !== "print";
    dash.hidden = !isDash; sheet.hidden = isDash;
    tabs.forEach(function (t) {
      var on = (t.id === "tab-dash") === isDash;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    document.body.classList.toggle("cv-is-dash", isDash);
    if (isDash) start(); else stopAll();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      var w = t.id === "tab-dash" ? "dash" : "print";
      history.replaceState(null, "", w === "print" ? "#print" : location.pathname + location.search);
      show(w);
    });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.click(); n.focus();
    });
  });
  // the PDF button always prints the print view
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  // ---------- charts ----------
  var roots = [], data = null, started = false;
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  }
  function stopAll() { roots.forEach(function (r) { r.dispose(); }); roots = []; }
  function start() {
    if (data) { if (!roots.length) draw(); return; }
    if (started) return; started = true;
    Promise.all([
      window.SVAm3 ? Promise.resolve() : load(base + "assets/vendor/amcharts/amcharts5-cv-5.21.2.min.js"),
      fetch(base + "assets/data/glance.json").then(function (r) { return r.json(); }).then(function (j) { data = j; })
    ]).then(function () { dash.classList.add("is-live"); draw(); })
      .catch(function () { dash.classList.add("is-static"); });
  }

  function ts(v, end) {
    if (!v) { var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), 28); }
    var m = String(v).match(/(\d{4})(?:-(\d{2}))?/), y = +m[1], mo = m[2] ? +m[2] - 1 : (end ? 11 : 0);
    return end ? Date.UTC(y, mo + 1, 0) : Date.UTC(y, mo, 1);
  }
  function fmt(t) { return new Date(t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); }

  function draw() {
    var A = window.SVAm3; if (!A || !data) return;
    var am5 = A.am5;
    stopAll();
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ink = am5.color(css("--ink") || "#141518"), ink2 = am5.color(css("--ink-2") || "#2b2e33"),
        muted = am5.color(css("--muted") || "#3d4248"), red = am5.color(css("--red") || "#c80000"),
        line = am5.color(css("--line") || "#cfccc5"), paper = am5.color(css("--paper") || "#f7f6f3");
    // chart palette: c70000 e34c35 f27b36 e6a800 2f75b6 2a9d90 7553a2 d9d9d9 3b3b3b
    var SECTOR = { "UN and international": "#2f75b6", "Companies": "#f27b36", "Education and learning": "#2a9d90", "Government and public": "#7553a2" };
    var PLACE = { "Australia": "#e6a800", "United Kingdom": dark ? "#d9d9d9" : "#3b3b3b", "Qatar": "#e34c35", "Saudi Arabia": "#e34c35" };
    red = am5.color("#c70000");

    function root(id) {
      var r = am5.Root.new(id);
      var t = am5.Theme.new(r);
      t.rule("Label").setAll({ fontFamily: "'Open Sans', system-ui, sans-serif", fill: ink2 });
      // tooltips wrap so long lists stay inside the chart
      t.rule("Tooltip").setAll({ pointerOrientation: "vertical" });
      r.setThemes(reduce ? [t] : [A.am5themes_Animated.new(r), t]);
      r.interfaceColors.set("grid", line);
      r.interfaceColors.set("background", paper);
      roots.push(r); return r;
    }
    function tip(r) {
      var t = am5.Tooltip.new(r, { getFillFromSprite: false, autoTextColor: false });
      t.get("background").setAll({ fill: ink, fillOpacity: .94, strokeOpacity: 0 });
      t.label.setAll({ fill: paper, maxWidth: 280, oversizedBehavior: "wrap", fontSize: 13 });
      return t;
    }

    // ---------- globe ----------
    (function () {
      var r = root("cv-globe"), M = A.am5map;
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
      pts.set("tooltip", tip(r));
      pts.bullets.push(function (rt, series, di) {
        var n = di.dataContext.engagements;
        return am5.Bullet.new(rt, { sprite: am5.Circle.new(rt, { radius: 4 + Math.sqrt(n) * 3, fill: red, fillOpacity: .85,
          stroke: paper, strokeWidth: 1.5, tooltipText: "{name} ({place})\n{engagements} engagements, {projects} projects" }) });
      });
      pts.data.setAll(data.countries);
      if (!reduce) {
        var spin = c.animate({ key: "rotationX", from: -60, to: 300, duration: 60000, loops: Infinity });
        c.events.on("pointerover", function () { spin.pause(); });
        c.events.on("pointerout", function () { spin.play(); });
        c.appear(900, 100);
      }
    })();

    // ---------- serpentine timeline ----------
    (function () {
      var el = document.getElementById("cv-serp"); if (!el) return;
      var narrow = el.offsetWidth < 640; wasNarrow = narrow;
      var r = root("cv-serp"), T = A.am5timeline;

      // clients: one bar per organisation, overlapping projects of the same organisation merged;
      // work running in parallel goes to extra rows so no bar hides another
      var byOrg = {};
      data.projects.forEach(function (p) {
        (byOrg[p.org] = byOrg[p.org] || []).push({ org: p.org, sector: p.sector, start: ts(p.start), end: ts(p.end, true),
          projects: [p.project], clients: p.clients || null, open: !p.end });
      });
      var spans = [];
      Object.keys(byOrg).forEach(function (o) {
        var list = byOrg[o].sort(function (a, b) { return a.start - b.start; }), cur = null;
        list.forEach(function (s) {
          if (cur && s.start <= cur.end + 40 * 864e5) {
            cur.end = Math.max(cur.end, s.end); cur.open = cur.open || s.open;
            if (cur.projects.indexOf(s.projects[0]) < 0) cur.projects.push(s.projects[0]);
          } else { cur = s; spans.push(cur); }
        });
      });
      spans.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
      var rowEnd = [];
      spans.forEach(function (s) {
        var i = 0; while (rowEnd[i] != null && rowEnd[i] > s.start) i++;
        rowEnd[i] = s.end + 20 * 864e5; s.row = i;
      });
      // extra client rows get blank names (spaces keep each category unique)
      var clientRows = rowEnd.map(function (x, i) { return i === 0 ? "Clients" : new Array(i + 1).join(" "); });
      // an empty lane carries the date line, so year labels never sit on a bar
      var GAP = "\t";
      var lanes = ["Tools", "Location", GAP].concat(clientRows);

      var chart = r.container.children.push(T.SerpentineChart.new(r, {
        levelCount: 3, orientation: narrow ? "horizontal" : "vertical", paddingLeft: narrow ? 8 : 34, paddingRight: narrow ? 8 : 34, paddingTop: narrow ? 60 : 24, paddingBottom: narrow ? 60 : 40,
        wheelX: "none", wheelY: "none", panX: false, panY: false
      }));
      var laneH = narrow ? 15 : 20;
      var yr = T.AxisRendererCurveY.new(r, { axisLength: laneH * (clientRows.length + 3), axisLocation: 2.5 / lanes.length });
      yr.labels.template.setAll({ fontSize: 11, fill: muted, centerX: am5.p100, paddingRight: 6 });
      yr.grid.template.setAll({ strokeOpacity: .06 });
      var yAxis = chart.yAxes.push(A.am5xy.CategoryAxis.new(r, { categoryField: "lane", renderer: yr }));
      var xr = T.AxisRendererCurveX.new(r, { yRenderer: yr, strokeDasharray: [2, 3], strokeOpacity: .6, stroke: muted });
      xr.labels.template.setAll({ fontSize: 11, fill: ink2, centerY: am5.p50, minPosition: .01, maxPosition: .99 });
      xr.labels.template.setup = function (l) {
        l.set("background", am5.RoundedRectangle.new(r, { fill: paper, fillOpacity: 1, cornerRadiusTL: 3, cornerRadiusTR: 3, cornerRadiusBL: 3, cornerRadiusBR: 3 }));
      };
      xr.grid.template.setAll({ strokeOpacity: .08 });
      var x0 = Date.UTC(data.first_year - 1, 9, 1), x1 = ts(null, true) + 20 * 864e5;
      var xAxis = chart.xAxes.push(A.am5xy.DateAxis.new(r, {
        baseInterval: { timeUnit: "month", count: 1 }, gridIntervals: [{ timeUnit: "year", count: 1 }, { timeUnit: "year", count: 2 }],
        min: x0, max: x1, strictMinMax: true, renderer: xr
      }));
      xAxis.get("dateFormats")["year"] = "yyyy";

      function bars(name, rows, fillFn, tipText, height) {
        var s = chart.series.push(T.CurveColumnSeries.new(r, {
          name: name, xAxis: xAxis, yAxis: yAxis, openValueXField: "start", valueXField: "end", categoryYField: "lane", maskContent: false, clustered: false
        }));
        s.set("tooltip", tip(r));
        s.columns.template.setAll({ height: am5.percent(height || 72), strokeOpacity: 0, tooltipText: tipText, cornerRadius: 3 });
        s.columns.template.adapters.add("fill", function (f, c) { var d = c.dataItem && c.dataItem.dataContext; return d ? am5.color(fillFn(d)) : f; });
        s.columns.template.adapters.add("stroke", function (f, c) { var d = c.dataItem && c.dataItem.dataContext; return d ? am5.color(fillFn(d)) : f; });
        s.data.setAll(rows);
        if (!reduce) s.appear(900);
        return s;
      }

      // location lane: home base first, on-site stints abroad drawn on top
      bars("Location", data.places.map(function (p) {
        var a = ts(p.start), b = ts(p.end, true);
        return { lane: "Location", place: p.place, start: a, end: b,
          txt: p.place + (p.org ? " (on site, " + p.org + ")" : "") + "\n" + fmt(a) + " to " + (p.end ? fmt(b) : "now") };
      }), function (d) { return PLACE[d.place] || "#d9d9d9"; }, "{txt}", 60);

      // clients lanes
      bars("Clients", spans.map(function (s) {
        var n = s.projects.length;
        return { lane: clientRows[s.row], org: s.org, sector: s.sector, start: s.start, end: s.end,
          txt: "[bold]" + s.org + "[/]\n" + s.sector + "\n" + fmt(s.start) + " to " + (s.open ? "now" : fmt(s.end)) + "\n" +
            (n > 1 ? n + " projects: " : "") + s.projects.join(", ") + (s.clients ? "\nClients include " + s.clients.join(", ") : "") };
      }), function (d) { return SECTOR[d.sector] || "#3b3b3b"; }, "{txt}", 72);

      // tools lane: a dot where a tool is first named, labelled with the tool
      var tl = chart.series.push(T.CurveColumnSeries.new(r, {
        name: "Tools", xAxis: xAxis, yAxis: yAxis, openValueXField: "start", valueXField: "end", categoryYField: "lane", maskContent: false, clustered: false
      }));
      tl.set("tooltip", tip(r));
      tl.columns.template.setAll({ height: am5.percent(4), fillOpacity: 0, strokeOpacity: 0 });
      tl.bullets.push(function (rt, series, di) {
        var c = am5.Container.new(rt, { centerX: am5.p50, centerY: am5.p50, tooltipText: "{txt}", interactive: true, cursorOverStyle: "default" });
        c.children.push(am5.Circle.new(rt, { radius: 5, fill: red, stroke: paper, strokeWidth: 1.5 }));
        // labels point toward the date line so they stay inside the row (rows alternate direction)
        var up = di.dataContext.run % 2 === 0;
        if (!narrow) c.children.push(am5.Label.new(rt, { text: di.dataContext.short, fontSize: 10, fill: ink2, centerX: am5.p50,
          centerY: up ? am5.p100 : 0, y: up ? -5 : 5, populateText: false }));
        return am5.Bullet.new(rt, { locationX: 0, sprite: c });
      });
      // tools first named within eight months of each other share one marker, so labels do not collide
      var groups = [];
      data.tool_firsts.forEach(function (t) {
        var a = ts(t.date), g = groups[groups.length - 1];
        if (g && a - g.start < 245 * 864e5) { g.tools = g.tools.concat(t.tools); g.lines.push(t.tools.join(", ") + ": " + fmt(a) + ", " + t.org); }
        else groups.push({ start: a, tools: t.tools.slice(), lines: [t.tools.join(", ") + ": " + fmt(a) + ", " + t.org] });
      });
      tl.data.setAll(groups.map(function (g, i) {
        return { run: Math.min(2, Math.floor((g.start - x0) / (x1 - x0) * 3)), lane: "Tools", start: g.start, end: g.start + 25 * 864e5, short: g.tools[0] + (g.tools.length > 1 ? " +" + (g.tools.length - 1) : ""),
          txt: "[bold]First named[/]\n" + g.lines.join("\n") };
      }));

      yAxis.data.setAll(lanes.map(function (l) { return { lane: l }; }));
      if (!reduce) chart.appear(900, 100);
    })();

    // ---------- projects before NSW Community Services (Feb 2012) combined; detail from there ----------
    var Y1 = new Date().getFullYear();
    var nsw = data.projects.filter(function (p) { return /^NSW/.test(p.org); })[0];
    var CUT_START = nsw ? nsw.start : "2012-02", CUT = +CUT_START.slice(0, 4);
    var EARLY_NAME = "C-Learning / projects", EARLY_COLOUR = dark ? "#3b3b3b" : "#d9d9d9";
    var early = { orgs: [], months: 0, bySector: {}, clients: [] }, P = [];
    data.projects.forEach(function (p) {
      if (p.start >= CUT_START) { P.push(p); return; }
      Object.keys(p.months).forEach(function (y) {
        early.months += p.months[y];
        early.bySector[p.sector] = (early.bySector[p.sector] || 0) + p.months[y];
      });
      if (early.orgs.indexOf(p.org) < 0) early.orgs.push(p.org);
      if (p.clients && !early.clients.length) early.clients = p.clients;
    });
    var EARLY_YEARS = CUT - data.first_year;
    var earlyNote = early.orgs.length + " organisations: " + early.orgs.join(", ") +
      (early.clients.length ? "\nC-Learning clients include " + early.clients.join(", ") : "");

    // ---------- project timeline by organisation ----------
    (function () {
      var el = document.getElementById("cv-gantt"); if (!el) return;
      var narrow = el.offsetWidth < 640;
      var r = root("cv-gantt");
      var chart = r.container.children.push(A.am5xy.XYChart.new(r, { panX: true, wheelX: "panX", wheelY: "zoomX", layout: r.verticalLayout, paddingLeft: 0 }));
      var orgs = {}, order = [];
      P.forEach(function (p) {
        if (!orgs[p.org]) { orgs[p.org] = { org: p.org, sector: p.sector, first: p.start }; order.push(orgs[p.org]); }
        if (p.start < orgs[p.org].first) orgs[p.org].first = p.start;
      });
      // UN and international first, then newest first; NSW sits just above the combined row
      order.sort(function (a, b) { return (b.sector === "UN and international") - (a.sector === "UN and international") || (a.first < b.first ? 1 : a.first > b.first ? -1 : 0) || (/^NSW/.test(a.org) ? 1 : /^NSW/.test(b.org) ? -1 : 0); });
      order.push({ org: EARLY_NAME, sector: "early", first: "" });
      var yr = A.am5xy.AxisRendererY.new(r, { minGridDistance: 8 });
      yr.labels.template.setAll({ fontSize: 11, oversizedBehavior: "truncate", maxWidth: narrow ? 100 : 170 });
      yr.grid.template.setAll({ strokeOpacity: .06 });
      var yAxis = chart.yAxes.push(A.am5xy.CategoryAxis.new(r, { categoryField: "org", renderer: yr }));
      var xAxis = chart.xAxes.push(A.am5xy.DateAxis.new(r, { baseInterval: { timeUnit: "month", count: 1 },
        renderer: A.am5xy.AxisRendererX.new(r, { minGridDistance: narrow ? 50 : 60 }), min: Date.UTC(CUT - 1, 0, 1), max: Date.UTC(Y1, 11, 31) }));
      xAxis.get("renderer").grid.template.setAll({ strokeOpacity: .08 });
      xAxis.get("renderer").labels.template.setAll({ fontSize: 11 });
      xAxis.get("renderer").labels.template.adapters.add("text", function (t, l) {
        var v = l.dataItem && l.dataItem.get("value");
        return v != null && new Date(v).getUTCFullYear() < CUT ? String(data.first_year).slice(2) + "–" + String(CUT - 1).slice(2) : t;
      });
      var s = chart.series.push(A.am5xy.ColumnSeries.new(r, { xAxis: xAxis, yAxis: yAxis, openValueXField: "start", valueXField: "end", categoryYField: "org" }));
      s.set("tooltip", tip(r));
      s.columns.template.setAll({ height: am5.percent(62), strokeOpacity: 0, cornerRadiusTL: 3, cornerRadiusTR: 3, cornerRadiusBL: 3, cornerRadiusBR: 3,
        tooltipText: "[bold]{project}[/]\n{org}\n{startTxt} to {endTxt}{clientsTxt}" });
      s.columns.template.adapters.add("fill", function (f, c) {
        var dc = c.dataItem && c.dataItem.dataContext; return dc ? am5.color(dc.sector === "early" ? EARLY_COLOUR : (SECTOR[dc.sector] || "#3b3b3b")) : f;
      });
      var rows = P.map(function (p) {
        var a = ts(p.start), b = Math.max(ts(p.end, true), a + 75 * 864e5);  // short jobs stay visible
        return { org: p.org, sector: p.sector, project: p.project, start: a, end: b, startTxt: fmt(a), endTxt: p.end ? fmt(b) : "now",
          clientsTxt: p.clients ? "\nClients include " + p.clients.join(", ") : "" };
      });
      rows.push({ org: EARLY_NAME, sector: "early", project: "Earlier work, " + early.months + " months", start: Date.UTC(CUT - 1, 0, 1), end: Date.UTC(CUT - 1, 11, 28),
        startTxt: String(data.first_year), endTxt: String(CUT - 1), clientsTxt: "\n" + earlyNote });
      yAxis.data.setAll(order.reverse());
      s.data.setAll(rows);
      chart.set("scrollbarX", am5.Scrollbar.new(r, { orientation: "horizontal", height: 8 }));
      chart.set("cursor", A.am5xy.XYCursor.new(r, { behavior: "none" }));
      if (!reduce) { s.appear(900); chart.appear(900, 100); }
    })();

    // ---------- months of work per year, by sector ----------
    (function () {
      var el = document.getElementById("cv-months"); if (!el) return;
      var r = root("cv-months");
      var chart = r.container.children.push(A.am5xy.XYChart.new(r, { panX: false, panY: false, layout: r.verticalLayout, paddingLeft: 0 }));
      var sectors = ["UN and international", "Companies", "Government and public", "Education and learning"];
      var first = { year: EARLY_NAME };
      sectors.forEach(function (sc) { first[sc] = Math.round((early.bySector[sc] || 0) / EARLY_YEARS * 10) / 10; });
      var rowsY = [first];
      for (var y = CUT; y <= Y1; y++) {
        var row = { year: String(y) };
        sectors.forEach(function (sc) { row[sc] = 0; });
        P.forEach(function (p) { if (p.months[y]) row[p.sector] += p.months[y]; });
        rowsY.push(row);
      }
      var xAxis = chart.xAxes.push(A.am5xy.CategoryAxis.new(r, { categoryField: "year", renderer: A.am5xy.AxisRendererX.new(r, { minGridDistance: 20 }) }));
      xAxis.get("renderer").labels.template.setAll({ fontSize: 11, rotation: -45, centerY: am5.p50, centerX: am5.p100 });
      xAxis.get("renderer").grid.template.setAll({ strokeOpacity: 0 });
      var yAxis = chart.yAxes.push(A.am5xy.ValueAxis.new(r, { min: 0, renderer: A.am5xy.AxisRendererY.new(r, {}) }));
      yAxis.get("renderer").grid.template.setAll({ strokeOpacity: .08 });
      yAxis.get("renderer").labels.template.setAll({ fontSize: 11 });
      yAxis.children.unshift(am5.Label.new(r, { text: "Months of project work", rotation: -90, y: am5.p50, centerX: am5.p50, fontSize: 12 }));
      var legend = chart.children.push(am5.Legend.new(r, { x: am5.p50, centerX: am5.p50 }));
      legend.labels.template.setAll({ fontSize: 12 });
      sectors.forEach(function (sc) {
        var s = chart.series.push(A.am5xy.ColumnSeries.new(r, { name: sc, xAxis: xAxis, yAxis: yAxis, valueYField: sc, categoryXField: "year", stacked: true,
          fill: am5.color(SECTOR[sc]), stroke: am5.color(SECTOR[sc]) }));
        s.set("tooltip", tip(r));
        s.columns.template.setAll({ width: am5.percent(72), strokeOpacity: 0, tooltipText: "{categoryX}: {name}, {valueY} months" });
        s.columns.template.adapters.add("tooltipText", function (t, c) {
          return c.dataItem && c.dataItem.get("categoryX") === first.year ? "{categoryX}, " + data.first_year + " to " + (CUT - 1) + ", average per year: {name}, {valueY} months" : t;
        });
        s.data.setAll(rowsY); if (!reduce) s.appear(800);
      });
      xAxis.data.setAll(rowsY);
      legend.data.setAll(chart.series.values);
      if (!reduce) chart.appear(900, 100);
    })();
  }

  window.addEventListener("sv-themechange", function () { if (data && !dash.hidden) setTimeout(draw, 50); });
  // redraw only when the width crosses the phone/desktop line (phones fire resize on scroll)
  var resizeT, wasNarrow = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT); resizeT = setTimeout(function () {
      var el = document.getElementById("cv-serp"), n = el && el.offsetWidth < 640;
      if (data && !dash.hidden && n !== wasNarrow) draw();
    }, 300);
  });
  show(location.hash === "#print" ? "print" : "dash");
})();
