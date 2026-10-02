// Anfrageformular (Feiern, Gruppen, Gutscheine): prüfen, absenden, Dank zeigen.
(function () {
  'use strict';
  var form = document.querySelector('[data-inquiry]');
  if (!form) return;
  var errorBox = form.querySelector('[data-form-error]');
  var btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.classList.remove('is-visible');
    if (!window.siteValidate(form)) return;
    var f = form.elements;
    var data = {
      action: 'anfrage',
      thema: f.thema.value,
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      telefon: f.telefon.value.trim(),
      datum: f.datum.value,
      personen: f.personen.value,
      nachricht: f.nachricht.value.trim(),
      datenschutz: f.datenschutz.checked ? 'ja' : 'nein',
      'bot-field': f['bot-field'].value,
      t0: f.t0.value,
      seite: location.href,
    };
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    window
      .siteSend(form, data)
      .then(function () {
        window.siteTrack('anfrage_gesendet', { thema: data.thema });
        var box = document.createElement('div');
        box.className = 'success';
        box.tabIndex = -1;
        box.innerHTML =
          '<h3>Danke, ' + escapeHtml(data.name.split(' ')[0]) + '!</h3>' +
          '<p class="muted">Ihre Anfrage ist bei uns angekommen. Wir melden uns in der Regel innerhalb von ein bis zwei Tagen.</p>';
        form.replaceWith(box);
        box.focus();
      })
      .catch(function (err) {
        errorBox.querySelector('span').textContent =
          (err && err.message && err.message.indexOf('fetch') === -1 && err.message) ||
          'Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie uns eine E-Mail.';
        errorBox.classList.add('is-visible');
      })
      .then(function () {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      });
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
