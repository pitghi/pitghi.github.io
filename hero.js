/* Hero de l'accueil, concept 3 « L'établi » : « Votre app, du croquis aux
   stores, sans détour », en un seul plan-séquence d'environ 16 s.
   La caméra glisse sur le bureau du studio, sans coupe :
   1. Croquis : dans le carnet, trois écrans de Maurice se dessinent ; un doigt
      tape « Carte » et l'itinéraire se trace. Les croquis s'envolent.
   2. Cadrage : au tableau, les écrans sont punaisés et reliés ; le trait menthe
      trace le périmètre de la V1 et chaque écran retenu reçoit son étiquette.
   3. Développement : le trait menthe file jusqu'à l'ordinateur ; le code
      s'écrit et chaque ligne allume un bloc du simulateur.
   4. Stores : le téléphone posé sur le bureau se soulève, le bureau sort du
      champ, la notification App Store sort de l'écran, puis l'app vit.
   Même mécanique que le concept 2 (Web Animations, pause hors écran, frise
   cliquable, image finale fixe si l'on réduit les animations). */
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

  /* ——— La mise en scène : un bureau vu de dessus, une caméra qui le parcourt ———
     Le monde est en unités de scène (1em = 1 unité, réglé ici). Les postes sont
     côte à côte en large (la caméra glisse vers la droite) et empilés en étroit
     (elle descend). Caméra = [instant, X, Y, zoom] : coin haut-gauche visé. */
  var PRESETS = {
    wide: {
      W: 1000,
      st: { carnet: [0, 0], tableau: [1250, 0], ordi: [2500, 0], tel: [3700, 0] },
      desk: [-400, -300, 4720, 1040],
      dev: { cx: 500, cy: 220, w: 200 },
      cam: [[0, 0, 0, 1], [.7, 0, 0, 1], [2.0, -105, 64, 1.45], [3.3, -105, 64, 1.45], [4.6, 1200, 0, 1], [6.9, 1200, 0, 1],
        [8.2, 2500, 0, 1], [9.4, 2520, 0, 1], [10.3, 2900, 30, 1.6], [10.7, 2900, 30, 1.6], [11.7, 3500, 0, 1], [12.3, 3500, 0, 1], [13.6, 4380, 0, 1]],
      mint: function (b, c) { return 'M' + (b[0] + 600) + ' ' + (b[1] + 230) + ' C' + (b[0] + 820) + ' ' + (b[1] + 400) + ' ' + (c[0] - 260) + ' ' + (c[1] + 20) + ' ' + (c[0] + 66) + ' ' + (c[1] + 172); },
      notes: [{ t: [13.6, 15.7], text: 'en ligne,\nsous vos comptes', at: [712, 104, -3], arrow: [708, 114, 640, 76, -.2] }],
      pop: { z: 110, s: 1.4, y: -5 }
    },
    tall: {
      W: 360,
      st: { carnet: [-30, 0], tableau: [-150, 560], ordi: [-240, 1120], tel: [-120, 1680] },
      desk: [-600, -900, 1700, 3100],
      dev: { cx: 180, cy: 330, w: 172 },
      cam: [[0, 10, -420, .5], [.7, 10, -420, .5], [2.0, 36, -56, 1.25], [3.3, 36, -56, 1.25], [4.6, -60, 358, .75], [6.9, -60, 358, .75],
        [8.2, -150, 892, .8], [9.4, -150, 902, .8], [10.3, 386, 997, 1.1], [10.7, 386, 997, 1.1], [11.7, 0, 1580, 1], [12.3, 0, 1580, 1], [13.6, 0, 2260, 1]],
      mint: function (b, c) { return 'M' + (b[0] + 600) + ' ' + (b[1] + 230) + ' C' + (b[0] + 760) + ' ' + (b[1] + 420) + ' ' + (c[0] + 180) + ' ' + (c[1] - 220) + ' ' + (c[0] + 315) + ' ' + (c[1] + 40); },
      notes: [{ t: [13.6, 15.7], text: 'en ligne, sous vos comptes', at: [74, 34, -3], arrow: [180, 68, 182, 132, .15] }],
      pop: { z: 100, s: 1.7, y: -6 }
    }
  };
  var PH = [0, 4.5, 7.4, 10.6], END = 16.4, SHOW = [3.2, 6.95, 10.45, END];
  var EO = 'cubic-bezier(.16, 1, .3, 1)', EIO = 'cubic-bezier(.65, 0, .35, 1)', EIN = 'cubic-bezier(.55, 0, .8, .25)';
  var POP = 'cubic-bezier(.34, 1.56, .64, 1)', DRAW = 'cubic-bezier(.45, .05, .25, 1)';
  // Dans le carnet et sur le tableau (repère du poste) : centre de chaque fiche.
  var BOOK = { etapes: [125, 200], carte: [290, 200], depenses: [500, 200] };
  var BOARD = { etapes: [330, 225], carte: [150, 225], depenses: [510, 225] };
  var CARD = { w: 129, h: 280 }, PHONE = { x: 300, y: 220, w: 130 };

  var E = {
    pencil: qa('[data-mark="pencil"] path', hero), mint: q('[data-mark="mint"] path', hero),
    win: q('[data-window]'), world: q('[data-world]'), desk: q('[data-desk]'), mintline: q('[data-mintline]'),
    st: { carnet: q('[data-st="carnet"]'), tableau: q('[data-st="tableau"]'), over: q('[data-st="tableau-over"]'), ordi: q('[data-st="ordi"]'), tel: q('[data-st="tel"]') },
    cards: { etapes: q('[data-card="etapes"]'), carte: q('[data-card="carte"]'), depenses: q('[data-card="depenses"]') },
    finger: q('[data-finger]'), col: qa('[data-col]'), tapArrow: q('[data-taparrow]'),
    pins: qa('[data-pin]'), barrows: qa('[data-barrow]'), bframe: q('[data-bframe]'), narrow: q('[data-narrow]'),
    stamp: q('[data-stamp]'), jalons: qa('[data-jalon]'), keeps: { etapes: q('[data-keep="etapes"]'), carte: q('[data-keep="carte"]'), depenses: q('[data-keep="depenses"]') },
    code: q('[data-code]'), lines: qa('[data-line]'), reals: qa('[data-real]'), flashes: qa('[data-flash]'),
    badge: q('[data-badge]'), strip: q('[data-strip]'), darrow: q('[data-darrow]'), wphone: q('[data-wphone]'),
    scene: q('[data-scene]'), glow: q('.device-glow'), shadow: q('.device-shadow'), light: q('[data-light]'),
    notif: q('[data-notif]'), chips: qa('.chip'), noteInk: q('[data-note-ink]'), notes: qa('[data-note]')
  };
  E.hls = E.lines.map(function (li) { return q('.hl', li); });
  function wnote(name) { return q('[data-wnote="' + name + '"]'); }

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
  // Dans le monde, on parle en em (1em = 1 unité).
  function wtf(x, y, r, s) { return 'translate(' + x.toFixed(1) + 'em, ' + y.toFixed(1) + 'em) rotate(' + (r || 0) + 'deg) scale(' + (s == null ? 1 : s) + ')'; }
  function camTf(c) { return 'scale(' + c[3] + ') translate(' + (-c[1]).toFixed(1) + 'em, ' + (-c[2]).toFixed(1) + 'em)'; }

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
  // Une flèche crayonnée : la tige, puis la pointe.
  function drawArrow(g, at, dur) {
    if (!g) return;
    draw(qa('[data-shaft] path', g), at, dur, DRAW);
    draw(qa('[data-head] path', g), at + dur * .85, .14, 'ease-out');
  }

  function mk(svg, cls) { var p = document.createElementNS(SVGNS, 'path'); p.setAttribute('class', cls); p.setAttribute('pathLength', '1'); svg.appendChild(p); return p; }
  function f1(v) { return v.toFixed(1); }
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

  // Place le décor pour le format courant : postes, bureau, trait menthe.
  function layoutWorld() {
    E.world.style.fontSize = u + 'px';
    var d = P.desk;
    E.desk.style.cssText = 'left:' + d[0] + 'em;top:' + d[1] + 'em;width:' + d[2] + 'em;height:' + d[3] + 'em';
    Object.keys(P.st).forEach(function (k) { E.st[k].style.transform = 'translate(' + P.st[k][0] + 'em, ' + P.st[k][1] + 'em)'; });
    E.st.over.style.transform = E.st.tableau.style.transform;
    E.mintline.setAttribute('d', P.mint(P.st.tableau, P.st.ordi));
    spans.delete(E.mintline);
    // les notes de la fin, sur l'affiche indigo
    E.noteInk.setAttribute('viewBox', '0 0 ' + stage.clientWidth + ' ' + stage.clientHeight);
    while (E.noteInk.firstChild) E.noteInk.removeChild(E.noteInk.firstChild);
    return P.notes.map(function (n) { return n.arrow ? arrow(E.noteInk, '', n.arrow, n.arrow[4]) : null; });
  }
  function at(st, p) { return [P.st[st][0] + p[0], P.st[st][1] + p[1]]; }

  function build() {
    anims.forEach(function (a) { a.cancel(); });
    anims = []; seen = new Map();
    var name = getComputedStyle(stage).getPropertyValue('--preset').trim();
    P = PRESETS[name] || PRESETS.wide;
    u = stage.clientWidth / P.W;
    var noteArrows = layoutWorld();
    // Annotations du concept 2 qui n'ont pas lieu ici.
    qa('[data-k="tap-depenses"], [data-k="circle25"]').forEach(function (el) { el.style.display = 'none'; });

    /* — La caméra : un seul plan-séquence — */
    var last = P.cam[P.cam.length - 1][0];
    add(E.world, P.cam.map(function (c, i) {
      var next = P.cam[i + 1], ease = 'linear';
      if (next) ease = next[3] !== c[3] && Math.abs(next[1] - c[1]) < 600 && Math.abs(next[2] - c[2]) < 600 ? 'cubic-bezier(.45, 0, .2, 1)' : EIO;
      return { transform: camTf(c), offset: c[0] / last, easing: ease };
    }), 0, last, 'linear');
    add(E.win, [{ opacity: 1 }, { opacity: 0 }], 13.5, .3);

    /* — 1. Croquis : le carnet — */
    draw(E.pencil, .35, .75, EIO);
    drawCard(E.cards.etapes, .3, .07, .34);
    drawCard(E.cards.carte, .6, .08, .32);
    drawCard(E.cards.depenses, .9, .08, .32);
    E.col.forEach(function (el, i) { wipe(el, 1.1 + i * .16, .4); });
    var tapLocal = [BOOK.etapes[0] - CARD.w / 2 + CARD.w * 380 / 920, BOOK.etapes[1] - CARD.h / 2 + CARD.h * 744 / 2000];
    var tap = at('carnet', tapLocal), fin = at('carnet', [330, 430]), fout = at('carnet', [380, 480]);
    add(E.finger, [{ opacity: 0 }, { opacity: 1 }], 2.0, .25);
    add(E.finger, [{ transform: wtf(fin[0], fin[1], -8) }, { transform: wtf(tap[0], tap[1], -14) }], 2.0, .42, EO);
    add(E.finger, [{ transform: wtf(tap[0], tap[1], -14, 1) }, { transform: wtf(tap[0], tap[1], -14, .86), offset: .45 }, { transform: wtf(tap[0], tap[1], -14, 1) }], 2.45, .24, 'ease-in-out');
    draw(qa('[data-k="tap-carte"] path', E.cards.etapes), 2.5, .3, EIO);
    drawArrow(E.tapArrow, 2.62, .3);
    draw(qa('[data-k="route"] path', E.cards.carte), 2.78, .6, DRAW);
    qa('[data-k^="pin"]', E.cards.carte).forEach(function (g, i) { add(g, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 2.9 + i * .08, .3, POP); });
    add(E.finger, [{ transform: wtf(tap[0], tap[1], -14) }, { transform: wtf(fout[0], fout[1], -6) }], 3.2, .4, EIN);
    add(E.finger, [{ opacity: 1 }, { opacity: 0 }], 3.4, .2);
    var nc = wnote('croquis');
    wipe(nc, 2.15, .55);
    add(nc, [{ opacity: 1 }, { opacity: 0 }], 3.3, .3);
    add(E.tapArrow, [{ opacity: 1 }, { opacity: 0 }], 3.35, .25);

    // Les croquis quittent le carnet et volent jusqu'au tableau.
    ['etapes', 'carte', 'depenses'].forEach(function (k, i) {
      var a = at('carnet', BOOK[k]), b = at('tableau', BOARD[k]), t = 3.45 + i * .07;
      var mid = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 70];
      add(E.cards[k], [
        { transform: wtf(a[0], a[1], 0, 1), boxShadow: '0 1.5em 4em rgba(46, 43, 69, .16)' },
        { transform: wtf(mid[0], mid[1], i === 1 ? -7 : 6, 1.12), boxShadow: '0 9em 18em rgba(46, 43, 69, .3)', offset: .5 },
        { transform: wtf(b[0], b[1], 0, 1), boxShadow: '0 1.5em 4em rgba(46, 43, 69, .16)' }
      ], t, 1.0, EIO);
    });

    /* — 2. Cadrage : le tableau — */
    E.pins.forEach(function (g, i) { add(g, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 4.48 + i * .06, .3, POP); });
    E.barrows.forEach(function (g, i) { drawArrow(g, 4.7 + i * .15, .32); });
    draw(E.bframe, 4.95, .8, EIO);
    add(E.stamp, [{ opacity: 0, transform: 'rotate(-20deg) scale(2.3)' }, { opacity: 1, transform: 'rotate(-12deg) scale(.94)', offset: .75 }, { opacity: 1, transform: 'rotate(-12deg) scale(1)' }], 5.7, .3, 'cubic-bezier(.5, 0, .3, 1)');
    ['etapes', 'carte', 'depenses'].forEach(function (k, i) {
      var el = E.keeps[k], t = 5.9 + i * .22;
      add(el, [{ opacity: 0, transform: 'translateY(30%) scale(.4)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], t, .45, POP);
      draw(qa('path', el), t + .18, .28, EIO);
    });
    E.jalons.forEach(function (el, i) { wipe(el, 5.05 + i * .25, .4); });
    wipe(wnote('cadrage'), 6.05, .45); wipe(wnote('cadrage2'), 6.25, .4);
    drawArrow(E.narrow, 6.5, .3);
    add(E.bframe, [{ strokeWidth: 4 }, { strokeWidth: 8, offset: .45 }, { strokeWidth: 4 }], 6.7, .55, 'ease-in-out');

    /* — 3. Développement : le trait menthe mène à l'ordinateur — */
    draw(E.mintline, 6.95, 1.25, EIO);
    var lineT = [8.2, 8.3, 8.4, 8.55, 9.1, 9.65, 10.2, 10.5, 10.57, 10.64];
    E.lines.forEach(function (li, i) {
      add(li, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], lineT[i], i >= 3 && i <= 6 ? .24 : .1, 'steps(16, end)');
    });
    var R = [[0, 66], [34, 59.6], [40.4, 28.4], [71.6, 0]];
    [3, 4, 5, 6].forEach(function (li, k) {
      var t = lineT[li];
      add(E.hls[li], [{ opacity: 0 }, { opacity: 1 }], t + .2, .12);
      add(E.hls[li], [{ opacity: 1 }, { opacity: 0 }], k < 3 ? lineT[li + 1] + .2 : 10.7, .2);
      add(E.reals[k], [{ clipPath: 'inset(' + R[k][0] + '% 100% ' + R[k][1] + '% 0%)' }, { clipPath: 'inset(' + R[k][0] + '% 0% ' + R[k][1] + '% 0%)' }], t + .26, .45, EIO);
      add(E.flashes[k], [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], t + .26, .75, 'ease-out');
    });
    add(E.badge, [{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'translateY(0)' }], 8.9, .45, EO);
    add(E.strip, [{ transform: 'translateY(0em)' }, { transform: 'translateY(-1.2em)' }], 9.75, .35, POP);
    add(E.strip, [{ transform: 'translateY(-1.2em)' }, { transform: 'translateY(-2.4em)' }], 10.35, .35, POP);
    wipe(wnote('dev'), 9.6, .45); wipe(wnote('dev2'), 9.8, .4);
    drawArrow(E.darrow, 10.0, .3);

    /* — 4. Stores : le téléphone quitte le bureau — */
    var camD = P.cam[11], ph = at('tel', [PHONE.x, PHONE.y]);
    var hx = (ph[0] - camD[1]) * camD[3] - P.dev.cx, hy = (ph[1] - camD[2]) * camD[3] - P.dev.cy, s0 = PHONE.w * camD[3] / P.dev.w;
    add(E.wphone, [{ opacity: 1 }, { opacity: 0 }], 11.75, .01);
    add(E.scene, [{ opacity: 0 }, { opacity: 1 }], 11.75, .01);
    add(E.scene, [{ transform: tf([hx, hy, -10, s0]) }, { transform: tf([0, 0, 0, 1]) }], 11.8, 1.0, EO);
    add(E.glow, [{ scale: 0 }, { scale: 1 }], 12.0, .8, EO);
    add(E.shadow, [{ opacity: 0 }, { opacity: 1 }], 11.9, .6);
    add(E.light, [{ transform: 'translateX(-130%)' }, { transform: 'translateX(130%)' }], 12.6, .6, 'ease-in-out');
    var pop = P.pop, inScreen = 'translateY(0%) translateZ(2px) scale(1)';
    var out = 'translateY(' + pop.y + '%) translateZ(' + px(pop.z) + ') scale(' + pop.s + ')';
    add(E.notif, [{ opacity: 0, transform: 'translateY(-45%) translateZ(2px) scale(.94)' }, { opacity: 1, transform: inScreen }], 12.9, .5, 'cubic-bezier(.2, 1.25, .4, 1)');
    add(E.notif, [{ transform: inScreen, boxShadow: '0 ' + px(4) + ' ' + px(10) + ' rgba(1, 1, 13, .22)' }, { transform: out, boxShadow: '0 ' + px(26) + ' ' + px(48) + ' rgba(1, 1, 13, .45)' }], 13.5, .75, 'cubic-bezier(.22, 1.45, .4, 1)');
    draw(E.mint, 13.4, .6, EIO);
    add(E.notif, [{ opacity: 1, transform: out }, { opacity: 0, transform: 'translateY(' + (pop.y - 60) + '%) translateZ(' + px(pop.z + 40) + ') scale(' + pop.s + ')' }], 15.6, .45, EIN);
    E.chips.forEach(function (c, i) { add(c, [{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1 }], 15.65 + i * .15, .45, POP); });

    /* — La note de la fin, sur l'affiche — */
    P.notes.forEach(function (n, i) {
      var el = E.notes[i];
      if (!el) return;
      el.textContent = '';
      n.text.split('\n').forEach(function (l) { var sp = document.createElement('span'); sp.textContent = l; el.appendChild(sp); });
      el.style.transform = tf(n.at);
      add(el, [{ opacity: 0 }, { opacity: 1 }], n.t[0], .05);
      [].forEach.call(el.children, function (sp, k) { wipe(sp, n.t[0] + k * .22, .42); });
      if (noteArrows[i]) {
        var a = n.t[0] + el.children.length * .22 + .1;
        draw(noteArrows[i][0], a, .35, DRAW);
        draw(noteArrows[i][1], a + .32, .14, 'ease-out');
        noteArrows[i].forEach(function (pth) { add(pth, [{ opacity: 1 }, { opacity: 0 }], n.t[1] - .25, .25); });
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
