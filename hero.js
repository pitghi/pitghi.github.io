/* Hero de l'accueil : « Votre app, du croquis aux stores, sans détour ».
   Un scénario d'environ 21 s en quatre temps, suivis par la frise sous la scène :
   1. Cadrage : un atelier aux post-it. Pour qui, comment, quel modèle ; puis
      les idées de fonctionnalités se trient entre « Dans le MVP » (mis en
      avant : cadre menthe, tampon, coches) et « Plus tard » (en retrait).
   2. Design : les post-it du MVP entrent dans l'écran et deviennent un fil de
      fer ; trois pistes visuelles du même écran apparaissent, on en garde une.
   3. Développement : chaque ligne de code change un bloc en vrai composant,
      à l'image de la maquette retenue.
   4. Mise en ligne : le téléphone se construit autour de l'écran, la
      notification App Store sort de l'écran, puis l'app vit.
   Tout repose sur l'API Web Animations : le scénario se met en pause hors
   écran, la frise permet de revenir à une étape, « Revoir » le relance. Si
   le visiteur a demandé à réduire les animations, on montre l'état final,
   et la frise affiche chaque étape en image fixe. */
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
      // Atelier de cadrage : intitulés [x, y] et post-it [x, y, rotation, échelle].
      labels: { qui: [130, 38], comment: [130, 168], modele: [130, 298], idees: [650, 36], mvp: [506, 34], tard: [842, 34] },
      ctx: { qui: [130, 96, -2, 1], comment: [130, 226, 2, 1], modele: [130, 356, -1, 1] },
      ideas: { etapes: [420, 128, -5, 1], carte: [612, 104, 4, 1], depenses: [806, 146, -3, 1], checklist: [470, 300, 5, 1], chat: [684, 318, -6, 1], hotels: [880, 296, 4, 1] },
      sorted: { etapes: [425, 130, -1.5, 1], carte: [595, 130, 1.5, 1], depenses: [425, 264, 1, 1], checklist: [595, 264, -1, 1], chat: [842, 128, 3, .8], hotels: [842, 236, -4, .8] },
      arrows: [],
      frame: [320, 58, 372, 280, 22],
      stamp: [692, 58, -12],
      code: [40, 80], badge: [614, 30],
      pistes: [[681, 205, 0, .55], [797, 205, 0, .55], [913, 205, 0, .55]], plabels: [[681, 336], [797, 336], [913, 336]],
      retenue: [913, 94], ref: [905, 262, 0, .48], retenueRef: [905, 165], reflabel: [905, 374],
      pop: { z: 110, s: 1.4, y: -5 },
      // [apparition, disparition], texte, [x, y, rotation], flèche [x0, y0, x1, y1, courbure]
      notes: [
        { t: [4.4, 5.25], text: 'périmètre écrit = prix ferme', at: [330, 360, -2], arrow: null },
        { t: [7.2, 8.65], text: 'plusieurs pistes visuelles,\non en garde une', at: [630, 34, -3], arrow: null },
        { t: [10.3, 12.25], text: 'une version à tester\nà chaque jalon', at: [690, 118, -3], arrow: [702, 112, 694, 68, .3] },
        { t: [14.2, 16.6], text: 'en ligne,\nsous vos comptes', at: [712, 104, -3], arrow: [708, 114, 640, 76, -.2] }
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
      stamp: [322, 186, -12],
      code: [8, 6], badge: [8, 224],
      pistes: [[110, 110, 0, .38], [180, 110, 0, .38], [250, 110, 0, .38]], plabels: [[110, 192], [180, 192], [250, 192]],
      retenue: [250, 44], ref: null,
      pop: { z: 100, s: 1.7, y: -6 },
      notes: [
        { t: [4.4, 5.25], text: 'périmètre écrit = prix ferme', at: [44, 540, -2], arrow: null },
        { t: [7.2, 8.65], text: 'plusieurs pistes, on en garde une', at: [44, 212, -3], arrow: null },
        { t: [10.3, 12.25], text: 'à tester\nà chaque\njalon', at: [14, 264, -3], arrow: null },
        { t: [14.2, 16.6], text: 'en ligne, sous vos comptes', at: [74, 34, -3], arrow: [180, 68, 182, 132, .15] }
      ]
    }
  };
  // Les temps du scénario sont écrits en secondes « de travail », puis tout
  // est ralenti d'un même facteur pour laisser le temps de lire.
  var SLOW = 1.2;
  function slow(t) { return t * SLOW; }
  var PH = [0, 5.2, 8.85, 12.25].map(slow), END = slow(17.25), SHOW = [5.1, 8.6, 12.15, 17.25].map(slow);
  var EO = 'cubic-bezier(.16, 1, .3, 1)', EIO = 'cubic-bezier(.65, 0, .35, 1)', EIN = 'cubic-bezier(.55, 0, .8, .25)';
  var POP = 'cubic-bezier(.34, 1.56, .64, 1)', DRAW = 'cubic-bezier(.45, .05, .25, 1)';

  function byKey(sel, attr) { var o = {}; qa(sel).forEach(function (el) { o[el.getAttribute(attr)] = el; }); return o; }
  var E = {
    pencil: qa('[data-mark="pencil"] path', hero), mint: q('[data-mark="mint"] path', hero),
    scene: q('[data-scene]'), screen: q('[data-screen]'), bezel: q('.device-bezel'), edges: qa('.device-edge'),
    back: q('.device-back'), buttons: q('.device-buttons'), glare: q('.device-glare'), glow: q('.device-glow'),
    shadow: q('.device-shadow'), island: q('[data-island]'), notif: q('[data-notif]'), light: q('[data-light]'),
    contourSvg: q('.device-contour'), contour: q('[data-contour]'), chips: qa('.chip'),
    intro: q('[data-intro]'), live: q('[data-live]'), wire: q('[data-wire]'),
    scan: q('[data-scan]'), reals: qa('[data-real]'), flashes: qa('[data-flash]'),
    ink: q('[data-ink]'), stamp: q('[data-stamp]'),
    pi: byKey('[data-pi]', 'data-pi'), picheck: byKey('[data-picheck]', 'data-picheck'), blabels: byKey('[data-blabel]', 'data-blabel'),
    code: q('[data-code]'), lines: qa('[data-line]'), badge: q('[data-badge]'),
    strip: q('[data-strip]'), noteInk: q('[data-note-ink]'), notes: qa('[data-note]'),
    pistes: qa('[data-piste]'), plabels: qa('[data-plabel]'), retenue: q('[data-retenue]'), reflabel: q('[data-reflabel]')
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
    var a = el.animate(kf, { duration: Math.max(1, dur * 1000 * SLOW), delay: at * 1000 * SLOW, easing: ease || EO, fill: fresh ? 'both' : 'forwards' });
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

  function build() {
    anims.forEach(function (a) { a.cancel(); });
    anims = []; seen = new Map();
    var name = getComputedStyle(stage).getPropertyValue('--preset').trim();
    P = PRESETS[name] || PRESETS.wide;
    u = stage.clientWidth / P.W;
    var ink = layoutInk();
    var cardShadow = '0 ' + px(14) + ' ' + px(32) + ' rgba(1, 1, 13, .38)', noShadow = '0 0 0 rgba(1, 1, 13, 0)';

    /* — 1. Cadrage : l'atelier aux post-it — */
    draw(E.pencil, .35, .75, EIO);
    function slap(el, p, at) {
      add(el, [{ opacity: 0, transform: tf([p[0], p[1] - 8, p[2] + (p[2] >= 0 ? 9 : -9), 1.25]) }, { opacity: 1, transform: tf(p) }], at, .42, POP);
    }
    function showLabel(k, at) {
      var l = P.labels[k];
      add(E.blabels[k], [{ opacity: 0, transform: tf([l[0], l[1] + 6, 0, 1]) }, { opacity: 1, transform: tf([l[0], l[1], 0, 1]) }], at, .4, EO);
    }
    // Le cadre fonctionnel : pour qui, comment, quel modèle.
    ['qui', 'comment', 'modele'].forEach(function (k, i) { showLabel(k, .2 + i * .2); slap(E.pi[k], P.ctx[k], .35 + i * .2); });
    // Les idées de fonctionnalités, collées en vrac…
    var IDEAS = ['etapes', 'carte', 'depenses', 'checklist', 'chat', 'hotels'], MVP = IDEAS.slice(0, 4), LATER = IDEAS.slice(4);
    showLabel('idees', .9);
    IDEAS.forEach(function (k, i) { slap(E.pi[k], P.ideas[k], 1.0 + i * .18); });
    // …puis triées : le MVP d'un côté, mis en avant ; le reste « plus tard », en retrait.
    add(E.blabels.idees, [{ opacity: 1 }, { opacity: 0 }], 2.45, .25);
    showLabel('mvp', 2.55); showLabel('tard', 2.65);
    IDEAS.forEach(function (k, i) { add(E.pi[k], [{ transform: tf(P.ideas[k]) }, { transform: tf(P.sorted[k]) }], 2.6 + i * .08, .6, EIO); });
    LATER.forEach(function (k, i) {
      add(E.pi[k], [{ backgroundColor: '#FFE27A', color: '#2E2B45' }, { backgroundColor: '#CFCBE0', color: '#6B6785' }], 3.0 + i * .08, .5);
      add(E.pi[k], [{ opacity: 1 }, { opacity: .85 }], 3.0 + i * .08, .5);
    });
    draw(ink.frame, 3.4, .8, EIO);
    var st = P.stamp;
    add(E.stamp, [{ opacity: 0, transform: tf([st[0], st[1], st[2] - 8, 2.3]) }, { opacity: 1, transform: tf([st[0], st[1], st[2], .94]), offset: .75 }, { opacity: 1, transform: tf([st[0], st[1], st[2], 1]) }], 4.1, .3, 'cubic-bezier(.5, 0, .3, 1)');
    MVP.forEach(function (k, i) {
      var c = E.picheck[k], at = 4.3 + i * .15;
      add(c, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], at, .4, POP);
      draw(qa('path', c), at + .15, .25, EIO);
    });
    add(ink.frame, [{ strokeWidth: 3 }, { strokeWidth: 6, offset: .45 }, { strokeWidth: 3 }], 4.95, .55, 'ease-in-out');

    /* — 2. Design : les post-it du MVP deviennent un fil de fer, puis trois pistes — */
    ['qui', 'comment', 'modele'].forEach(function (k, i) {
      var p = P.ctx[k];
      add(E.pi[k], [{ opacity: 1, transform: tf(p) }, { opacity: 0, transform: tf([p[0] - 50, p[1], p[2] - 6, p[3] * .9]) }], 5.2 + i * .05, .45, EIN);
    });
    LATER.forEach(function (k, i) {
      var p = P.sorted[k];
      add(E.pi[k], [{ opacity: .85, transform: tf(p) }, { opacity: 0, transform: tf([p[0] + 50, p[1], p[2] + 6, p[3] * .9]) }], 5.2 + i * .05, .45, EIN);
    });
    ['qui', 'comment', 'modele', 'mvp', 'tard'].forEach(function (k) { add(E.blabels[k], [{ opacity: 1 }, { opacity: 0 }], 5.2, .3); });
    [E.stamp, E.ink].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 5.2, .35, EO); });
    // Les post-it du MVP entrent dans l'écran…
    var cx = P.dev.cx, cy = P.dev.cyIntro;
    MVP.forEach(function (k, i) {
      var p = P.sorted[k];
      add(E.pi[k], [{ opacity: 1, transform: tf(p) }, { opacity: 1, transform: tf([(p[0] + cx) / 2, (p[1] + cy) / 2, 0, .7]), offset: .55 }, { opacity: 0, transform: tf([cx, cy, 0, .25]) }], 5.3 + i * .08, .65, EIO);
    });
    add(E.scene, [{ opacity: 0, scale: .9 }, { opacity: 1, scale: 1 }], 5.45, .5, EO);
    add(E.screen, [{ boxShadow: cardShadow }, { boxShadow: noShadow }], 8.85, .5, EO);
    // …et deviennent un fil de fer, révélé par le balayage menthe.
    add(E.scan, [{ opacity: 0 }, { opacity: 1 }], 5.76, .06);
    add(E.scan, [{ top: '-6%' }, { top: '94%' }], 5.8, .85, EIO);
    add(E.scan, [{ opacity: 1 }, { opacity: 0 }], 6.65, .2);
    add(E.wire, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], 5.8, .85, EIO);
    // Trois pistes du même écran. On garde la troisième (le vrai style de Maurice),
    // les deux autres s'effacent sans être barrées.
    var pisteShadow = '0 ' + px(13) + ' ' + px(33) + ' rgba(1, 1, 13, .4)';
    P.pistes.forEach(function (p, i) {
      var t = 6.75 + i * .15, l = P.plabels[i];
      add(E.pistes[i], [{ opacity: 0, transform: tf([p[0], p[1] + 14, p[2], p[3] * .85]) }, { opacity: 1, transform: tf(p) }], t, .5, EO);
      add(E.plabels[i], [{ opacity: 0, transform: tf([l[0], l[1] + 6, 0, 1]) }, { opacity: 1, transform: tf([l[0], l[1], 0, 1]) }], t + .2, .4, EO);
    });
    var kept = E.pistes[2], r = P.retenue;
    add(E.retenue, [{ opacity: 0, transform: tf([r[0], r[1] + 6, 0, .4]) }, { opacity: 1, transform: tf([r[0], r[1], 0, 1]) }], 7.9, .45, POP);
    draw(qa('path', E.retenue), 8.08, .28, EIO);
    add(kept, [{ boxShadow: pisteShadow }, { boxShadow: pisteShadow + ', 0 0 0 ' + px(3) + ' #88F9C0' }], 7.9, .35, EO);
    [0, 1].forEach(function (i) {
      var p = P.pistes[i];
      add(E.pistes[i], [{ opacity: 1, transform: tf(p) }, { opacity: 0, transform: tf([p[0], p[1] + 24, p[2], p[3] * .9]) }], 8.25 + i * .06, .45, EIN);
    });
    E.plabels.forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 8.2, .3); });
    if (P.ref) {
      // En large, la piste retenue reste à côté : c'est la maquette que le code reproduit.
      add(kept, [{ transform: tf(P.pistes[2]) }, { transform: tf(P.ref) }], 8.4, .6, EIO);
      add(E.retenue, [{ transform: tf([r[0], r[1], 0, 1]) }, { transform: tf([P.retenueRef[0], P.retenueRef[1], 0, 1]) }], 8.4, .6, EIO);
      add(E.reflabel, [{ opacity: 0, transform: tf([P.reflabel[0], P.reflabel[1], 0, 1]) }, { opacity: 1, transform: tf([P.reflabel[0], P.reflabel[1], 0, 1]) }], 8.9, .4);
      [kept, E.retenue, E.reflabel].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 12.15, .4); });
    } else {
      [kept, E.retenue].forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], 8.6, .35); });
    }

    /* — 3. Développement : le code reproduit la maquette retenue — */
    var cx0 = P.code[0], cy0 = P.code[1];
    add(E.code, [{ opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }, { opacity: 1, transform: tf([cx0, cy0, 0, 1]) }], 8.85, .55, EO);
    var lineT = [9.4, 9.5, 9.6, 9.75, 10.35, 10.95, 11.55, 11.9, 11.97, 12.04];
    E.lines.forEach(function (li, i) {
      add(li, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], lineT[i], i >= 3 && i <= 6 ? .24 : .1, 'steps(16, end)');
    });
    var R = [[0, 66], [34, 59.6], [40.4, 28.4], [71.6, 0]];
    [3, 4, 5, 6].forEach(function (li, k) {
      var t = lineT[li];
      add(E.hls[li], [{ opacity: 0 }, { opacity: 1 }], t + .2, .12);
      add(E.hls[li], [{ opacity: 1 }, { opacity: 0 }], k < 3 ? lineT[li + 1] + .2 : 12.1, .2);
      add(E.reals[k], [{ clipPath: 'inset(' + R[k][0] + '% 100% ' + R[k][1] + '% 0%)' }, { clipPath: 'inset(' + R[k][0] + '% 0% ' + R[k][1] + '% 0%)' }], t + .26, .45, EIO);
      add(E.flashes[k], [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], t + .26, .75, 'ease-out');
    });
    var b = P.badge;
    add(E.badge, [{ opacity: 0, transform: tf([b[0], b[1] + 8, 0, 1]) }, { opacity: 1, transform: tf([b[0], b[1], 0, 1]) }], 10.15, .45, EO);
    add(E.strip, [{ transform: 'translateY(0em)' }, { transform: 'translateY(-1.2em)' }], 11.3, .35, POP);
    add(E.strip, [{ transform: 'translateY(-1.2em)' }, { transform: 'translateY(-2.4em)' }], 12.0, .35, POP);

    /* — 4. Mise en ligne — */
    add(E.code, [{ opacity: 1, transform: tf([cx0, cy0, 0, 1]) }, { opacity: 0, transform: tf([cx0 - 30, cy0, 0, 1]) }], 12.25, .4, EIN);
    add(E.badge, [{ opacity: 1 }, { opacity: 0 }], 12.25, .35);
    add(E.contourSvg, [{ opacity: 0 }, { opacity: 1 }], 12.33, .05);
    draw(E.contour, 12.35, .75, EIO);
    add(E.contourSvg, [{ opacity: 1 }, { opacity: 0 }], 13.25, .45);
    add(E.bezel, [{ opacity: 0 }, { opacity: 1 }], 12.85, .45, EO);
    E.edges.forEach(function (el, i) { add(el, [{ opacity: 0 }, { opacity: 1 }], 12.95 + i * .035, .15); });
    add(E.back, [{ opacity: 0 }, { opacity: 1 }], 13.15, .2);
    add(E.buttons, [{ opacity: 0 }, { opacity: 1 }], 13.15, .2);
    add(E.island, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], 13.1, .45, POP);
    add(E.glare, [{ opacity: 0 }, { opacity: 1 }], 13.2, .5);
    add(E.glow, [{ scale: 0 }, { scale: 1 }], 13.15, .8, EO);
    add(E.shadow, [{ opacity: 0 }, { opacity: 1 }], 13.15, .6);
    var dy = P.dev.cyIntro - P.dev.cy;
    if (dy) add(E.scene, [{ transform: 'translateY(' + px(dy) + ')' }, { transform: 'translateY(0px)' }], 13.0, .9, EO);
    add(E.light, [{ transform: 'translateX(-130%)' }, { transform: 'translateX(130%)' }], 13.3, .6, 'ease-in-out');
    var pop = P.pop, inScreen = 'translateY(0%) translateZ(2px) scale(1)';
    var out = 'translateY(' + pop.y + '%) translateZ(' + px(pop.z) + ') scale(' + pop.s + ')';
    add(E.notif, [{ opacity: 0, transform: 'translateY(-45%) translateZ(2px) scale(.94)' }, { opacity: 1, transform: inScreen }], 13.5, .5, 'cubic-bezier(.2, 1.25, .4, 1)');
    add(E.notif, [{ transform: inScreen, boxShadow: '0 ' + px(4) + ' ' + px(10) + ' rgba(1, 1, 13, .22)' }, { transform: out, boxShadow: '0 ' + px(26) + ' ' + px(48) + ' rgba(1, 1, 13, .45)' }], 14.1, .75, 'cubic-bezier(.22, 1.45, .4, 1)');
    draw(E.mint, 13.85, .6, EIO);
    // Les cartes flottantes n'arrivent qu'une fois la notification partie.
    E.chips.forEach(function (c, i) { add(c, [{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1 }], 16.5 + i * .15, .45, POP); });
    add(E.notif, [{ opacity: 1, transform: out }, { opacity: 0, transform: 'translateY(' + (pop.y - 60) + '%) translateZ(' + px(pop.z + 40) + ') scale(' + pop.s + ')' }], 16.55, .45, EIN);
    add(E.live, [{ opacity: 0 }, { opacity: 1 }], 16.9, .05);
    add(E.intro, [{ opacity: 1 }, { opacity: 0 }], 16.95, .15);

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
    rail.classList.remove('is-ended');
    ended = false;
    playing = false;
    seek(from || 0);
    play();
    loop();
  }
  function onEnd() {
    ended = true;
    // À la fin, la frise s'efface : il reste le téléphone et « Revoir ».
    if (!reduce) rail.classList.add('is-ended');
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
    var s = (t / SLOW - 13.0) / 1.0;
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

  // Hors écran : pause. Une fois l'intro finie, le téléphone reste : on ne rejoue
  // que si le visiteur le demande (bouton « Revoir »).
  var away = false, wasPlaying = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0], vis = e.isIntersecting && e.intersectionRatio > 0.2;
      if (!e.isIntersecting) away = true;
      if (vis === visible) return;
      visible = vis;
      if (!vis) { wasPlaying = playing; pause(); live.stop(); return; }
      if (wasPlaying) play();
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
