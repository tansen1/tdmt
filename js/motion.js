(function () {
  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !window.Lenis) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (location.search.indexOf('static') > -1) { root.classList.add('static-test'); return; } // layout testing: ?static

  var hidden = '.pull, .book__title, .watch .h2';
  function bail() {
    root.classList.remove('js-motion');
    document.querySelectorAll(hidden).forEach(function (el) { el.style.visibility = 'visible'; });
  }
  root.classList.add('js-motion');
  // if anything below fails or stalls, show everything as plain static content
  var failsafe = setTimeout(bail, 6000);

  function init() {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    var lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    var once = function (trigger, start, fn) {
      ScrollTrigger.create({ trigger: trigger, start: start, once: true, onEnter: fn });
    };

    // 0. hero scene: the small video inside the title grows to fill the screen
    (function () {
      var loader = document.getElementById('loader');
      var stage = document.getElementById('loaderStage');
      var slot = document.getElementById('heroSlot');
      var title = document.getElementById('heroTitle');
      if (!loader || !stage || !slot || !title) return;
      var the = title.querySelector('.hw--the'), delhi = title.querySelector('.hw--delhi'),
          musical = title.querySelector('.hw--musical'), theater = title.querySelector('.hw--theater');
      var feather = stage.querySelector('.loader__feather'), play = stage.querySelector('.loader__play'),
          cue = loader.querySelector('.loader__scroll');
      var rem = function () { return parseFloat(getComputedStyle(root).fontSize) || 16; };
      var from = function () {
        var l = loader.getBoundingClientRect(), r = slot.getBoundingClientRect();
        return { left: r.left - l.left, top: r.top - l.top, width: r.width, height: r.height };
      };
      var radius = function () { return slot.getBoundingClientRect().height * 0.14; };
      var inset = function () { return rem() * 0.35; };
      var topGap = function () { return rem() * 4.75; };

      // "The" starts a third of the way across the small video, as in the reference
      function placeThe() {
        gsap.set(the, { x: 0 });
        var l = the.getBoundingClientRect().left, r = slot.getBoundingClientRect();
        gsap.set(the, { x: r.left + r.width / 3 - l });
      }
      placeThe();
      window.addEventListener('resize', placeThe);
      ScrollTrigger.addEventListener('refreshInit', placeThe);

      var start = from();
      gsap.set(stage, { left: start.left, top: start.top, width: start.width, height: start.height,
        right: 'auto', bottom: 'auto', borderTopLeftRadius: radius(), borderTopRightRadius: radius(),
        borderBottomLeftRadius: radius(), borderBottomRightRadius: radius(), visibility: 'visible' });
      gsap.set(feather, { opacity: 0 });

      // entrance: words rise in once
      gsap.from([the, delhi, musical, theater], { opacity: 0, yPercent: 30, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.15, clearProps: 'opacity' }); // yPercent, not y: the scroll tween owns y
      gsap.from(stage, { opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.4 });

      var tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: loader, start: 'top top', end: '+=130%', pin: true, scrub: 0.8,
          anticipatePin: 1, invalidateOnRefresh: true } });
      tl.fromTo(stage, { left: function () { return from().left; }, top: function () { return from().top; },
          width: function () { return from().width; }, height: function () { return from().height; },
          borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: radius, borderBottomRightRadius: radius },
        { left: inset, top: topGap, width: function () { return loader.clientWidth - inset() * 2; },
          height: function () { return loader.clientHeight - topGap(); },
          borderTopLeftRadius: function () { return rem() * 2.75; }, borderTopRightRadius: function () { return rem() * 2.75; },
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0, ease: 'power2.inOut', duration: 1 }, 0)
        .to(the,     { y: function () { return -window.innerHeight * 0.9; }, ease: 'power2.in', duration: 0.9 }, 0)
        .to(theater, { y: function () { return  window.innerHeight * 0.9; }, ease: 'power2.in', duration: 0.9 }, 0)
        .to(delhi,   { x: function () { return -window.innerWidth * 0.9; },  ease: 'power2.in', duration: 0.9 }, 0)
        .to(musical, { x: function () { return  window.innerWidth * 0.9; },  ease: 'power2.in', duration: 0.9 }, 0)
        .to(play, { opacity: 0, duration: 0.25 }, 0)
        .to(cue,  { opacity: 0, duration: 0.15 }, 0)
        .to(feather, { opacity: 1, duration: 0.4 }, 0.6);

      // when scrolling stops with the video nearly full, finish the growth slowly.
      // Any new wheel / key / touch input cancels it, so continuous scrolling is untouched.
      var st = tl.scrollTrigger, idle = 0, filling = false, touching = false;
      function settle() {
        if (filling || touching) return;
        var p = st.progress;
        if (p < 0.7 || p >= 0.999 || lenis.direction < 0) return; // only when heading down
        filling = true;
        lenis.scrollTo(st.end, { duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 3); },
          onComplete: function () { filling = false; } });
      }
      function arm() { clearTimeout(idle); idle = setTimeout(settle, 220); }
      function cancel() {
        if (filling) { filling = false; lenis.scrollTo(lenis.scroll, { immediate: true }); }
        clearTimeout(idle);
      }
      lenis.on('scroll', function () { if (!filling) arm(); });
      ['wheel', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { cancel(); arm(); }, { passive: true }); });
      window.addEventListener('touchstart', function () { touching = true; cancel(); }, { passive: true });
      window.addEventListener('touchend', function () { touching = false; arm(); }, { passive: true });
    })();

    // 4. headline reveal: lines rise out of a mask, once (re-splits on resize)
    document.querySelectorAll(hidden).forEach(function (el) {
      var done = false;
      var split = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          // pad the clip box so descenders (y, g, p) and ascenders are not cut off
          self.masks.forEach(function (m) { m.style.paddingBlock = '.12em'; m.style.marginBlock = '-.12em'; });
          gsap.set(self.lines, { yPercent: done ? 0 : 110 });
          el.style.visibility = 'visible';
        } });
      once(el, 'top 88%', function () {
        done = true;
        gsap.to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out' });
      });
    });

    // 5. scrubbed text: words come up from faint as you scroll through
    document.querySelectorAll('.about__side p, .book .lede').forEach(function (el) {
      var words = SplitText.create(el, { type: 'words' }).words;
      gsap.fromTo(words, { opacity: 0.15 }, { opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: true } });
    });

    // 7. band photo opens with a clip-path, once
    var photo = document.querySelector('.shape--band');
    if (photo) {
      gsap.set(photo, { clipPath: 'inset(100% 0% 0% 0%)' });
      once(photo, 'top 85%', function () {
        gsap.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' });
      });
    }

    // quiet fade-up for the remaining pieces, once
    [['.eyebrow'], ['.media--feature'], ['.watch__meta'], ['.listen'], ['.gallery .link'], ['.book__actions'], ['.about__side .link']].forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el) {
        gsap.set(el, { opacity: 0, y: 24 });
        once(el, 'top 92%', function () { gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }); });
      });
    });
    var rows = document.querySelectorAll('.cast__list li');
    gsap.set(rows, { opacity: 0, y: 24 });
    once('.cast__list', 'top 85%', function () { gsap.to(rows, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }); });

    // 9. gallery parallax
    document.querySelectorAll('.mosaic figure').forEach(function (fig) {
      var ph = fig.querySelector('.ph'); if (!ph) return;
      gsap.fromTo(ph, { yPercent: -7 }, { yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // 11 + 12. page colour blends between sections; counter follows
    var paper = '#faf6ee', brown = '#170d00';
    var tones = [
      ['#about',  paper,     brown, '01', 'About'],
      ['#watch',  '#14234b', paper, '02', 'Watch & Listen'],
      ['#cast',   paper,     brown, '03', 'Cast'],
      ['#gallery', paper,    brown, '04', 'Gallery'],
      ['#book',   '#d9442b', paper, '05', 'Book us'],
      ['.site-footer', brown, paper, null]
    ];
    var counter = document.getElementById('counter');
    tones.forEach(function (t) {
      var el = document.querySelector(t[0]); if (!el) return;
      ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) {
          if (!self.isActive) return;
          gsap.to(document.body, { backgroundColor: t[1], color: t[2], duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' });
          if (t[3]) {
            counter.querySelector('.counter__n').textContent = t[3];
            counter.querySelector('.counter__label').textContent = t[4];
            counter.classList.add('is-on');
          } else counter.classList.remove('is-on');
        },
        onLeaveBack: function () { if (t[0] === '#about') counter.classList.remove('is-on'); }
      });
    });

    // nav stays put; solid bar once the page content reaches the top
    ScrollTrigger.create({ trigger: '#about', start: 'top 80px',
      onEnter: function () { document.body.classList.add('past-hero'); },
      onLeaveBack: function () { document.body.classList.remove('past-hero'); } });

    clearTimeout(failsafe);
    ScrollTrigger.refresh();
  }

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    try { init(); } catch (e) { console.error(e); bail(); }
  });
})();
