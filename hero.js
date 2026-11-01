/* Hero de l'accueil : « Votre app, du croquis aux stores, sans détour ».
   Un scénario d'environ 15 s en quatre temps, suivis par la frise sous la scène :
   1. Croquis : trois écrans de Maurice se dessinent au crayon. Un doigt
      dessiné tape « Carte » puis « Dépenses » : le prototype papier vit déjà.
   2. Cadrage : les fiches se rangent en parcours, le trait menthe trace le
      périmètre de la V1 et chaque écran retenu reçoit son étiquette.
   3. Développement : un balayage fait passer l'écran du croquis au fil de
      fer, puis chaque ligne de code change un bloc en vrai composant.
   4. Stores : le téléphone se construit autour de l'écran, la notification
      App Store tombe, puis l'app vit (vraie navigation dans Maurice).
   Tout repose sur l'API Web Animations : le scénario se met en pause hors
   écran, se rejoue, et la frise permet de revenir à une étape. Si le
   visiteur a demandé à réduire les animations, on montre l'état final, et
   la frise affiche chaque étape en image fixe. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]');
  var stage = hero && hero.querySelector('[data-stage]');
  if (!stage || !stage.animate || !document.timeline) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';
  function q(sel, root) { return (root || stage).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || stage).querySelectorAll(sel)); }

  var device = q('[data-device]');
  var rail = hero.querySelector('[data-rail]');
  var stepBtns = qa('[data-step]', rail);
  var railFill = q('[data-rail-fill]', rail);
  var replayBtn = q('[data-replay]', rail);

  /* ——— Après l'intro : la vraie navigation dans Maurice ——— */
  var live = (function () {
    var bar = q('[data-tabbar]'), track = q('[data-track]'), pill = q('[data-pill]');
    var tabs = qa('.tab', track), panels = {}, sheets = {}, tops = {};
    qa('[data-tab]').forEach(function (el) { panels[el.getAttribute('data-tab')] = el; });
    qa('[data-sheet]').forEach(function (el) { sheets[el.getAttribute('data-sheet')] = el; });
    qa('[data-sheet-top]').forEach(function (el) { tops[el.getAttribute('data-sheet-top')] = el; });
    var tap = q('.device-tap'), dim = q('[data-dim]');
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
    function start() { if (timer || reduce) return; timer = setInterval(function () { if (!document.hidden) next(); }, 3200); }
    return { start: start, stop: stop, reset: reset, layout: layout };
  })();

  /* ——— La mise en scène ———
     Positions en unités de scène : 1000 × 440 en large, 360 × 640 en étroit.
     Une fiche = [x du centre, y du centre, rotation, échelle]. */
  var PRESETS = {
    wide: {
      W: 1000,
      dev: { cx: 500, cy: 220, cyIntro: 220, w: 200 },
      fanL: [440, 230, -8, .92], fanR: [560, 230, 8, .92],
      outL: [330, 225, -5, .9], outR: [670, 225, 5, .9],
      rowL: [238, 222, -2, .8], rowR: [762, 222, 2, .8],
      exitL: [-90, 235, -14, .8], exitR: [1090, 235, 14, .8],
      arrows: [[402, 168, 318, 190], [598, 168, 682, 190]],
      frame: [140, 4, 720, 432, 26],
      stamp: [186, 26, -12],
      keep: [[500, 412], [238, 383], [762, 383]],
      code: [40, 80], badge: [614, 30],
      fingerIn: [740, 540], fingerOut: [780, 560],
      pop: { z: 110, s: 1.4, y: -5 },
      // [apparition, disparition], texte, [x, y, rotation], flèche [x0, y0, x1, y1, courbure]
      notes: [
        { t: [2.0, 3.75], text: 'on teste au crayon,\navant le code', at: [790, 58, -3], arrow: [800, 136, 590, 166, -.22] },
        { t: [5.3, 7.2], text: 'périmètre\nécrit =\nprix ferme', at: [10, 150, -4], arrow: [62, 252, 132, 300, .28] },
        { t: [9.15, 11.1], text: 'une version à tester\nà chaque jalon', at: [690, 118, -3], arrow: [702, 112, 694, 68, .3] },
        { t: [13.05, 15.45], text: 'en ligne,\nsous vos comptes', at: [712, 104, -3], arrow: [708, 114, 640, 76, -.2] }
      ]
    },
    tall: {
      W: 360,
      dev: { cx: 180, cy: 330, cyIntro: 430, w: 172 },
      fanL: [156, 440, -8, .92], fanR: [204, 440, 8, .92],
      outL: [80, 128, -4, .5], outR: [215, 128, 4, .5],
      rowL: [80, 130, -2, .5], rowR: [215, 132, 2, .5],
      exitL: [-90, 70, -16, .5], exitR: [460, 70, 16, .5],
      arrows: [[150, 254, 96, 238], [210, 254, 200, 240]],
      frame: [14, 26, 278, 600, 22],
      stamp: [42, 28, -12],
      keep: [[180, 596], [80, 217], [215, 219]],
      code: [8, 6], badge: [8, 224],
      fingerIn: [330, 720], fingerOut: [350, 740],
      pop: { z: 100, s: 1.7, y: -6 },
      notes: [
        { t: [1.35, 2.65], text: 'on teste au crayon,\navant le code', at: [96, 118, -3], arrow: [180, 172, 186, 244, .18] },
        { t: [5.3, 7.2], text: 'périmètre\nécrit =\nprix ferme', at: [18, 300, -4], arrow: null },
        { t: [9.15, 11.1], text: 'à tester\nà chaque\njalon', at: [14, 264, -3], arrow: null },
        { t: [13.05, 15.45], text: 'en ligne, sous vos comptes', at: [74, 34, -3], arrow: [180, 68, 182, 132, .15] }
      ]
    }
  };
  var PH = [0, 4.1, 7.2, 11.1], END = 16.1, SHOW = [4.05, 7.17, 10.98, END];
  var EO = 'cubic-bezier(.16, 1, .3, 1)', EIO = 'cubic-bezier(.65, 0, .35, 1)', EIN = 'cubic-bezier(.55, 0, .8, .25)';
  var POP = 'cubic-bezier(.34, 1.56, .64, 1)', DRAW = 'cubic-bezier(.45, .05, .25, 1)';

  var E = {
    pencil: qa('[data-mark="pencil"] path', hero), mint: q('[data-mark="mint"] path', hero),
    scene: q('[data-scene]'), screen: q('[data-screen]'), bezel: q('.device-bezel'), edges: qa('.device-edge'),
    back: q('.device-back'), buttons: q('.device-buttons'), glare: q('.device-glare'), glow: q('.device-glow'),
    shadow: q('.device-shadow'), island: q('[data-island]'), notif: q('[data-notif]'), light: q('[data-light]'),
    contourSvg: q('.device-contour'), contour: q('[data-contour]'), chips: qa('.chip'),
    intro: q('[data-intro]'), live: q('[data-live]'), sketch: q('[data-sketch]'), wire: q('[data-wire]'),
    scan: q('[data-scan]'), reals: qa('[data-real]'), flashes: qa('[data-flash]'),
    cardL: q('[data-card="carte"]'), cardR: q('[data-card="depenses"]'),
    ink: q('[data-ink]'), keeps: qa('[data-keep]'), stamp: q('[data-stamp]'),
    code: q('[data-code]'), lines: qa('[data-line]'), badge: q('[data-badge]'),
    strip: q('[data-strip]'), noteInk: q('[data-note-ink]'), notes: qa('[data-note]'),
    finger: q('[data-finger]'), ring: q('[data-ring]')
  };
  E.hls = E.lines.map(function (li) { return q('.hl', li); });

  var anims = [], seen = null, P = PRESETS.wide, u = 1;
  var T = 0, t0 = 0, playing = false, ended = false;

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

  // Un tracé fait de plusieurs sous-tracés les dessine tous en même temps :
  // on n'anime donc que jusqu'au plus long, mesuré une fois.
  var meter = null, spans = new WeakMap();
  function span(path) {
    if (spans.has(path)) return spans.get(path);
    if (!meter) {
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
      meter = document.createElementNS(SVGNS, 'path');
      svg.appendChild(meter); stage.appendChild(svg);
    }
    var parts = (path.getAttribute('d') || '').split(/(?=M)/), lens = [], total = 0;
    parts.forEach(function (d) { meter.setAttribute('d', d); var l = meter.getTotalLength(); lens.push(l); total += l; });
    var max = total ? Math.max.apply(null, lens) / total : 1;
    spans.set(path, max);
    return max;
  }
  function draw(list, at, dur, ease) {
    [].concat(list).forEach(function (p) {
      if (p) add(p, [{ strokeDashoffset: 1.04 }, { strokeDashoffset: 1 - span(p) }], at, dur, ease || DRAW);
    });
  }
  function wipe(el, at, dur, ease) {
    add(el, [{ clipPath: 'inset(-30% 100% -30% -8%)' }, { clipPath: 'inset(-30% -8% -30% -8%)' }], at, dur, ease || 'cubic-bezier(.4, 0, .3, 1)');
  }
  function drawCard(root, start, stagger, dur) {
    qa('[data-o]', root).forEach(function (el) {
      var at = start + (+el.getAttribute('data-o')) * stagger;
      if (el.tagName.toLowerCase() === 'g') draw(qa('path:not([fill])', el), at, dur);
      else wipe(el, at + dur * .15, dur * 1.15);
    });
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

  // Position (en unités) d'un point de l'écran croqué, pendant l'intro.
  function onScreen(sx, sy) {
    var w = P.dev.w, h = w * 2.0894, pad = w * .036, sw = w * .928, sh = sw * 2000 / 920;
    return [P.dev.cx - w / 2 + pad + sw * sx / 920, P.dev.cyIntro - h / 2 + pad + sh * sy / 2000];
  }

  function build() {
    anims.forEach(function (a) { a.cancel(); });
    anims = []; seen = new Map();
    var name = getComputedStyle(stage).getPropertyValue('--preset').trim();
    P = PRESETS[name] || PRESETS.wide;
    u = stage.clientWidth / P.W;
    var ink = layoutInk();
    var cardShadow = '0 ' + px(14) + ' ' + px(32) + ' rgba(1, 1, 13, .38)', noShadow = '0 0 0 rgba(1, 1, 13, 0)';

    /* — 1. Croquis — */
    add(E.scene, [{ opacity: 0, scale: .94 }, { opacity: 1, scale: 1 }], .05, .6, EO);
    [[E.cardL, P.fanL], [E.cardR, P.fanR]].forEach(function (c, i) {
      var f = c[1];
      add(c[0], [{ opacity: 0 }, { opacity: 1 }], .12 + i * .06, .45, EO);
      add(c[0], [{ transform: tf([f[0], f[1] + 26, f[2] * 1.6, f[3] * .97]) }, { transform: tf(f) }], .12 + i * .06, .7, EO);
    });
    draw(E.pencil, .35, .75, EIO);
    drawCard(E.sketch, .4, .075, .34);
    drawCard(E.cardL, .8, .09, .32);
    drawCard(E.cardR, 1.0, .09, .32);

    var tap1 = onScreen(380, 744), tap2 = onScreen(590, 744);
    function press(at, p, rot) {
      add(E.finger, [{ transform: tf([p[0], p[1], rot, 1]) }, { transform: tf([p[0], p[1], rot, .86]), offset: .45 }, { transform: tf([p[0], p[1], rot, 1]) }], at, .24, 'ease-in-out');
      add(E.ring, [{ opacity: 0, transform: tf([p[0], p[1], 0, .3]) }, { opacity: 1, transform: tf([p[0], p[1], 0, .9]), offset: .25 }, { opacity: 0, transform: tf([p[0], p[1], 0, 1.7]) }], at + .04, .5, 'ease-out');
    }
    add(E.finger, [{ opacity: 0 }, { opacity: 1 }], 2.2, .25, EO);
    add(E.finger, [{ transform: tf([P.fingerIn[0], P.fingerIn[1], -8, 1]) }, { transform: tf([tap1[0], tap1[1], -14, 1]) }], 2.2, .42, EO);
    press(2.62, tap1, -14);
    draw(qa('[data-k="tap-carte"] path', E.sketch), 2.66, .3, EIO);
    add(E.cardL, [{ transform: tf(P.fanL) }, { transform: tf(P.outL) }], 2.74, .55, EO);
    draw(qa('[data-k="route"] path', E.cardL), 2.98, .62, DRAW);
    qa('[data-k^="pin"]', E.cardL).forEach(function (g, i) { add(g, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 3.08 + i * .08, .3, POP); });
    add(E.finger, [{ transform: tf([tap1[0], tap1[1], -14, 1]) }, { transform: tf([tap2[0], tap2[1], -12, 1]) }], 3.16, .28, EIO);
    press(3.46, tap2, -12);
    draw(qa('[data-k="tap-depenses"] path', E.sketch), 3.5, .3, EIO);
    add(E.cardR, [{ transform: tf(P.fanR) }, { transform: tf(P.outR) }], 3.58, .55, EO);
    draw(qa('[data-k="circle25"] path', E.cardR), 3.76, .34, EIO);
    add(E.finger, [{ transform: tf([tap2[0], tap2[1], -12, 1]) }, { transform: tf([P.fingerOut[0], P.fingerOut[1], -6, 1]) }], 3.84, .42, EIN);
    add(E.finger, [{ opacity: 1 }, { opacity: 0 }], 4.02, .22);

    /* — 2. Cadrage — */
    add(E.cardL, [{ transform: tf(P.outL) }, { transform: tf(P.rowL) }], 4.1, .65, EO);
    add(E.cardR, [{ transform: tf(P.outR) }, { transform: tf(P.rowR) }], 4.16, .65, EO);
    ink.arrows.forEach(function (a, i) { draw(a[0], 4.66 + i * .16, .38, DRAW); draw(a[1], 4.98 + i * .16, .16, 'ease-out'); });
    draw(ink.frame, 5.02, .85, EIO);
    var st = P.stamp;
    add(E.stamp, [{ opacity: 0, transform: tf([st[0], st[1], st[2] - 8, 2.3]) }, { opacity: 1, transform: tf([st[0], st[1], st[2], .94]), offset: .75 }, { opacity: 1, transform: tf([st[0], st[1], st[2], 1]) }], 5.74, .3, 'cubic-bezier(.5, 0, .3, 1)');
    [E.cardL, E.cardR].forEach(function (c) { add(c, [{ rotate: '0deg' }, { rotate: '-1deg', offset: .3 }, { rotate: '.6deg', offset: .65 }, { rotate: '0deg' }], 5.92, .32, 'ease-out'); });
    // Ce que garde la V1 : une étiquette par écran retenu, dans l'ordre du parcours.
    P.keep.forEach(function (k, i) {
      var el = E.keeps[i], at = 6.0 + i * .22;
      add(el, [{ opacity: 0, transform: tf([k[0], k[1] + 6, 0, .4]) }, { opacity: 1, transform: tf([k[0], k[1], 0, 1]) }], at, .45, POP);
      draw(qa('path', el), at + .18, .28, EIO);
    });
    add(ink.frame, [{ strokeWidth: 3 }, { strokeWidth: 6, offset: .45 }, { strokeWidth: 3 }], 6.8, .55, 'ease-in-out');

    /* — 3. Développement — */
    [E.stamp, E.ink].concat(E.keeps).forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 7.2, .4, EO); });
    add(E.cardL, [{ transform: tf(P.rowL) }, { transform: tf(P.exitL) }], 7.2, .65, EIN);
    add(E.cardR, [{ transform: tf(P.rowR) }, { transform: tf(P.exitR) }], 7.24, .65, EIN);
    add(E.cardL, [{ opacity: 1 }, { opacity: 0 }], 7.45, .4);
    add(E.cardR, [{ opacity: 1 }, { opacity: 0 }], 7.5, .4);
    add(E.screen, [{ boxShadow: cardShadow }, { boxShadow: noShadow }], 7.4, .5, EO);
    add(E.scan, [{ opacity: 0 }, { opacity: 1 }], 7.56, .06);
    add(E.scan, [{ top: '-6%' }, { top: '94%' }], 7.6, .85, EIO);
    add(E.scan, [{ opacity: 1 }, { opacity: 0 }], 8.45, .2);
    add(E.sketch, [{ clipPath: 'inset(0% 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], 7.6, .85, EIO);
    add(E.wire, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], 7.6, .85, EIO);
    var cx0 = P.code[0], cy0 = P.code[1];
    add(E.code, [{ opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }, { opacity: 1, transform: tf([cx0, cy0, 0, 1]) }], 7.7, .55, EO);
    var lineT = [8.25, 8.35, 8.45, 8.6, 9.2, 9.8, 10.4, 10.75, 10.82, 10.89];
    E.lines.forEach(function (li, i) {
      add(li, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], lineT[i], i >= 3 && i <= 6 ? .24 : .1, 'steps(16, end)');
    });
    var R = [[0, 66], [34, 59.6], [40.4, 28.4], [71.6, 0]];
    [3, 4, 5, 6].forEach(function (li, k) {
      var t = lineT[li];
      add(E.hls[li], [{ opacity: 0 }, { opacity: 1 }], t + .2, .12);
      add(E.hls[li], [{ opacity: 1 }, { opacity: 0 }], k < 3 ? lineT[li + 1] + .2 : 10.95, .2);
      add(E.reals[k], [{ clipPath: 'inset(' + R[k][0] + '% 100% ' + R[k][1] + '% 0%)' }, { clipPath: 'inset(' + R[k][0] + '% 0% ' + R[k][1] + '% 0%)' }], t + .26, .45, EIO);
      add(E.flashes[k], [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], t + .26, .75, 'ease-out');
    });
    var b = P.badge;
    add(E.badge, [{ opacity: 0, transform: tf([b[0], b[1] + 8, 0, 1]) }, { opacity: 1, transform: tf([b[0], b[1], 0, 1]) }], 9.0, .45, EO);
    add(E.strip, [{ transform: 'translateY(0em)' }, { transform: 'translateY(-1.2em)' }], 10.15, .35, POP);
    add(E.strip, [{ transform: 'translateY(-1.2em)' }, { transform: 'translateY(-2.4em)' }], 10.85, .35, POP);

    /* — 4. Stores — */
    add(E.code, [{ opacity: 1, transform: tf([cx0, cy0, 0, 1]) }, { opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }], 11.1, .4, EIN);
    add(E.badge, [{ opacity: 1 }, { opacity: 0 }], 11.1, .35);
    add(E.contourSvg, [{ opacity: 0 }, { opacity: 1 }], 11.18, .05);
    draw(E.contour, 11.2, .75, EIO);
    add(E.contourSvg, [{ opacity: 1 }, { opacity: 0 }], 12.1, .45);
    add(E.bezel, [{ opacity: 0 }, { opacity: 1 }], 11.7, .45, EO);
    E.edges.forEach(function (el, i) { add(el, [{ opacity: 0 }, { opacity: 1 }], 11.8 + i * .035, .15); });
    add(E.back, [{ opacity: 0 }, { opacity: 1 }], 12.0, .2);
    add(E.buttons, [{ opacity: 0 }, { opacity: 1 }], 12.0, .2);
    add(E.island, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], 11.95, .45, POP);
    add(E.glare, [{ opacity: 0 }, { opacity: 1 }], 12.05, .5);
    add(E.glow, [{ scale: 0 }, { scale: 1 }], 12.0, .8, EO);
    add(E.shadow, [{ opacity: 0 }, { opacity: 1 }], 12.0, .6);
    var dy = P.dev.cyIntro - P.dev.cy;
    if (dy) add(E.scene, [{ transform: 'translateY(' + px(dy) + ')' }, { transform: 'translateY(0px)' }], 11.85, .9, EO);
    add(E.light, [{ transform: 'translateX(-130%)' }, { transform: 'translateX(130%)' }], 12.15, .6, 'ease-in-out');
    var pop = P.pop, inScreen = 'translateY(0%) translateZ(2px) scale(1)';
    var out = 'translateY(' + pop.y + '%) translateZ(' + px(pop.z) + ') scale(' + pop.s + ')';
    add(E.notif, [{ opacity: 0, transform: 'translateY(-45%) translateZ(2px) scale(.94)' }, { opacity: 1, transform: inScreen }], 12.35, .5, 'cubic-bezier(.2, 1.25, .4, 1)');
    add(E.notif, [{ transform: inScreen, boxShadow: '0 ' + px(4) + ' ' + px(10) + ' rgba(1, 1, 13, .22)' }, { transform: out, boxShadow: '0 ' + px(26) + ' ' + px(48) + ' rgba(1, 1, 13, .45)' }], 12.95, .75, 'cubic-bezier(.22, 1.45, .4, 1)');
    draw(E.mint, 12.7, .6, EIO);
    // Les cartes flottantes n'arrivent qu'une fois la notification partie.
    E.chips.forEach(function (c, i) { add(c, [{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1 }], 15.35 + i * .15, .45, POP); });
    add(E.notif, [{ opacity: 1, transform: out }, { opacity: 0, transform: 'translateY(' + (pop.y - 60) + '%) translateZ(' + px(pop.z + 40) + ') scale(' + pop.s + ')' }], 15.4, .45, EIN);
    add(E.live, [{ opacity: 0 }, { opacity: 1 }], 15.75, .05);
    add(E.intro, [{ opacity: 1 }, { opacity: 0 }], 15.8, .15);

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

  /* ——— Lecture : pause, reprise, retour à une étape ——— */
  function seek(t) {
    T = Math.max(0, Math.min(END, t));
    anims.forEach(function (a) { a.pause(); a.currentTime = T * 1000; });
  }
  function play() {
    if (reduce || playing) return;
    t0 = document.timeline.currentTime - T * 1000;
    anims.forEach(function (a) { a.startTime = t0; });
    playing = true;
  }
  function pause() {
    if (!playing) return;
    playing = false;
    seek((document.timeline.currentTime - t0) / 1000);
  }
  function replay(from) {
    live.reset();
    ended = false;
    playing = false;
    seek(from || 0);
    play();
    loop();
  }
  function onEnd() {
    ended = true;
    setTimeout(function () { if (ended && visible) live.start(); }, 900);
  }
  stepBtns.forEach(function (btn, i) {
    btn.addEventListener('click', function () {
      if (reduce) { live.reset(); seek(SHOW[i]); updateRail(true); }
      else replay(PH[i]);
    });
  });
  replayBtn.addEventListener('click', function () { replay(0); });
  if (reduce) replayBtn.hidden = true;

  var lastIdx = -1;
  function updateRail(force) {
    var idx = 0;
    PH.forEach(function (p, i) { if (T >= p - 1e-6) idx = i; });
    railFill.style.setProperty('--p', Math.min(1, T / END).toFixed(4));
    if (idx === lastIdx && !force) return;
    lastIdx = idx;
    stepBtns.forEach(function (btn, i) {
      btn.classList.toggle('is-done', i < idx);
      btn.classList.toggle('is-active', i === idx);
      if (i === idx) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
  }

  /* ——— Le téléphone : à plat pendant l'intro, puis il flotte, suit le
     pointeur (ou l'inclinaison) et bascule au défilement ——— */
  var px_ = 0, py_ = 0, tx = 0, ty = 0, scrollF = 0, clock0 = performance.now();
  var visible = true, looping = false;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 30));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });
  function onScroll() {
    var r = stage.getBoundingClientRect();
    scrollF = Math.max(0, Math.min(1, 1 - (r.bottom / (window.innerHeight + r.height * 0.2))));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function blend(t) {
    var s = (t - 11.85) / 1.0;
    if (s <= 0) return 0;
    if (s >= 1) return 1;
    var c1 = 1.3, c3 = c1 + 1;
    return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2);
  }
  function frame(now) {
    if (!visible) { looping = false; return; }
    if (playing) {
      T = (document.timeline.currentTime - t0) / 1000;
      if (T >= END) { T = END; playing = false; onEnd(); }
    }
    updateRail();
    var k = blend(T), t = (now - clock0) / 1000, idle = reduce ? 0 : 1;
    px_ += (tx - px_) * 0.06; py_ += (ty - py_) * 0.06;
    var ry = k * (-20 + idle * (Math.sin(t * 0.45) * 16 + px_ * 18 + scrollF * 50));
    var rx = k * (7 + idle * (Math.sin(t * 0.7) * 3 - py_ * 10 + scrollF * 18));
    var rz = k * (2 + idle * Math.sin(t * 0.4) * 1.5);
    var fy = k * idle * (Math.sin(t * 0.9) * 9 - scrollF * 40);
    device.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    device.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    device.style.setProperty('--rz', rz.toFixed(2) + 'deg');
    device.style.setProperty('--fy', fy.toFixed(1) + 'px');
    device.style.setProperty('--gx', (50 + ry * 1.6).toFixed(1) + '%');
    E.shadow.style.setProperty('--ss', (1 - (fy + 9) / 60).toFixed(3));
    requestAnimationFrame(frame);
  }
  function loop() { if (!looping && visible) { looping = true; requestAnimationFrame(frame); } }

  // Hors écran : pause. Au retour en haut de page après la fin : on rejoue.
  var away = false, wasPlaying = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0], vis = e.isIntersecting && e.intersectionRatio > 0.2;
      if (!e.isIntersecting) away = true;
      if (vis === visible) return;
      visible = vis;
      if (!vis) { wasPlaying = playing; pause(); live.stop(); return; }
      if (ended && away && window.scrollY < 80 && !reduce) replay(0);
      else if (wasPlaying) play();
      else if (ended) live.start();
      away = false;
      loop();
    }, { threshold: [0, 0.2, 0.5] }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { wasPlaying = playing || wasPlaying; pause(); }
    else if (visible && wasPlaying) { wasPlaying = false; play(); }
  });

  var resizeTimer = null, lastW = stage.clientWidth;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (stage.clientWidth === lastW) return;
      lastW = stage.clientWidth;
      var was = playing, keep = playing ? (document.timeline.currentTime - t0) / 1000 : T;
      playing = false;
      build(); seek(keep); if (was) play();
      live.layout();
    }, 200);
  });

  function start() {
    if (start.done) return;
    start.done = true;
    build();
    live.reset();
    stage.classList.add('is-ready');
    if (reduce) { seek(END); ended = true; }
    else { seek(0); play(); }
    loop();
  }
  // On attend les polices (l'écriture manuscrite), une seconde au plus.
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1000); })]).then(start);
    document.fonts.ready.then(function () { live.layout(); });
  } else start();

  // Point d'accès pour vérifier une image précise du scénario.
  window.__hero = { seek: function (t) { playing = false; seek(t); updateRail(true); }, play: play, END: END };
})();
