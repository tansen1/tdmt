// Sound cursor: a pill that follows the pointer over the hero video.
// Kept deliberately quiet: a lightly damped spring for the follow (a touch of
// lag, almost no overshoot), a slight tilt with horizontal speed, and a small
// scale on enter / leave / press.
(function () {
  var stage = document.getElementById('loaderStage');
  var vid = document.getElementById('loaderVideo');
  var cur = document.getElementById('cursor');
  if (!stage || !vid || !cur) return;

  var body = document.getElementById('cursorBody');
  var label = document.getElementById('cursorLabel');
  var touch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;


  // ---- polka-dot confetti, fired when sound switches on ----
  var palette = ['#d9442b', '#f6e27a', '#b8e6a0', '#14234b', '#d11fa0', '#faf6ee'];
  var canvas, ctx, dots = [], raf = 0;
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
  }
  function sizeCanvas() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * d; canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function burst(ox, oy) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ensureCanvas();
    for (var i = 0; i < 12; i++) {
      var a = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 130;
      dots.push({ x: ox + Math.cos(a) * 36, y: oy + Math.sin(a) * 14,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 110,
        r: 2.8 + Math.random() * 2.2, c: palette[i % palette.length],
        life: 0, max: 0.7 + Math.random() * 0.4 });
    }
    if (!raf) { var t0 = performance.now(); raf = requestAnimationFrame(function step(now) {
      var dt = Math.min(0.033, (now - t0) / 1000); t0 = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      dots = dots.filter(function (d) { return d.life < d.max; });
      dots.forEach(function (d) {
        d.life += dt; d.vy += 450 * dt; d.vx *= 1 - 1.6 * dt; d.vy *= 1 - 0.6 * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
        var f = d.life / d.max;
        ctx.globalAlpha = 0.85 * (f < 0.5 ? 1 : 1 - (f - 0.5) / 0.5);
        ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 - f * 0.25), 0, 6.2832); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (dots.length) raf = requestAnimationFrame(step); else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }); }
  }

  // ---- sound state ----
  function sync() {
    var on = !vid.muted;
    cur.classList.toggle('is-sound', on);
    label.textContent = on ? 'Mute' : 'Unmute';
    stage.setAttribute('aria-label', on ? 'Mute video' : 'Unmute video');
  }
  vid.muted = true;
  var p = vid.play(); if (p && p.catch) p.catch(function () {});
  stage.setAttribute('role', 'button');
  stage.setAttribute('tabindex', '0');
  function toggle() {
    vid.muted = !vid.muted;
    if (!vid.muted) vid.volume = 1;
    if (vid.paused) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
    sync();
    if (!vid.muted) { var b = body.getBoundingClientRect(); burst(b.left + b.width / 2, b.top + b.height / 2); }
  }
  stage.addEventListener('click', toggle);
  stage.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  sync();
  if (touch) return; // CSS parks the button at the bottom of the video

  // ---- physics ----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0;
  var s = 0.9, vs = 0, sTarget = 0.9, tilt = 0;
  var inside = false, seen = false, last = performance.now();

  function setInside(v) { inside = v; sTarget = v ? 1 : 0.9; cur.classList.toggle('is-on', v); }
  function pointerIn(e) {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { x = tx; y = ty; seen = true; }
    if (!inside) setInside(true);
  }
  stage.addEventListener('pointerenter', pointerIn);
  stage.addEventListener('pointermove', pointerIn);
  stage.addEventListener('pointerleave', function () { setInside(false); });
  stage.addEventListener('pointerdown', function () { sTarget = 0.95; });
  window.addEventListener('pointerup', function () { if (inside) sTarget = 1; });
  window.addEventListener('blur', function () { setInside(false); });

  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000); last = now;

    // the video can move under a still pointer (scroll / grow): hide if it leaves
    if (inside) {
      var r = stage.getBoundingClientRect();
      if (tx < r.left || tx > r.right || ty < r.top || ty > r.bottom) setInside(false);
    }

    var k = reduce ? 600 : 230, c = reduce ? 50 : 27;   // c is close to critical (~30): soft, no wobble
    vx += ((tx - x) * k - vx * c) * dt;
    vy += ((ty - y) * k - vy * c) * dt;
    x += vx * dt; y += vy * dt;

    vs += ((sTarget - s) * 300 - vs * 28) * dt;
    s += vs * dt;

    var tTilt = reduce ? 0 : Math.max(-5, Math.min(5, vx * 0.004));
    tilt += (tTilt - tilt) * Math.min(1, dt * 10);

    cur.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    body.style.transform = 'translate(-50%,-50%) rotate(' + tilt.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
