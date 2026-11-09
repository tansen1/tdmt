/* Stage-curtain reveal for the cast photo: red curtains part on scroll, photo eases from zoomed to full size. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var frame = document.querySelector('.cast-band .shape--band');
  var img = frame && frame.querySelector('img');
  if (!img) return;
  gsap.registerPlugin(ScrollTrigger);

  var l = document.createElement('div'); l.className = 'curtain curtain--l';
  var r = document.createElement('div'); r.className = 'curtain curtain--r';
  frame.appendChild(l); frame.appendChild(r);
  img.removeAttribute('loading'); // must be ready before the curtains open

  var rows = document.querySelectorAll('.cast__list li');
  var tl = gsap.timeline({ paused: true })
    .set(img, { scale: 1.18 })
    .to(l, { xPercent: -100, duration: 1.8, ease: 'power3.inOut' }, 0.3)
    .to(r, { xPercent: 100, duration: 1.8, ease: 'power3.inOut' }, 0.3)
    .to(img, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0.3);

  ScrollTrigger.create({
    trigger: frame, start: 'top 75%',
    onEnter: function () { tl.play(); },
    onLeaveBack: function () { tl.pause(0); } // scroll back up and down to replay
  });
})();
