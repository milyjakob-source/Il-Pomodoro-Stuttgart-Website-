// Speisekarte: zeigt die Karte aus der Inhaber-App (mit Preisen), sobald sie geladen ist, und markiert
// in der Kategorienleiste den Abschnitt, der gerade zu sehen ist.
(function () {
  'use strict';
  var nav = document.querySelector('[data-menu-nav]');
  var box = document.querySelector('[data-karte]');

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    return 'k-' + String(s).toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  }

  function render(karte) {
    var tpl = document.querySelector('[data-tag-icons]');
    var tagHtml = {};
    if (tpl) tpl.content.querySelectorAll('[data-tag]').forEach(function (t) {
      tagHtml[t.getAttribute('data-tag')] = t.outerHTML;
    });
    var gruppen = [];
    karte.forEach(function (g) {
      var gr = gruppen.filter(function (x) {
        return x.titel === g.kategorie;
      })[0];
      if (!gr) gruppen.push((gr = { titel: g.kategorie || 'Weitere Gerichte', gerichte: [] }));
      gr.gerichte.push(g);
    });
    box.innerHTML = gruppen
      .map(function (gr) {
        var id = slug(gr.titel);
        return (
          '<section class="menu-section" id="' + id + '" aria-labelledby="h-' + id + '"><h2 id="h-' + id + '">' + esc(gr.titel) + '</h2>' +
          '<ul class="dishes">' +
          gr.gerichte
            .map(function (g) {
              var tags = (g.tags || []).map(function (t) {
                return tagHtml[t] || '';
              }).join('');
              return (
                '<li class="dish dish-preis"><h3>' + esc(g.name) + '</h3>' + (g.preis > 0 ? '<span class="price">' + window.siteEuro(g.preis) + '</span>' : '') +
                (g.beschreibung ? '<p>' + esc(g.beschreibung) + '</p>' : '') + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</li>'
              );
            })
            .join('') +
          '</ul></section>'
        );
      })
      .join('');
    if (nav) {
      nav.innerHTML = '<a href="#wochenkarte">Wochenkarte</a>' + gruppen.map(function (gr) {
        return '<a href="#' + slug(gr.titel) + '">' + esc(gr.titel) + '</a>';
      }).join('');
    }
    var note = document.querySelector('[data-preisnote]');
    if (note && karte.some(function (g) {
      return g.preis > 0;
    })) note.hidden = true;
  }

  function beobachten() {
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
  }

  (window.siteLive ? window.siteLive() : Promise.resolve(null)).then(function (d) {
    if (d && box && d.karte && d.karte.length) render(d.karte);
    beobachten();
  });
})();
