// Speisekarte: markiert in der Kategorienleiste den Abschnitt, der gerade zu sehen ist.
(function () {
  'use strict';
  var nav = document.querySelector('[data-menu-nav]');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = {};
  nav.querySelectorAll('a').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle('is-active', id === entry.target.id);
        });
        var active = links[entry.target.id];
        // Auf dem Handy scrollt die Leiste horizontal mit.
        if (active && nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' });
        }
      });
    },
    { rootMargin: '-35% 0px -60% 0px' },
  );
  document.querySelectorAll('.menu-section').forEach(function (s) {
    io.observe(s);
  });
})();
