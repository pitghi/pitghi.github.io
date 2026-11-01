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

  /* ——— Parcours dans l'app : où l'on « tape » sur chaque écran pour aller au suivant (en % de l'écran) ——— */
  var screens = Array.prototype.slice.call(device.querySelectorAll('[data-screens] img'));
  var tap = device.querySelector('.device-tap');
  var taps = [[50, 40], [50, 34], [79, 34], [78, 9], [89, 9]];
  var current = 0;

  function next() {
    var from = screens[current];
    var pos = taps[current] || [50, 50];
    tap.style.left = pos[0] + '%';
    tap.style.top = pos[1] + '%';
    tap.classList.remove('is-tapping');
    void tap.offsetWidth;
    tap.classList.add('is-tapping');
    setTimeout(function () {
      current = (current + 1) % screens.length;
      var to = screens[current];
      screens.forEach(function (img) { if (img !== from && img !== to) img.classList.remove('is-leaving'); });
      to.classList.remove('is-leaving');
      // repositionne l'écran entrant à droite sans transition, puis le fait glisser
      to.style.transition = 'none';
      to.classList.remove('is-active');
      void to.offsetWidth;
      to.style.transition = '';
      from.classList.remove('is-active');
      from.classList.add('is-leaving');
      to.classList.add('is-active');
    }, 380);
  }

  if (reduce) return;

  var visible = true;
  var timer = setInterval(function () { if (visible && !document.hidden) next(); }, 3400);

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
