// Tageskarte, Wochenkarte und Neuigkeiten: holt die neuesten Bilder aus den Google-Drive-Ordnern
// (über das Google-Skript, Adresse in config.js → kartenEndpoint) und zeigt sie groß an.
// Kein Bild oder keine Verbindung: Hinweis auf Instagram und Facebook.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var box = document.querySelector('[data-karten]');
  if (!box) return;
  var bereich = box.getAttribute('data-karten');
  var laden = box.querySelector('[data-karten-laden]');
  var inhalt = box.querySelector('[data-karten-inhalt]');
  var leer = box.querySelector('[data-karten-leer]');
  var SPEICHER = 'ilpomodoro.karten';
  var GUELTIG = 2 * 60 * 1000; // 2 Minuten im Browser merken

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function datum(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' });
  }
  // Dateinamen wie „IMG_1234“ oder „1-tageskarte“ sind keine schönen Überschriften.
  function titelOk(t) {
    return t && !/^(img|dsc|pxl|photo|bild|screenshot|whatsapp|image)[\s\d]/i.test(t) && !/^\d+$/.test(t) && !/^\d+\s+(tages|wochen)/i.test(t);
  }

  var extra = document.querySelector('.karten-social');
  function zeigeLeer() {
    laden.hidden = true;
    inhalt.hidden = true;
    leer.hidden = false;
    // Die Knöpfe stehen dann schon im Hinweis, kein zweites Mal darunter.
    if (extra) extra.closest('section').hidden = true;
  }

  function bildHtml(b, gross, alt) {
    return (
      '<button type="button" class="karten-bild' + (gross ? ' karten-bild-gross' : '') + '" data-gross="' + esc(b.bild) + '" aria-label="' + esc(alt) + ' vergrößern">' +
      '<img src="' + esc(gross ? b.bild : b.vorschau) + '" alt="' + esc(alt) + '" ' + (gross ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">' +
      '<span class="karten-zoom" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Zm112,0a8,8,0,0,1-8,8H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h24A8,8,0,0,1,152,112Z"/></svg></span>' +
      '</button>'
    );
  }

  function zeige(bilder) {
    if (!bilder || !bilder.length) return zeigeLeer();
    var name = { tageskarte: 'Tageskarte', wochenkarte: 'Wochenkarte', neuigkeiten: 'Neuigkeit' }[bereich] || 'Bild';
    var erstes = bilder[0];
    var html =
      '<figure class="karten-haupt">' + bildHtml(erstes, true, titelOk(erstes.titel) ? erstes.titel : name) +
      '<figcaption>' + (titelOk(erstes.titel) ? '<strong>' + esc(erstes.titel) + '</strong> · ' : '') + 'Stand: ' + esc(datum(erstes.datum)) + '</figcaption></figure>';
    // Bei Neuigkeiten die vorherigen Beiträge kleiner darunter.
    if (bereich === 'neuigkeiten' && bilder.length > 1) {
      html += '<h2 class="karten-frueher">Frühere Neuigkeiten</h2><div class="karten-raster">' +
        bilder.slice(1).map(function (b) {
          return '<figure>' + bildHtml(b, false, titelOk(b.titel) ? b.titel : name) + '<figcaption>' + esc(datum(b.datum)) + '</figcaption></figure>';
        }).join('') + '</div>';
    }
    inhalt.innerHTML = html;
    // Bild lädt nicht (z. B. gelöscht): lieber den Hinweis zeigen als ein kaputtes Bild.
    var haupt = inhalt.querySelector('.karten-haupt img');
    haupt.addEventListener('error', zeigeLeer, { once: true });
    inhalt.querySelectorAll('.karten-raster figure').forEach(function (f) {
      f.querySelector('img').addEventListener('error', function () {
        f.remove();
      }, { once: true });
    });
    var fertig = function () {
      laden.hidden = true;
      inhalt.hidden = false;
      leer.hidden = true;
    };
    if (haupt.complete && haupt.naturalWidth) fertig();
    else haupt.addEventListener('load', fertig, { once: true });
    // Sicherheitsnetz: nach 8 Sekunden trotzdem zeigen (langsames Netz).
    setTimeout(function () {
      if (!laden.hidden && leer.hidden) fertig();
    }, 8000);
  }

  function holen() {
    try {
      var g = JSON.parse(sessionStorage.getItem(SPEICHER) || 'null');
      if (g && Date.now() - g.t < GUELTIG) return Promise.resolve(g.d);
    } catch (e) {}
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 12000);
    return fetch(CFG.kartenEndpoint, { redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        clearTimeout(timer);
        if (!d || !d.ok) throw new Error('keine Daten');
        try {
          sessionStorage.setItem(SPEICHER, JSON.stringify({ t: Date.now(), d: d }));
        } catch (e) {}
        return d;
      });
  }

  if (!CFG.kartenEndpoint) zeigeLeer();
  else
    holen()
      .then(function (d) {
        zeige(d[bereich]);
      })
      .catch(zeigeLeer);

  /* Vergrößern ------------------------------------------------------------- */
  var lb = document.querySelector('[data-lightbox]');
  var lbBild = lb && lb.querySelector('[data-lightbox-bild]');
  var zuvor = null;
  function oeffnen(src, alt) {
    zuvor = document.activeElement;
    lbBild.src = src;
    lbBild.alt = alt;
    lb.hidden = false;
    document.body.classList.add('lightbox-offen');
    lb.querySelector('[data-lightbox-zu]').focus();
  }
  function schliessen() {
    lb.hidden = true;
    document.body.classList.remove('lightbox-offen');
    if (zuvor) zuvor.focus();
  }
  if (lb) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gross]');
      if (b) oeffnen(b.getAttribute('data-gross'), b.querySelector('img').alt);
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('[data-lightbox-zu]')) schliessen();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hidden) schliessen();
    });
  }
})();
