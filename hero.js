/* Hero de l'accueil — anime le téléphone 3D.
   - au repos : il flotte et pivote lentement ;
   - au pointeur : il s'oriente vers la souris (ou l'inclinaison du doigt) ;
   - au défilement : il bascule en sortant de l'écran ;
   - à l'écran : on navigue dans Maurice comme un vrai utilisateur (un « tap »
     puis l'écran suivant glisse), en boucle.
   Rien ne bouge si l'utilisateur a demandé à réduire les animations. */
(function () {
  var device = document.querySelector('[data-device]');
  if (!device) return;
  var scene = device.parentElement;
  var shadow = scene.querySelector('.device-shadow');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ——— Parcours dans l'app : on passe d'un onglet à l'autre, comme dans
     Maurice. Seuls la barre d'onglets et le contenu changent ; l'en-tête du
     voyage reste en place. ——— */
  var screen = device.querySelector('[data-screen]');
  var bar = device.querySelector('[data-tabbar]');
  var track = device.querySelector('[data-track]');
  var pill = device.querySelector('[data-pill]');
  var tabs = Array.prototype.slice.call(track.querySelectorAll('.tab'));
  var panels = {};
  Array.prototype.forEach.call(device.querySelectorAll('[data-tab]'), function (el) { panels[el.getAttribute('data-tab')] = el; });
  var tap = device.querySelector('.device-tap');
  /* Le parcours : des onglets et deux feuilles modales. Les positions de tap
     des feuilles sont en % de l'écran, relevées sur les captures. */
  var route = [
    { tab: 0 },
    { sheet: 'resas', open: [50, 31.5], close: [50, 88.4], dim: 0.453 },
    { tab: 1 },
    { tab: 5 },
    { tab: 6 },
    { sheet: 'participants', open: [74, 10], close: [89, 13.1], dim: 0.21 }
  ];
  var step = 0, scrollX = 0, tabNow = 0;
  var dim = device.querySelector('[data-dim]');
  var sheets = {}, tops = {};
  Array.prototype.forEach.call(device.querySelectorAll('[data-sheet]'), function (el) { sheets[el.getAttribute('data-sheet')] = el; });
  Array.prototype.forEach.call(device.querySelectorAll('[data-sheet-top]'), function (el) { tops[el.getAttribute('data-sheet-top')] = el; });

  function maxScroll() { return Math.max(0, track.scrollWidth - bar.clientWidth); }
  function setScroll(x) {
    scrollX = x;
    track.style.setProperty('--tx', -x + 'px');
    bar.classList.toggle('is-scrolled', x > 0);
  }
  function placePill(i) {
    var t = tabs[i];
    pill.style.setProperty('--px', t.offsetLeft + 'px');
    pill.style.setProperty('--pw', t.offsetWidth + 'px');
    tabs.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
  }
  function tapXY(left, top) {
    tap.style.left = left;
    tap.style.top = top;
    tap.classList.remove('is-tapping');
    void tap.offsetWidth;
    tap.classList.add('is-tapping');
  }
  function tapAt(i) {
    var t = tabs[i];
    tapXY((bar.offsetLeft + t.offsetLeft - scrollX + t.offsetWidth / 2) + 'px', (bar.offsetTop + bar.offsetHeight / 2) + 'px');
  }
  function tapPct(p) { tapXY(p[0] + '%', p[1] + '%'); }
  function setSheet(st, on) {
    dim.style.setProperty('--dim', st.dim);
    dim.classList.toggle('is-on', on);
    sheets[st.sheet].classList.toggle('is-open', on);
    if (tops[st.sheet]) tops[st.sheet].classList.toggle('is-on', on);
  }
  function show(from, to) {
    var dir = to > from ? 1 : -1;
    var out = panels[from], inn = panels[to];
    Object.keys(panels).forEach(function (k) { if (panels[k] !== out && panels[k] !== inn) panels[k].classList.remove('is-leaving'); });
    out.style.setProperty('--to', (-4 * dir) + '%');
    out.classList.remove('is-active');
    out.classList.add('is-leaving');
    inn.style.transition = 'none';
    inn.classList.remove('is-leaving');
    inn.style.setProperty('--from', (6 * dir) + '%');
    void inn.offsetWidth;
    inn.style.transition = '';
    inn.classList.add('is-active');
  }
  function goTab(to) {
    var from = tabNow;
    tabNow = to;
    // l'onglet visé est-il hors de la barre ? on la fait défiler d'abord
    var target = to >= 4 ? maxScroll() : 0;
    var delay = 0;
    if (target !== scrollX) { setScroll(target); delay = 650; }
    setTimeout(function () {
      tapAt(to);
      setTimeout(function () { placePill(to); show(from, to); }, 160);
    }, delay);
  }
  var sheetOpen = null;
  function next() {
    // une feuille ouverte se referme avant d'aller plus loin
    if (sheetOpen) {
      var st = sheetOpen; sheetOpen = null;
      tapPct(st.close);
      setTimeout(function () { setSheet(st, false); }, 160);
      return;
    }
    step = (step + 1) % route.length;
    var s = route[step];
    if (s.sheet) {
      tapPct(s.open);
      setTimeout(function () { setSheet(s, true); }, 160);
      sheetOpen = s;
    } else {
      goTab(s.tab);
    }
  }

  function init() { placePill(0); setScroll(0); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  window.addEventListener('resize', function () { setScroll(tabNow >= 4 ? maxScroll() : 0); placePill(tabNow); });

  if (reduce) return;

  var visible = true;
  var timer = setInterval(function () { if (visible && !document.hidden) next(); }, 3200);

  /* ——— Rotation : repos + pointeur + défilement, lissés ——— */
  var px = 0, py = 0, tx = 0, ty = 0, scroll = 0;
  var t0 = performance.now();

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
    var r = scene.getBoundingClientRect();
    scroll = Math.max(0, Math.min(1, 1 - (r.bottom / (window.innerHeight + r.height * 0.2))));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(scene);
  }

  function frame(now) {
    if (!visible) return;
    var t = (now - t0) / 1000;
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    var ry = -20 + Math.sin(t * 0.45) * 16 + px * 18 + scroll * 50;
    var rx = 7 + Math.sin(t * 0.7) * 3 - py * 10 + scroll * 18;
    var rz = 2 + Math.sin(t * 0.4) * 1.5;
    var fy = Math.sin(t * 0.9) * 9 - scroll * 40;

    device.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    device.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    device.style.setProperty('--rz', rz.toFixed(2) + 'deg');
    device.style.setProperty('--fy', fy.toFixed(1) + 'px');
    // le reflet glisse sur la vitre quand le téléphone tourne
    device.style.setProperty('--gx', (50 + ry * 1.6).toFixed(1) + '%');
    if (shadow) shadow.style.setProperty('--ss', (1 - (fy + 9) / 60).toFixed(3));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
