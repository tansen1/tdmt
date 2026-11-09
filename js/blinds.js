/* Venetian-blinds reveal for gallery photos: dark slats flip open in a stagger, photo settles from slightly zoomed. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var N = 8;
  document.querySelectorAll('.mosaic .shape, .gallery-page .card').forEach(function (tile) {
    var img = tile.querySelector('img');
    if (!img) return;
    img.removeAttribute('loading'); // must be ready before the slats open

    var wrap = document.createElement('div'); wrap.className = 'blinds';
    for (var k = 0; k < N; k++) wrap.appendChild(document.createElement('i'));
    tile.appendChild(wrap);
    var slats = wrap.children;

    gsap.set(slats, { transformOrigin: function (i) { return i % 2 ? '50% 0%' : '50% 100%'; } });
    var zoom = tile.classList.contains('shape') ? null : img; // home tiles already run a parallax on the img
    var tl = gsap.timeline({ paused: true })
      .to(slats, { scaleY: 0, duration: 0.9, ease: 'power3.inOut', stagger: { each: 0.07, from: 'start' } }, 0);
    if (zoom) tl.fromTo(zoom, { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0);

    ScrollTrigger.create({ trigger: tile, start: 'top 85%', once: true, onEnter: function () { tl.play(); } });
  });
})();
