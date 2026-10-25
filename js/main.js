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
