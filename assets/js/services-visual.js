/* Services charts. Chart.js loads after a chart scrolls near.
   Colours are the --chart-* tokens, repainted when the theme changes.
   Yellow and grey on a light page, and purple and grey on a dark page, get a thicker edge. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stuck = document.querySelector(".sv-stuck");
  if (stuck && !reduce) {
    stuck.querySelectorAll(".sv-road").forEach(function (path) {
      if (!path.getClientRects().length) return;
      var len = path.getTotalLength();
      if (!len) return;
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        stuck.querySelectorAll(".sv-road").forEach(function (path) {
          if (!path.style.strokeDasharray) return;
          path.style.transition = "stroke-dashoffset 1.15s cubic-bezier(.65,0,.35,1)";
          path.style.strokeDashoffset = "0";
        });
      });
    });
  }

  function setCurrent(hash) {
    document.querySelectorAll(".sv-stop a").forEach(function (a) {
      if (a.getAttribute("href") === hash) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  document.querySelectorAll(".sv-stop a, .sv-intl a").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      ev.preventDefault();
      if (a.closest(".sv-stop")) setCurrent(href);
      if (history.pushState) history.pushState(null, "", href);
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
  if (location.hash) setCurrent(location.hash);
  window.addEventListener("hashchange", function () { setCurrent(location.hash); });

  var charts = document.querySelectorAll("[data-sv-chart]");
  if (!charts.length) return;

  var queue = [];
  var loading = null;
  var live = [];
  var probe = document.createElement("span");
  probe.hidden = true;
  document.documentElement.appendChild(probe);
  var pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  var pixelCtx = pixel.getContext("2d", { willReadFrequently: true });

  function asColor(value) {
    if (!value || /^rgba?\(/i.test(value)) return value;
    var mix = String(value).match(/color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/i);
    if (mix) {
      var r = Math.round(parseFloat(mix[1]) * 255);
      var g = Math.round(parseFloat(mix[2]) * 255);
      var b = Math.round(parseFloat(mix[3]) * 255);
      var alpha = mix[4] == null ? 1 : parseFloat(mix[4]);
      var a = alpha === 1 ? "1" : String(Math.round(alpha * 1000) / 1000);
      return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    }
    pixelCtx.clearRect(0, 0, 1, 1);
    pixelCtx.fillStyle = value;
    pixelCtx.fillRect(0, 0, 1, 1);
    var d = pixelCtx.getImageData(0, 0, 1, 1).data;
    var fallback = d[3] / 255;
    var fa = fallback === 1 ? "1" : String(Math.round(fallback * 1000) / 1000);
    return "rgba(" + d[0] + ", " + d[1] + ", " + d[2] + ", " + fa + ")";
  }

  var FALLBACK = {
    "--chart-1": "#2f75b6",
    "--chart-2": "#f27b36",
    "--chart-3": "#2a9d90",
    "--chart-4": "#7553a2",
    "--chart-5": "#e6a800"
  };

  function themeColors() {
    var cs = getComputedStyle(document.documentElement);
    function read(name) {
      var raw = (cs.getPropertyValue(name) || "").trim();
      if (!raw) {
        if (name === "--chart-muted") raw = "#88826c";
        else raw = FALLBACK[name] || "";
      }
      if (!raw) return "";
      probe.style.color = raw;
      return asColor(getComputedStyle(probe).color);
    }
    return {
      ink: read("--ink"),
      tick: read("--ink-muted") || read("--muted"),
      grid: read("--line"),
      paper: read("--paper"),
      c1: read("--chart-1"),
      c2: read("--chart-2"),
      c3: read("--chart-3"),
      c4: read("--chart-4"),
      c5: read("--chart-5"),
      muted: read("--chart-muted")
    };
  }

  function tokenColor(c, token) {
    if (token === "--chart-1") return c.c1;
    if (token === "--chart-2") return c.c2;
    if (token === "--chart-3") return c.c3;
    if (token === "--chart-4") return c.c4;
    if (token === "--chart-5") return c.c5;
    return c.muted;
  }

  function fmt(n, spec) {
    var num = Number(n);
    var text = Math.abs(num - Math.round(num)) < 0.001 ? String(Math.round(num)) : String(Math.round(num * 10) / 10);
    if (spec && spec.comma) text = text.replace(".", ",");
    return text + ((spec && spec.suffix) || "");
  }

  function paint(entry) {
    var c = themeColors(entry.el);
    var chart = entry.chart;
    var scales = chart.options.scales || {};
    ["x", "y"].forEach(function (axis) {
      if (!scales[axis]) return;
      scales[axis].ticks.color = c.tick;
      if (scales[axis].title) scales[axis].title.color = c.tick;
      scales[axis].grid.color = c.grid;
      if (!scales[axis].border) scales[axis].border = {};
      scales[axis].border.color = c.grid;
    });
    if (chart.options.plugins.legend) chart.options.plugins.legend.labels.color = c.ink;
    var tip = chart.options.plugins.tooltip;
    tip.backgroundColor = c.ink;
    tip.titleColor = c.paper;
    tip.bodyColor = c.paper;
    tip.borderColor = c.grid;
    tip.borderWidth = 1;
    chart.data.datasets.forEach(function (set) {
      var tokens = set.svTokens || [];
      if (entry.kind === "line") {
        var token = tokens[0] || "--chart-1";
        var color = tokenColor(c, token);
        set.backgroundColor = color;
        set.borderColor = color;
        set.pointBackgroundColor = color;
        set.pointBorderColor = color;
        set.pointBorderWidth = 0;
        set.borderWidth = 2;
      } else {
        var fills = tokens.map(function (token) { return tokenColor(c, token); });
        set.backgroundColor = fills;
        set.borderColor = fills;
        set.borderWidth = 0;
      }
    });
    chart.update("none");
  }

  function tipPlugin(c, spec) {
    return {
      backgroundColor: c.ink,
      titleColor: c.paper,
      bodyColor: c.paper,
      borderColor: c.grid,
      borderWidth: 1,
      callbacks: {
        label: function (item) {
          var name = item.dataset.label ? item.dataset.label + ": " : "";
          return name + fmt(item.parsed.x != null && item.chart.options.indexAxis === "y" ? item.parsed.x : item.parsed.y != null ? item.parsed.y : item.parsed, spec);
        }
      }
    };
  }

  function axisScale(c, spec, horizontal) {
    var value = {
      beginAtZero: true,
      max: spec.max || undefined,
      ticks: {
        color: c.tick,
        font: { size: 11 },
        callback: function (v) { return fmt(v, spec); }
      },
      grid: { color: c.grid },
      border: { color: c.grid }
    };
    var cats = {
      ticks: { color: c.tick, font: { size: 11 }, autoSkip: false },
      grid: { display: false },
      border: { color: c.grid }
    };
    if (spec.axis && !horizontal) {
      value.title = { display: true, text: spec.axis, color: c.tick, font: { size: 11 } };
    }
    if (spec.axis && horizontal) {
      value.title = { display: true, text: spec.axis, color: c.tick, font: { size: 11 } };
    }
    return horizontal ? { x: value, y: cats } : { x: cats, y: value };
  }

  function barData(labels, values, tokens, legend) {
    return {
      labels: labels,
      datasets: [{
        label: legend || "",
        data: values,
        svTokens: tokens,
        borderRadius: 4
      }]
    };
  }

  function draw(el) {
    if (el.getAttribute("data-sv-ready") === "1") return;
    el.setAttribute("data-sv-ready", "1");
    if (!window.Chart) return;
    var Chart = window.Chart;
    Chart.defaults.animation = reduce ? false : { duration: 600 };
    Chart.defaults.font.family = '"Open Sans", sans-serif';
    var spec = {};
    try { spec = JSON.parse(el.getAttribute("data-sv-series") || "{}"); } catch (err) { spec = {}; }
    var c = themeColors(el);
    var kind = spec.kind || el.getAttribute("data-sv-chart");

    function mount(canvas, chartKind, config) {
      var chart = new Chart(canvas, config);
      live.push({ chart: chart, kind: chartKind, el: el });
      paint(live[live.length - 1]);
    }

    if (kind === "paired") {
      var canvases = el.querySelectorAll("canvas");
      (spec.panels || []).forEach(function (panel, i) {
        if (!canvases[i]) return;
        mount(canvases[i], "columns", {
          type: "bar",
          data: barData(panel.labels, panel.values, panel.tokens),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tipPlugin(c, panel) },
            scales: axisScale(c, panel, false)
          }
        });
      });
      return;
    }

    var canvas = el.querySelector("canvas");
    if (!canvas) return;
    if (kind === "donut") {
      mount(canvas, "donut", {
        type: "doughnut",
        data: barData(spec.labels, spec.values, spec.tokens),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { position: "bottom", labels: { color: c.ink, boxWidth: 12, font: { size: 12 } } },
            tooltip: tipPlugin(c, spec)
          }
        }
      });
      return;
    }
    if (kind === "line") {
      mount(canvas, "line", {
        type: "line",
        data: {
          labels: spec.labels,
          datasets: (spec.datasets || []).map(function (set) {
            return {
              label: set.label,
              data: set.values,
              svTokens: [set.token],
              fill: false,
              tension: 0.25,
              borderDash: set.dashed ? [6, 4] : undefined,
              pointRadius: 3
            };
          })
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: c.ink, boxWidth: 12, font: { size: 12 } } },
            tooltip: tipPlugin(c, spec)
          },
          scales: axisScale(c, spec, false)
        }
      });
      return;
    }
    if (kind === "grouped") {
      mount(canvas, "columns", {
        type: "bar",
        data: {
          labels: spec.labels,
          datasets: (spec.datasets || []).map(function (set) {
            return {
              label: set.label,
              data: set.values,
              svTokens: spec.labels.map(function () { return set.token; }),
              borderRadius: 4
            };
          })
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: c.ink, boxWidth: 12, font: { size: 12 } } },
            tooltip: tipPlugin(c, spec)
          },
          scales: axisScale(c, spec, false)
        }
      });
      return;
    }
    var horizontal = kind === "hbar";
    mount(canvas, "columns", {
      type: "bar",
      data: barData(spec.labels, spec.values, spec.tokens),
      options: {
        indexAxis: horizontal ? "y" : "x",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tipPlugin(c, spec) },
        scales: axisScale(c, spec, horizontal)
      }
    });
  }

  function flush() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = "/sarunasvaitkus-preview/assets/vendor/chartjs/chart.umd.min.js";
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error("chart")); };
        document.head.appendChild(s);
      });
    }
    var batch = queue.splice(0);
    loading.then(function () { batch.forEach(draw); }).catch(function () {});
  }

  var scheduled = false;
  function schedulePaint() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      live.forEach(paint);
    });
  }

  var themeObs = new MutationObserver(schedulePaint);
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-theme-mode", "class"]
  });
  if (document.body) {
    themeObs.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme", "class"]
    });
  }
  var scheme = window.matchMedia("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) scheme.addEventListener("change", schedulePaint);
  else if (scheme.addListener) scheme.addListener(schedulePaint);

  if (!("IntersectionObserver" in window)) {
    queue = Array.prototype.slice.call(charts);
    flush();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    var hit = false;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      queue.push(entry.target);
      hit = true;
    });
    if (hit) flush();
  }, { rootMargin: "180px 0px" });
  charts.forEach(function (el) { io.observe(el); });
})();
