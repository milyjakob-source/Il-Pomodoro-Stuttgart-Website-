// Speisekarte: markiert in der Kategorienleiste den Abschnitt, der gerade zu sehen ist,
// und scrollt die Leiste mit (auf dem Handy waagerecht, am Computer senkrecht).
(function () {
  'use strict';
  var nav = document.querySelector('[data-menu-nav]');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = {};
  nav.querySelectorAll('a').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  var aktiv = null;
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = links[entry.target.id];
        if (!link || link === aktiv) return;
        if (aktiv) aktiv.classList.remove('is-active');
        link.classList.add('is-active');
        aktiv = link;
        // Nur die Leiste selbst scrollen, nie die Seite.
        if (nav.scrollWidth > nav.clientWidth + 4) {
          nav.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
        } else if (nav.scrollHeight > nav.clientHeight + 4) {
          var oben = link.offsetTop - nav.clientHeight / 2;
          nav.scrollTo({ top: oben, behavior: 'smooth' });
        }
      });
    },
    { rootMargin: '-30% 0px -65% 0px' },
  );
  document.querySelectorAll('.menu-section').forEach(function (s) {
    io.observe(s);
  });
})();
