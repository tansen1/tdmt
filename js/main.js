var y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

var toggle = document.querySelector('.nav-toggle');
var nav = document.getElementById('nav');
if (toggle && nav) {
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
}

document.querySelectorAll('[data-placeholder-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelector('.form-status').textContent = 'This form is not connected yet.';
  });
});

if (!window.gsap && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.home main > .band .wrap > *').forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (el.classList.contains('eyebrow') ? 0 : 0.08) + 's';
    io.observe(el);
  });
}

