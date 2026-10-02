// Google-Bewertungen: kommen über das eigene Apps Script (der API-Schlüssel bleibt dort).
// Ohne Skript bleiben Sternewert und die zusammengefassten Lob-Karten aus dem HTML stehen, keine erfundenen Zitate.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var track = document.querySelector('[data-reviews]');
  if (!track) return;
  // Phosphor „star-fill“ (MIT)
  var STAR = '<svg class="icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"/></svg>';

  function stars(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= Math.round(n) ? STAR : STAR.replace('class="icon"', 'class="icon is-empty"');
    return out;
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function initials(name) {
    return String(name || '?')
      .split(/\s+/)
      .map(function (p) {
        return p.charAt(0);
      })
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function render(data) {
    var rating = document.querySelector('[data-rating]');
    if (data.rating) {
      document.querySelector('[data-rating-score]').textContent = data.rating.toFixed(1).replace('.', ',');
      document.querySelector('[data-rating-stars]').innerHTML = stars(data.rating);
      document.querySelector('[data-rating-stars]').setAttribute('aria-label', data.rating.toFixed(1).replace('.', ',') + ' von 5 Sternen');
      document.querySelector('[data-rating-count]').textContent =
        data.count ? 'aus ' + data.count.toLocaleString('de-DE') + ' Google-Bewertungen' : 'von 5 Sternen auf Google';
      rating.hidden = false;
    }
    var reviews = (data.reviews || []).filter(function (r) {
      return r.text && r.rating >= 4;
    });
    if (!reviews.length) return;
    var note = document.querySelector('[data-reviews-note]');
    if (note) note.textContent = 'Aktuelle Bewertungen von Google, die besten zuerst.';
    track.innerHTML = reviews
      .map(function (r) {
        return (
          '<article class="review">' +
          '<span class="stars" role="img" aria-label="' + r.rating + ' von 5 Sternen">' + stars(r.rating) + '</span>' +
          '<blockquote><p>' + esc(r.text) + '</p></blockquote>' +
          '<div class="review-author"><span class="tag" aria-hidden="true">' + esc(initials(r.author)) + '</span>' +
          '<div>' + (r.authorUrl ? '<a href="' + esc(r.authorUrl) + '" rel="noopener nofollow" target="_blank">' + esc(r.author) + '</a>' : esc(r.author)) +
          '<span>' + esc(r.when || '') + ' auf Google</span></div></div>' +
          '</article>'
        );
      })
      .join('');
  }

  // Ohne Live-Daten bleiben die Karten „Das loben Gäste“ und die Sterne aus dem HTML stehen.
  function fail() {}

  if (!window.siteGoogle) return fail();
  window.siteGoogle().then(function (res) {
    if (res && res.ok) render(res);
    else fail();
  });
})();
