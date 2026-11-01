/* Accueil : le hero, puis « Comment ça se passe ».
   1. Hero : le téléphone 3D, déjà construit, entre en scène (il monte et
      pivote), la notification « Maurice est disponible » sort de l'écran,
      puis les cartes arrivent. Ensuite il flotte, suit le pointeur et l'app
      vit (onglets, feuilles).
   2. Process : la scène (atelier aux post-it, design, code, mise en ligne)
      reste épinglée pendant que l'on fait défiler, et la position dans la
      section fixe l'instant du scénario : les post-it arrivent un à un, la
      première version s'entoure, les pistes de design apparaissent, le code
      révèle l'écran, le téléphone se construit. Remonter rembobine ; la
      frise saute à une étape. Le scénario est construit une fois avec l'API
      Web Animations, en pause, et le défilement règle son currentTime.
   Si le visiteur a demandé à réduire les animations : téléphone immobile, et
   le process passe d'une étape à l'autre en images fixes. */
(function () {
  'use strict';
  if (!Element.prototype.animate || !document.timeline) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var EO = 'cubic-bezier(.16, 1, .3, 1)', EIO = 'cubic-bezier(.65, 0, .35, 1)', EIN = 'cubic-bezier(.55, 0, .8, .25)';
  var POP = 'cubic-bezier(.34, 1.56, .64, 1)', DRAW = 'cubic-bezier(.45, .05, .25, 1)';
  function q(sel, root) { return root.querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // 0 → 1 avec un léger dépassement, comme un objet qui se pose.
  function backOut(s) {
    if (s <= 0) return 0;
    if (s >= 1) return 1;
    var c1 = 1.3, c3 = c1 + 1;
    return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2);
  }
  function observe(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { rootMargin: '120px 0px' }).observe(el);
  }
  function fontsReady(fn) {
    if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1000); })]).then(fn);
    else fn();
  }

  /* ——— Le pointeur (ou l'inclinaison du téléphone), commun aux deux téléphones ——— */
  var tx = 0, ty = 0, px_ = 0, py_ = 0;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    tx = clamp(e.gamma / 30, -1, 1);
    ty = clamp((e.beta - 45) / 30, -1, 1);
  }, { passive: true });

  /* ——— Un tracé fait de plusieurs sous-tracés les dessine tous en même
     temps : on n'anime donc que jusqu'au plus long, mesuré une fois ——— */
  var meter = null, spans = new WeakMap();
  function span(path) {
    if (spans.has(path)) return spans.get(path);
    if (!meter) {
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
      svg.setAttribute('aria-hidden', 'true');
      meter = document.createElementNS(SVGNS, 'path');
      svg.appendChild(meter); document.body.appendChild(svg);
    }
    var parts = (path.getAttribute('d') || '').split(/(?=M)/), lens = [], total = 0;
    parts.forEach(function (d) { meter.setAttribute('d', d); var l = meter.getTotalLength(); lens.push(l); total += l; });
    var max = total ? Math.max.apply(null, lens) / total : 1;
    spans.set(path, max);
    return max;
  }

  /* ——— L'app qui vit : la vraie navigation de Maurice, une par téléphone ——— */
  function makeLive(root) {
    var bar = q('[data-tabbar]', root), track = q('[data-track]', root), pill = q('[data-pill]', root);
    var tabs = qa('.tab', track), panels = {}, sheets = {}, tops = {};
    qa('[data-tab]', root).forEach(function (el) { panels[el.getAttribute('data-tab')] = el; });
    qa('[data-sheet]', root).forEach(function (el) { sheets[el.getAttribute('data-sheet')] = el; });
    qa('[data-sheet-top]', root).forEach(function (el) { tops[el.getAttribute('data-sheet-top')] = el; });
    var tap = q('.device-tap', root), dim = q('[data-dim]', root);
    // Des onglets et deux feuilles modales ; positions de tap en % de l'écran.
    var route = [
      { tab: 0 },
      { sheet: 'resas', open: [50, 31.5], close: [50, 88.4], dim: 0.453 },
      { tab: 1 }, { tab: 5 }, { tab: 6 },
      { sheet: 'participants', open: [74, 10], close: [89, 13.1], dim: 0.21 }
    ];
    var step = 0, scrollX = 0, tabNow = 0, sheetOpen = null, timer = null, pending = [];
    function later(fn, ms) { pending.push(setTimeout(fn, ms)); }
    function maxScroll() { return Math.max(0, track.scrollWidth - bar.clientWidth); }
    function setScroll(x) { scrollX = x; track.style.setProperty('--tx', -x + 'px'); bar.classList.toggle('is-scrolled', x > 0); }
    function placePill(i) {
      var t = tabs[i];
      pill.style.setProperty('--px', t.offsetLeft + 'px');
      pill.style.setProperty('--pw', t.offsetWidth + 'px');
      tabs.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
    }
    function tapXY(left, top) {
      tap.style.left = left; tap.style.top = top;
      tap.classList.remove('is-tapping'); void tap.offsetWidth; tap.classList.add('is-tapping');
    }
    function tapTab(i) {
      var t = tabs[i];
      tapXY((bar.offsetLeft + t.offsetLeft - scrollX + t.offsetWidth / 2) + 'px', (bar.offsetTop + bar.offsetHeight / 2) + 'px');
    }
    function setSheet(st, on) {
      dim.style.setProperty('--dim', st.dim);
      dim.classList.toggle('is-on', on);
      sheets[st.sheet].classList.toggle('is-open', on);
      if (tops[st.sheet]) tops[st.sheet].classList.toggle('is-on', on);
    }
    function show(from, to) {
      var dir = to > from ? 1 : -1, out = panels[from], inn = panels[to];
      Object.keys(panels).forEach(function (k) { if (panels[k] !== out && panels[k] !== inn) panels[k].classList.remove('is-leaving'); });
      out.style.setProperty('--to', (-4 * dir) + '%');
      out.classList.remove('is-active'); out.classList.add('is-leaving');
      inn.style.transition = 'none'; inn.classList.remove('is-leaving');
      inn.style.setProperty('--from', (6 * dir) + '%');
      void inn.offsetWidth; inn.style.transition = ''; inn.classList.add('is-active');
    }
    function goTab(to) {
      var from = tabNow; tabNow = to;
      // l'onglet visé est hors de la barre : on la fait défiler d'abord
      var target = to >= 4 ? maxScroll() : 0, delay = 0;
      if (target !== scrollX) { setScroll(target); delay = 650; }
      later(function () { tapTab(to); later(function () { placePill(to); show(from, to); }, 160); }, delay);
    }
    function next() {
      if (sheetOpen) {
        var st = sheetOpen; sheetOpen = null;
        tapXY(st.close[0] + '%', st.close[1] + '%');
        later(function () { setSheet(st, false); }, 160);
        return;
      }
      step = (step + 1) % route.length;
      var s = route[step];
      if (s.sheet) { tapXY(s.open[0] + '%', s.open[1] + '%'); later(function () { setSheet(s, true); }, 160); sheetOpen = s; }
      else goTab(s.tab);
    }
    function layout() { setScroll(tabNow >= 4 ? maxScroll() : 0); placePill(tabNow); }
    function stop() { clearInterval(timer); timer = null; pending.forEach(clearTimeout); pending = []; }
    function reset() {
      stop();
      Object.keys(sheets).forEach(function (k) { sheets[k].classList.remove('is-open'); });
      Object.keys(tops).forEach(function (k) { tops[k].classList.remove('is-on'); });
      dim.classList.remove('is-on');
      Object.keys(panels).forEach(function (k) { panels[k].classList.remove('is-leaving'); panels[k].classList.toggle('is-active', k === '0'); });
      step = 0; tabNow = 0; sheetOpen = null; layout();
    }
    // Un premier geste après « first » ms, puis un toutes les 3,2 s.
    function start(first) {
      if (timer || reduce) return;
      var go = function () { if (!document.hidden) next(); };
      timer = setTimeout(function () { go(); timer = setInterval(go, 3200); }, first == null ? 3200 : first);
    }
    return { start: start, stop: stop, reset: reset, layout: layout };
  }

  /* ——— Lévitation : deux houles mêlées pour la hauteur, un balancement ample
     en lacet, de petits roulis ; le téléphone n'est jamais immobile. « k »
     dose le tout (0 : à plat, face au visiteur ; 1 : en lévitation). ——— */
  function makeFloat(device, shadow, rest) {
    return function (t, k, idle, sf) {
      var ry = k * (rest.ry + idle * (Math.sin(t * 0.33) * 20 + Math.sin(t * 0.71) * 4 + px_ * 18 + sf * 50));
      var rx = k * (rest.rx + idle * (Math.sin(t * 0.6) * 4 - py_ * 10 + sf * 18));
      var rz = k * (rest.rz + idle * Math.sin(t * 0.42) * 2.6);
      var fy = k * idle * (Math.sin(t * 0.8) * 13 + Math.sin(t * 0.37) * 5 - sf * 40);
      device.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      device.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      device.style.setProperty('--rz', rz.toFixed(2) + 'deg');
      device.style.setProperty('--fy', fy.toFixed(1) + 'px');
      device.style.setProperty('--gx', (50 + ry * 1.6).toFixed(1) + '%');
      if (shadow) shadow.style.setProperty('--ss', (1 - (fy + 18) / 80).toFixed(3));
    };
  }

  /* ═══════════ 1. Le hero : le téléphone, tout de suite ═══════════ */
  var hero = (function () {
    var root = document.querySelector('[data-hero]');
    var wrap = root && q('[data-hero-phone]', root);
    if (!wrap) return null;
    var device = q('[data-device]', wrap), scene = q('[data-scene]', wrap), notif = q('[data-notif]', wrap);
    var chips = qa('.chip', wrap), live = makeLive(wrap);
    var float = makeFloat(device, q('.device-shadow', wrap), { ry: 14, rx: 6, rz: -1.5 });
    var t0 = performance.now(), visible = true, liveOn = false, LIVE_AT = 4.8, anims = [];

    function anim(el, kf, delay, duration, easing, fill) {
      var a = el.animate(kf, { delay: delay, duration: duration, easing: easing || EO, fill: fill || 'both' });
      anims.push(a);
      return a;
    }
    if (!reduce) {
      // Les deux soulignés du titre, au crayon puis à la menthe.
      qa('[data-mark]', root).forEach(function (svg) {
        var mint = svg.getAttribute('data-mark') === 'mint';
        qa('path', svg).forEach(function (p) {
          anim(p, [{ strokeDashoffset: 1.04 }, { strokeDashoffset: 1 - span(p) }], mint ? 1250 : 600, mint ? 650 : 800, EIO);
        });
      });
      // Le téléphone monte et pivote vers sa pose (k, dans tick), la
      // notification tombe dans l'écran puis s'en détache, les cartes suivent.
      anim(scene, [{ opacity: 0, transform: 'translateY(80px) scale(.9)' }, { opacity: 1, transform: 'none' }], 100, 1400, EO);
      var z = Math.round(device.offsetWidth * 0.5);
      var inScreen = 'translateY(0%) translateZ(2px) scale(1)', out = 'translateY(-6%) translateZ(' + z + 'px) scale(1.35)';
      anim(notif, [{ opacity: 0, transform: 'translateY(-45%) translateZ(2px) scale(.94)' }, { opacity: 1, transform: inScreen }], 1150, 500, 'cubic-bezier(.2, 1.25, .4, 1)');
      anim(notif, [{ transform: inScreen, boxShadow: '0 4px 10px rgba(1, 1, 13, .22)' }, { transform: out, boxShadow: '0 26px 48px rgba(1, 1, 13, .45)' }], 1800, 750, 'cubic-bezier(.22, 1.45, .4, 1)', 'forwards');
      anim(notif, [{ opacity: 1, transform: out }, { opacity: 0, transform: 'translateY(-60%) translateZ(' + (z + 40) + 'px) scale(1.35)' }], 4000, 450, EIN, 'forwards');
      chips.forEach(function (c, i) { anim(c, [{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1 }], 4150 + i * 130, 450, POP); });
    }
    live.reset();
    wrap.classList.add('is-ready');
    observe(wrap, function (vis) {
      visible = vis;
      if (!vis && liveOn) { live.stop(); liveOn = false; }
    });
    fontsReady(function () { live.layout(); });

    function tick(now) {
      if (!visible) return;
      var t = (now - t0) / 1000;
      var k = reduce ? 1 : backOut((t - 0.3) / 1.4);
      var r = wrap.getBoundingClientRect();
      var sf = clamp(1 - r.bottom / (window.innerHeight + r.height * 0.2), 0, 1);
      float(t, k, reduce ? 0 : 1, sf);
      if (!liveOn && !reduce && t > LIVE_AT) { liveOn = true; live.start(1800); }
    }
    // Pour les vérifications : passer directement à la fin de l'entrée.
    function skip() { t0 = performance.now() - 10000; anims.forEach(function (a) { a.finish(); }); }
    return { tick: tick, skip: skip, layout: live.layout };
  })();

  /* ═══════════ 2. Le process, au rythme du défilement ═══════════ */
  var story = (function () {
    var section = document.querySelector('[data-story]');
    var stage = section && q('[data-stage]', section);
    if (!stage) return null;
    var pin = q('[data-pin]', section), rail = q('[data-rail]', section);
    var stepBtns = qa('[data-step]', rail), railFill = q('[data-rail-fill]', rail), caps = qa('[data-cap]', section);
    var device = q('[data-device]', stage), live = makeLive(stage);

    /* — La mise en scène —
       Positions en unités de scène : 1000 × 440 en large, 360 × 640 en étroit.
       Une fiche = [x du centre, y du centre, rotation, échelle]. Temps en secondes
       de scénario : c'est le défilement qui les fait avancer. */
    var PRESETS = {
      wide: {
        W: 1000,
        dev: { cx: 500, cy: 220, cyIntro: 220, w: 200 },
        // Atelier de cadrage : intitulés [x, y] et post-it [x, y, rotation, échelle].
        labels: { qui: [130, 38], comment: [130, 168], modele: [130, 298], idees: [650, 36], mvp: [506, 34], tard: [842, 34] },
        ctx: { qui: [130, 96, -2, 1], comment: [130, 226, 2, 1], modele: [130, 356, -1, 1] },
        ideas: { etapes: [420, 128, -5, 1], carte: [612, 104, 4, 1], depenses: [806, 146, -3, 1], checklist: [470, 300, 5, 1], chat: [684, 318, -6, 1], hotels: [880, 296, 4, 1] },
        sorted: { etapes: [425, 130, -1.5, 1], carte: [595, 130, 1.5, 1], depenses: [425, 264, 1, 1], checklist: [595, 264, -1, 1], chat: [842, 128, 3, .8], hotels: [842, 236, -4, .8] },
        arrows: [],
        frame: [320, 58, 372, 280, 22],
        stamp: [692, 338, -10],
        code: [40, 80], badge: [614, 30],
        pistes: [[681, 205, 0, .55], [797, 205, 0, .55], [913, 205, 0, .55]], plabels: [[681, 336], [797, 336], [913, 336]],
        retenue: [913, 94], ref: [905, 262, 0, .48], retenueRef: [905, 165], reflabel: [905, 374],
        pop: { z: 110, s: 1.4, y: -5 },
        // [apparition, disparition], texte, [x, y, rotation], flèche [x0, y0, x1, y1, courbure]
        notes: [
          { t: [7.1, 8.62], text: 'périmètre écrit = prix ferme', at: [330, 360, -2], arrow: null },
          { t: [10.4, 11.85], text: 'plusieurs pistes visuelles,\non en garde une', at: [630, 34, -3], arrow: null },
          { t: [13.5, 15.45], text: 'une version à tester\nà chaque jalon', at: [690, 118, -3], arrow: [702, 112, 694, 68, .3] },
          { t: [17.4, 19.8], text: 'en ligne,\nsous vos comptes', at: [712, 104, -3], arrow: [708, 114, 640, 76, -.2] }
        ]
      },
      tall: {
        W: 360,
        dev: { cx: 180, cy: 330, cyIntro: 430, w: 172 },
        labels: { qui: [62, 24], comment: [180, 24], modele: [298, 24], idees: [180, 160], mvp: [180, 168], tard: [180, 412] },
        ctx: { qui: [62, 80, -2, 1], comment: [180, 80, 2, 1], modele: [298, 80, -1, 1] },
        ideas: { etapes: [96, 214, -6, 1], carte: [264, 234, 5, 1], depenses: [110, 330, 4, 1], checklist: [252, 352, -5, 1], chat: [100, 452, -3, 1], hotels: [258, 472, 6, 1] },
        sorted: { etapes: [100, 232, -1.5, 1], carte: [260, 232, 1.5, 1], depenses: [100, 322, 1, 1], checklist: [260, 322, -1, 1], chat: [108, 466, 3, .8], hotels: [252, 466, -4, .8] },
        arrows: [],
        frame: [22, 184, 316, 186, 18],
        stamp: [300, 370, -10],
        code: [8, 6], badge: [8, 224],
        pistes: [[110, 110, 0, .38], [180, 110, 0, .38], [250, 110, 0, .38]], plabels: [[110, 192], [180, 192], [250, 192]],
        retenue: [250, 44], ref: null,
        pop: { z: 100, s: 1.7, y: -6 },
        notes: [
          { t: [7.1, 8.62], text: 'périmètre écrit = prix ferme', at: [44, 540, -2], arrow: null },
          { t: [10.4, 11.85], text: 'plusieurs pistes, on en garde une', at: [44, 212, -3], arrow: null },
          { t: [13.5, 15.45], text: 'à tester\nà chaque\njalon', at: [14, 264, -3], arrow: null },
          { t: [17.4, 19.8], text: 'en ligne, sous vos comptes', at: [74, 34, -3], arrow: [180, 68, 182, 132, .15] }
        ]
      }
    };
    var PH = [0, 8.4, 12.05, 15.45], END = 21.0;
    /* — Le défilement → l'instant du scénario —
       Chaque tronçon : [poids, de, à]. Un poids vaut une demi-hauteur d'écran.
       Les paliers (de = à) laissent le temps de lire la fin d'une étape. */
    var SEGS = [
      [0.2, 0, 0],          // la carte s'installe
      [0.9, 0, 2.0],        // pour qui, comment, quel modèle
      [1.3, 2.0, 4.45],     // les idées, une à une
      [0.6, 4.45, 5.9],     // le tri : la première version, le reste plus tard
      [0.9, 5.9, 8.36],     // la première version s'entoure : cadre, tampon, coches
      [0.55, 8.36, 8.38],   // palier
      [1.2, 8.38, 11.58],   // design : fil de fer, trois pistes, une retenue
      [0.5, 11.58, 11.6],   // palier
      [0.5, 11.6, 12.05],
      [1.2, 12.05, 15.05],  // développement : le code révèle l'écran
      [0.5, 15.05, 15.07],  // palier
      [1.9, 15.07, 21.0],   // mise en ligne : le téléphone se construit
      [0.9, 21.0, 21.0]     // l'app vit
    ];
    var STILL = [8.36, 11.58, 15.05, 21.0];   // mouvement réduit : une image par étape
    var W = SEGS.reduce(function (s, g) { return s + g[0]; }, 0);
    var LEAD = 0.25;                          // le scénario démarre un peu avant l'épinglage
    function tAt(w) {
      for (var i = 0, acc = 0; i < SEGS.length; i++) {
        var g = SEGS[i];
        if (w <= acc + g[0]) return g[1] + (g[2] - g[1]) * (g[0] ? (w - acc) / g[0] : 1);
        acc += g[0];
      }
      return END;
    }
    function wAt(t) {
      for (var i = 0, acc = 0; i < SEGS.length; i++) {
        var g = SEGS[i];
        if (g[2] > g[1] && g[2] >= t) return acc + g[0] * clamp((t - g[1]) / (g[2] - g[1]), 0, 1);
        acc += g[0];
      }
      return W;
    }

    function byKey(sel, attr) { var o = {}; qa(sel, stage).forEach(function (el) { o[el.getAttribute(attr)] = el; }); return o; }
    var E = {
      scene: q('[data-scene]', stage), screen: q('[data-screen]', stage), bezel: q('.device-bezel', stage), edges: qa('.device-edge', stage),
      back: q('.device-back', stage), buttons: q('.device-buttons', stage), glare: q('.device-glare', stage), glow: q('.device-glow', stage),
      shadow: q('.device-shadow', stage), island: q('[data-island]', stage), notif: q('[data-notif]', stage), light: q('[data-light]', stage),
      contourSvg: q('.device-contour', stage), contour: q('[data-contour]', stage), chips: qa('.chip', stage),
      intro: q('[data-intro]', stage), live: q('[data-live]', stage), wire: q('[data-wire]', stage),
      scan: q('[data-scan]', stage), reals: qa('[data-real]', stage), flashes: qa('[data-flash]', stage),
      ink: q('[data-ink]', stage), stamp: q('[data-stamp]', stage),
      pi: byKey('[data-pi]', 'data-pi'), picheck: byKey('[data-picheck]', 'data-picheck'), blabels: byKey('[data-blabel]', 'data-blabel'),
      code: q('[data-code]', stage), lines: qa('[data-line]', stage), badge: q('[data-badge]', stage),
      strip: q('[data-strip]', stage), noteInk: q('[data-note-ink]', stage), notes: qa('[data-note]', stage),
      pistes: qa('[data-piste]', stage), plabels: qa('[data-plabel]', stage), retenue: q('[data-retenue]', stage), reflabel: q('[data-reflabel]', stage)
    };
    E.hls = E.lines.map(function (li) { return q('.hl', li); });
    var float = makeFloat(device, E.shadow, { ry: -18, rx: 6, rz: 1.5 });

    var anims = [], seen = null, P = PRESETS.wide, u = 1;
    // Chaque élément démarre dans l'état de sa première animation (fill
    // « both ») ; les suivantes ne s'appliquent qu'une fois commencées.
    function add(el, kf, at, dur, ease) {
      if (!el) return null;
      var props = Object.keys(kf[0]).filter(function (k) { return k !== 'offset' && k !== 'easing'; });
      var s = seen.get(el); if (!s) { s = {}; seen.set(el, s); }
      var fresh = props.every(function (p) { return !s[p]; });
      props.forEach(function (p) { s[p] = 1; });
      var a = el.animate(kf, { duration: Math.max(1, dur * 1000), delay: at * 1000, easing: ease || EO, fill: fresh ? 'both' : 'forwards' });
      a.pause();
      anims.push(a);
      return a;
    }
    function px(v) { return (v * u).toFixed(2) + 'px'; }
    function tf(p) { return 'translate(' + px(p[0]) + ', ' + px(p[1]) + ') rotate(' + (p[2] || 0) + 'deg) scale(' + (p[3] == null ? 1 : p[3]) + ')'; }
    function draw(list, at, dur, ease) {
      [].concat(list).forEach(function (p) {
        if (p) add(p, [{ strokeDashoffset: 1.04 }, { strokeDashoffset: 1 - span(p) }], at, dur, ease || DRAW);
      });
    }
    function wipe(el, at, dur, ease) {
      add(el, [{ clipPath: 'inset(-30% 100% -30% -8%)' }, { clipPath: 'inset(-30% -8% -30% -8%)' }], at, dur, ease || 'cubic-bezier(.4, 0, .3, 1)');
    }

    // Flèches et cadre, recalculés à chaque mise en page (en pixels de scène).
    function mk(svg, cls) { var p = document.createElementNS(SVGNS, 'path'); p.setAttribute('class', cls); p.setAttribute('pathLength', '1'); svg.appendChild(p); return p; }
    function f1(v) { return v.toFixed(1); }
    function clear(svg) {
      svg.setAttribute('viewBox', '0 0 ' + stage.clientWidth + ' ' + stage.clientHeight);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    }
    // Une flèche tracée à la main : une tige doublée, puis la pointe.
    function arrow(svg, cls, a, bend) {
      var x0 = a[0] * u, y0 = a[1] * u, x1 = a[2] * u, y1 = a[3] * u;
      var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy);
      var cx = (x0 + x1) / 2 - dy * bend, cy = (y0 + y1) / 2 + dx * bend, j = Math.max(1.2, len * .02);
      var shaft = mk(svg, cls), head = mk(svg, cls);
      shaft.setAttribute('d', 'M' + f1(x0) + ' ' + f1(y0) + ' Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(x1) + ' ' + f1(y1) +
        ' M' + f1(x0 + j) + ' ' + f1(y0 - j * .6) + ' Q' + f1(cx - j) + ' ' + f1(cy + j) + ' ' + f1(x1 - j * .4) + ' ' + f1(y1 + j * .5));
      var ax = x1 - cx, ay = y1 - cy, al = Math.sqrt(ax * ax + ay * ay); ax /= al; ay /= al;
      var h = Math.min(12 * u * (P.W === 1000 ? 1 : 1.6), len * .3), w = h * .62;
      head.setAttribute('d', 'M' + f1(x1 - ax * h - ay * w) + ' ' + f1(y1 - ay * h + ax * w) + ' L' + f1(x1) + ' ' + f1(y1) + ' L' + f1(x1 - ax * h + ay * w) + ' ' + f1(y1 - ay * h - ax * w));
      return [shaft, head];
    }
    function layoutInk() {
      clear(E.ink); clear(E.noteInk);
      var arrows = P.arrows.map(function (a, i) { return arrow(E.ink, 'ink-arrow', a, (i ? -1 : 1) * .16); });
      var noteArrows = P.notes.map(function (n) { return n.arrow ? arrow(E.noteInk, '', n.arrow, n.arrow[4]) : null; });
      var f = P.frame, x = f[0] * u, y = f[1] * u, w = f[2] * u, hh = f[3] * u, r = f[4] * u;
      var frame = mk(E.ink, 'ink-frame');
      frame.setAttribute('d', 'M' + f1(x + r) + ' ' + f1(y) + ' H' + f1(x + w - r) + ' A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x + w) + ' ' + f1(y + r) +
        ' V' + f1(y + hh - r) + ' A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x + w - r) + ' ' + f1(y + hh) + ' H' + f1(x + r) +
        ' A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x) + ' ' + f1(y + hh - r) + ' V' + f1(y + r) + ' A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(x + r) + ' ' + f1(y));
      return { arrows: arrows, frame: frame, notes: noteArrows };
    }

    function build() {
      anims.forEach(function (a) { a.cancel(); });
      anims = []; seen = new Map();
      var name = getComputedStyle(stage).getPropertyValue('--preset').trim();
      P = PRESETS[name] || PRESETS.wide;
      u = stage.clientWidth / P.W;
      var ink = layoutInk();
      var cardShadow = '0 ' + px(14) + ' ' + px(32) + ' rgba(1, 1, 13, .38)', noShadow = '0 0 0 rgba(1, 1, 13, 0)';

      /* — 1. Cadrage : l'atelier aux post-it — */
      function slap(el, p, at) {
        add(el, [{ opacity: 0, transform: tf([p[0], p[1] - 8, p[2] + (p[2] >= 0 ? 9 : -9), 1.25]) }, { opacity: 1, transform: tf(p) }], at, .42, POP);
      }
      function showLabel(k, at) {
        var l = P.labels[k];
        add(E.blabels[k], [{ opacity: 0, transform: tf([l[0], l[1] + 6, 0, 1]) }, { opacity: 1, transform: tf([l[0], l[1], 0, 1]) }], at, .4, EO);
      }
      // Le cadre fonctionnel : pour qui, comment, quel modèle. Un post-it à la fois.
      ['qui', 'comment', 'modele'].forEach(function (k, i) { showLabel(k, .25 + i * .55); slap(E.pi[k], P.ctx[k], .4 + i * .55); });
      // Les idées de fonctionnalités, collées en vrac…
      var IDEAS = ['etapes', 'carte', 'depenses', 'checklist', 'chat', 'hotels'], MVP = IDEAS.slice(0, 4), LATER = IDEAS.slice(4);
      showLabel('idees', 2.1);
      IDEAS.forEach(function (k, i) { slap(E.pi[k], P.ideas[k], 2.3 + i * .3); });
      // …puis triées : la première version d'un côté, mise en avant ; le reste « plus tard », en retrait.
      add(E.blabels.idees, [{ opacity: 1 }, { opacity: 0 }], 4.6, .3);
      showLabel('mvp', 4.7); showLabel('tard', 4.85);
      IDEAS.forEach(function (k, i) { add(E.pi[k], [{ transform: tf(P.ideas[k]) }, { transform: tf(P.sorted[k]) }], 4.8 + i * .12, .75, EIO); });
      LATER.forEach(function (k, i) {
        add(E.pi[k], [{ backgroundColor: '#FFE27A', color: '#2E2B45' }, { backgroundColor: '#CFCBE0', color: '#6B6785' }], 5.3 + i * .1, .6);
        add(E.pi[k], [{ opacity: 1 }, { opacity: .85 }], 5.3 + i * .1, .6);
      });
      draw(ink.frame, 5.95, .9, EIO);
      var st = P.stamp;
      add(E.stamp, [{ opacity: 0, transform: tf([st[0], st[1], st[2] - 8, 2.3]) }, { opacity: 1, transform: tf([st[0], st[1], st[2], .94]), offset: .75 }, { opacity: 1, transform: tf([st[0], st[1], st[2], 1]) }], 6.8, .3, 'cubic-bezier(.5, 0, .3, 1)');
      MVP.forEach(function (k, i) {
        var c = E.picheck[k], at = 7.05 + i * .2;
        add(c, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], at, .4, POP);
        draw(qa('path', c), at + .15, .25, EIO);
      });
      add(ink.frame, [{ strokeWidth: 3 }, { strokeWidth: 6, offset: .45 }, { strokeWidth: 3 }], 7.8, .55, 'ease-in-out');

      /* — 2. Design : les post-it de la première version deviennent un fil de fer, puis trois pistes — */
      ['qui', 'comment', 'modele'].forEach(function (k, i) {
        var p = P.ctx[k];
        add(E.pi[k], [{ opacity: 1, transform: tf(p) }, { opacity: 0, transform: tf([p[0] - 50, p[1], p[2] - 6, p[3] * .9]) }], 8.4 + i * .05, .45, EIN);
      });
      LATER.forEach(function (k, i) {
        var p = P.sorted[k];
        add(E.pi[k], [{ opacity: .85, transform: tf(p) }, { opacity: 0, transform: tf([p[0] + 50, p[1], p[2] + 6, p[3] * .9]) }], 8.4 + i * .05, .45, EIN);
      });
      ['qui', 'comment', 'modele', 'mvp', 'tard'].forEach(function (k) { add(E.blabels[k], [{ opacity: 1 }, { opacity: 0 }], 8.4, .3); });
      [E.stamp, E.ink].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 8.4, .35, EO); });
      // Les post-it retenus entrent dans l'écran…
      var cx = P.dev.cx, cy = P.dev.cyIntro;
      MVP.forEach(function (k, i) {
        var p = P.sorted[k];
        add(E.pi[k], [{ opacity: 1, transform: tf(p) }, { opacity: 1, transform: tf([(p[0] + cx) / 2, (p[1] + cy) / 2, 0, .7]), offset: .55 }, { opacity: 0, transform: tf([cx, cy, 0, .25]) }], 8.5 + i * .08, .65, EIO);
      });
      add(E.scene, [{ opacity: 0, scale: .9 }, { opacity: 1, scale: 1 }], 8.65, .5, EO);
      add(E.screen, [{ boxShadow: cardShadow }, { boxShadow: noShadow }], 12.05, .5, EO);
      // …et deviennent un fil de fer, révélé par le balayage menthe.
      add(E.scan, [{ opacity: 0 }, { opacity: 1 }], 8.96, .06);
      add(E.scan, [{ top: '-6%' }, { top: '94%' }], 9, .85, EIO);
      add(E.scan, [{ opacity: 1 }, { opacity: 0 }], 9.85, .2);
      add(E.wire, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], 9, .85, EIO);
      // Trois pistes du même écran. On garde la troisième (le vrai style de Maurice),
      // les deux autres s'effacent sans être barrées.
      var pisteShadow = '0 ' + px(13) + ' ' + px(33) + ' rgba(1, 1, 13, .4)';
      P.pistes.forEach(function (p, i) {
        var t = 9.95 + i * .15, l = P.plabels[i];
        add(E.pistes[i], [{ opacity: 0, transform: tf([p[0], p[1] + 14, p[2], p[3] * .85]) }, { opacity: 1, transform: tf(p) }], t, .5, EO);
        add(E.plabels[i], [{ opacity: 0, transform: tf([l[0], l[1] + 6, 0, 1]) }, { opacity: 1, transform: tf([l[0], l[1], 0, 1]) }], t + .2, .4, EO);
      });
      var kept = E.pistes[2], r = P.retenue;
      add(E.retenue, [{ opacity: 0, transform: tf([r[0], r[1] + 6, 0, .4]) }, { opacity: 1, transform: tf([r[0], r[1], 0, 1]) }], 11.1, .45, POP);
      draw(qa('path', E.retenue), 11.28, .28, EIO);
      add(kept, [{ boxShadow: pisteShadow }, { boxShadow: pisteShadow + ', 0 0 0 ' + px(3) + ' #88F9C0' }], 11.1, .35, EO);
      // Les deux autres pistes ne partent qu'après le palier de lecture.
      [0, 1].forEach(function (i) {
        var p = P.pistes[i];
        add(E.pistes[i], [{ opacity: 1, transform: tf(p) }, { opacity: 0, transform: tf([p[0], p[1] + 24, p[2], p[3] * .9]) }], 11.7 + i * .06, .45, EIN);
      });
      E.plabels.forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 11.65, .3); });
      if (P.ref) {
        // En large, la piste retenue reste à côté : c'est la maquette que le code reproduit.
        add(kept, [{ transform: tf(P.pistes[2]) }, { transform: tf(P.ref) }], 11.8, .6, EIO);
        add(E.retenue, [{ transform: tf([r[0], r[1], 0, 1]) }, { transform: tf([P.retenueRef[0], P.retenueRef[1], 0, 1]) }], 11.8, .6, EIO);
        add(E.reflabel, [{ opacity: 0, transform: tf([P.reflabel[0], P.reflabel[1], 0, 1]) }, { opacity: 1, transform: tf([P.reflabel[0], P.reflabel[1], 0, 1]) }], 12.35, .4);
        [kept, E.retenue, E.reflabel].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 15.35, .4); });
      } else {
        [kept, E.retenue].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 11.8, .35); });
      }

      /* — 3. Développement : le code reproduit la maquette retenue — */
      var cx0 = P.code[0], cy0 = P.code[1];
      add(E.code, [{ opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }, { opacity: 1, transform: tf([cx0, cy0, 0, 1]) }], 12.05, .55, EO);
      var lineT = [12.6, 12.7, 12.8, 12.95, 13.55, 14.15, 14.75, 15.1, 15.17, 15.24];
      E.lines.forEach(function (li, i) {
        add(li, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], lineT[i], i >= 3 && i <= 6 ? .24 : .1, 'steps(16, end)');
      });
      var R = [[0, 66], [34, 59.6], [40.4, 28.4], [71.6, 0]];
      [3, 4, 5, 6].forEach(function (li, k) {
        var t = lineT[li];
        add(E.hls[li], [{ opacity: 0 }, { opacity: 1 }], t + .2, .12);
        add(E.hls[li], [{ opacity: 1 }, { opacity: 0 }], k < 3 ? lineT[li + 1] + .2 : 15.3, .2);
        add(E.reals[k], [{ clipPath: 'inset(' + R[k][0] + '% 100% ' + R[k][1] + '% 0%)' }, { clipPath: 'inset(' + R[k][0] + '% 0% ' + R[k][1] + '% 0%)' }], t + .26, .45, EIO);
        add(E.flashes[k], [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], t + .26, .75, 'ease-out');
      });
      var b = P.badge;
      add(E.badge, [{ opacity: 0, transform: tf([b[0], b[1] + 8, 0, 1]) }, { opacity: 1, transform: tf([b[0], b[1], 0, 1]) }], 13.35, .45, EO);
      add(E.strip, [{ transform: 'translateY(0em)' }, { transform: 'translateY(-1.2em)' }], 14.5, .35, POP);
      add(E.strip, [{ transform: 'translateY(-1.2em)' }, { transform: 'translateY(-2.4em)' }], 15.2, .35, POP);

      /* — 4. Mise en ligne — */
      add(E.code, [{ opacity: 1, transform: tf([cx0, cy0, 0, 1]) }, { opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }], 15.45, .4, EIN);
      add(E.badge, [{ opacity: 1 }, { opacity: 0 }], 15.45, .35);
      add(E.contourSvg, [{ opacity: 0 }, { opacity: 1 }], 15.53, .05);
      draw(E.contour, 15.55, .75, EIO);
      add(E.contourSvg, [{ opacity: 1 }, { opacity: 0 }], 16.45, .45);
      add(E.bezel, [{ opacity: 0 }, { opacity: 1 }], 16.05, .45, EO);
      E.edges.forEach(function (el, i) { add(el, [{ opacity: 0 }, { opacity: 1 }], 16.15 + i * .035, .15); });
      add(E.back, [{ opacity: 0 }, { opacity: 1 }], 16.35, .2);
      add(E.buttons, [{ opacity: 0 }, { opacity: 1 }], 16.35, .2);
      add(E.island, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], 16.3, .45, POP);
      add(E.glare, [{ opacity: 0 }, { opacity: 1 }], 16.4, .5);
      add(E.glow, [{ scale: 0 }, { scale: 1 }], 16.35, .8, EO);
      add(E.shadow, [{ opacity: 0 }, { opacity: 1 }], 16.35, .6);
      var dy = P.dev.cyIntro - P.dev.cy;
      if (dy) add(E.scene, [{ transform: 'translateY(' + px(dy) + ')' }, { transform: 'translateY(0px)' }], 16.2, .9, EO);
      add(E.light, [{ transform: 'translateX(-130%)' }, { transform: 'translateX(130%)' }], 16.5, .6, 'ease-in-out');
      var pop = P.pop, inScreen = 'translateY(0%) translateZ(2px) scale(1)';
      var out = 'translateY(' + pop.y + '%) translateZ(' + px(pop.z) + ') scale(' + pop.s + ')';
      add(E.notif, [{ opacity: 0, transform: 'translateY(-45%) translateZ(2px) scale(.94)' }, { opacity: 1, transform: inScreen }], 16.7, .5, 'cubic-bezier(.2, 1.25, .4, 1)');
      add(E.notif, [{ transform: inScreen, boxShadow: '0 ' + px(4) + ' ' + px(10) + ' rgba(1, 1, 13, .22)' }, { transform: out, boxShadow: '0 ' + px(26) + ' ' + px(48) + ' rgba(1, 1, 13, .45)' }], 17.3, .75, 'cubic-bezier(.22, 1.45, .4, 1)');
      // Les cartes flottantes n'arrivent qu'une fois la notification partie.
      E.chips.forEach(function (c, i) { add(c, [{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1 }], 19.7 + i * .15, .45, POP); });
      add(E.notif, [{ opacity: 1, transform: out }, { opacity: 0, transform: 'translateY(' + (pop.y - 60) + '%) translateZ(' + px(pop.z + 40) + ') scale(' + pop.s + ')' }], 19.75, .45, EIN);
      add(E.live, [{ opacity: 0 }, { opacity: 1 }], 20.1, .05);
      add(E.intro, [{ opacity: 1 }, { opacity: 0 }], 20.15, .15);

      /* — Notes turquoise : écrites ligne à ligne, puis la flèche — */
      P.notes.forEach(function (n, i) {
        var el = E.notes[i];
        if (!el) return;
        el.textContent = '';
        n.text.split('\n').forEach(function (line) { var sp = document.createElement('span'); sp.textContent = line; el.appendChild(sp); });
        el.style.transform = tf(n.at);
        add(el, [{ opacity: 0 }, { opacity: 1 }], n.t[0], .05);
        [].forEach.call(el.children, function (sp, k) { wipe(sp, n.t[0] + k * .22, .42); });
        var lineCount = el.children.length;
        if (ink.notes[i]) {
          var at = n.t[0] + lineCount * .22 + .1;
          draw(ink.notes[i][0], at, .35, DRAW);
          draw(ink.notes[i][1], at + .32, .14, 'ease-out');
          ink.notes[i].forEach(function (pth) { add(pth, [{ opacity: 1 }, { opacity: 0 }], n.t[1] - .25, .25); });
        }
        add(el, [{ opacity: 1 }, { opacity: 0 }], n.t[1] - .25, .25);
      });
    }
    function seek(t) { anims.forEach(function (a) { a.currentTime = t * 1000; }); }
    // Le téléphone ne se met à flotter qu'une fois construit.
    function blend(t) { return backOut(t - 16.2); }

    /* — Le défilement — */
    function setLength() {
      var h = pin.offsetHeight;
      section.style.height = Math.round(h * (1 + (reduce ? 3.2 : W * 0.5))) + 'px';
    }
    function progress() {
      var h = pin.offsetHeight, lead = h * LEAD;
      var total = section.offsetHeight - h + lead;
      return total > 0 ? clamp((lead - section.getBoundingClientRect().top) / total, 0, 1) : 0;
    }
    function targetT(p) { return reduce ? STILL[Math.min(3, Math.floor(p * 4))] : tAt(p * W); }
    function stepOf(t) { var idx = 0; PH.forEach(function (p, i) { if (t >= p - 1e-6) idx = i; }); return idx; }
    function scrollToStep(i) {
      var h = pin.offsetHeight, lead = h * LEAD, total = section.offsetHeight - h + lead;
      var p = reduce ? (i + 0.5) / 4 : wAt(i ? PH[i] + 0.3 : 0.05) / W;
      var top = section.getBoundingClientRect().top + window.pageYOffset - lead + p * total + 1;
      window.scrollTo({ top: Math.round(top), behavior: reduce ? 'auto' : 'smooth' });
    }
    stepBtns.forEach(function (btn, i) { btn.addEventListener('click', function () { scrollToStep(i); }); });

    var T = 0, shown = -1, capIdx = -1, visible = false, liveOn = false, jump = true, ready = false;
    function updateUI(p) {
      railFill.style.setProperty('--p', p.toFixed(4));
      var idx = stepOf(T);
      if (idx === capIdx) return;
      capIdx = idx;
      caps.forEach(function (c, i) { c.classList.toggle('is-active', i === idx); });
      stepBtns.forEach(function (btn, i) {
        btn.classList.toggle('is-done', i < idx);
        btn.classList.toggle('is-active', i === idx);
        if (i === idx) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
      });
    }
    function tick(now, dt) {
      if (!visible || !ready) return;
      var p = progress(), goal = targetT(p);
      if (jump || reduce) { T = goal; jump = false; }
      else {
        T += (goal - T) * (1 - Math.exp(-dt * 9));
        if (Math.abs(goal - T) < 5e-4) T = goal;
      }
      if (Math.abs(T - shown) > 1e-4) { seek(T); shown = T; }
      updateUI(p);
      float(now / 1000, blend(T), reduce ? 0 : 1, 0);
      // Arrivé au bout : l'app vit. On rembobine : elle revient à son premier écran.
      if (T >= END - 1e-3) { if (!liveOn && !reduce) { liveOn = true; live.start(1400); } }
      else if (liveOn) { liveOn = false; live.reset(); }
    }
    observe(section, function (vis) {
      if (vis && !visible) jump = true;
      visible = vis;
      if (!vis && liveOn) { live.stop(); liveOn = false; }
    });

    var lastW = 0, resizeTimer = null;
    function relayout(force) {
      setLength();
      if (force || stage.clientWidth !== lastW) {
        lastW = stage.clientWidth;
        build(); shown = -1;
        live.layout();
      }
    }
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { relayout(false); }, 200);
    });
    // On attend les polices (l'écriture manuscrite), une seconde au plus.
    fontsReady(function () {
      relayout(true);
      live.reset();
      stage.classList.add('is-ready');
      ready = true; jump = true;
    });
    return {
      tick: tick,
      // Pour les vérifications : où se trouve tel instant du scénario, et se caler net dessus.
      test: { W: W, LEAD: LEAD, PH: PH, END: END, wAt: wAt, settle: function () { jump = true; }, time: function () { return T; } }
    };
  })();

  /* ——— Une seule boucle d'affichage pour les deux ——— */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    px_ += (tx - px_) * 0.06; py_ += (ty - py_) * 0.06;
    if (hero) hero.tick(now);
    if (story) story.tick(now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (hero) fontsReady(hero.layout);

  window.__hero = { skip: hero ? hero.skip : null, story: story ? story.test : null };
})();
