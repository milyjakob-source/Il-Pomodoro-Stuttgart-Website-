// Reservierung: Datum wählen, freie Uhrzeiten anzeigen, absenden und Bestätigung zeigen.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var R = CFG.reservierung || {};
  var form = document.querySelector('[data-reservation]');
  if (!form) return;

  var dateInput = form.querySelector('[data-date]');
  var slotsBox = form.querySelector('[data-slots]');
  var errorBox = form.querySelector('[data-form-error]');
  var submitBtn = form.querySelector('button[type="submit"]');
  var belegung = {}; // { 'JJJJ-MM-TT': { kapazitaet, belegt: { '18:00': 12 } } } vom Apps Script

  // Ohne Apps Script ist das Formular eine Anfrage, die das Restaurant von Hand bestätigt.
  if (!CFG.endpoint) submitBtn.lastChild.textContent = 'Reservierung anfragen';

  if (CFG.googleBookingUrl) {
    var gb = document.querySelector('[data-google-booking]');
    gb.hidden = false;
    gb.querySelector('[data-google-booking-link]').href = CFG.googleBookingUrl;
  }

  function berlin(date) {
    var p = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .forEach(function (x) {
        p[x.type] = x.value;
      });
    return { iso: p.year + '-' + p.month + '-' + p.day, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  function addDays(iso, n) {
    var d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function weekday(iso) {
    return new Date(iso + 'T12:00:00Z').getUTCDay();
  }
  function toMin(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function toHHMM(m) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function personen() {
    var c = form.querySelector('input[name="personen"]:checked');
    return c ? parseInt(c.value, 10) : 2;
  }

  /** Uhrzeiten eines Tages im Raster, nach Mittag und Abend getrennt, ohne vergangene und zu kurzfristige. */
  function groupsFor(iso) {
    if ((R.geschlossen || []).indexOf(iso) !== -1) return [];
    var ranges = (R.zeiten || {})[weekday(iso)] || [];
    var step = R.rasterMinuten || 15;
    var now = berlin(new Date());
    var earliest = iso === now.iso ? now.min + (R.vorlaufMinuten || 0) : -1;
    return ranges
      .map(function (r) {
        var times = [];
        for (var m = toMin(r[0]); m <= toMin(r[1]); m += step) if (m >= earliest) times.push(toHHMM(m));
        return { label: toMin(r[0]) < 15 * 60 ? 'Mittag' : 'Abend', times: times };
      })
      .filter(function (g) {
        return g.times.length;
      });
  }
  function slotsFor(iso) {
    return groupsFor(iso).reduce(function (all, g) {
      return all.concat(g.times);
    }, []);
  }

  function firstBookableDay() {
    var today = berlin(new Date()).iso;
    for (var i = 0; i <= (R.tageImVoraus || 60); i++) {
      var d = addDays(today, i);
      if (slotsFor(d).length) return d;
    }
    return today;
  }

  function renderSlots() {
    var iso = dateInput.value;
    var chosen = form.querySelector('input[name="uhrzeit"]:checked');
    var keep = chosen ? chosen.value : '';
    if (!iso) {
      slotsBox.innerHTML = '<p class="slots-empty">Bitte zuerst ein Datum wählen.</p>';
      return;
    }
    var groups = groupsFor(iso);
    if (!((R.zeiten || {})[weekday(iso)] || []).length) {
      slotsBox.innerHTML = '<p class="slots-empty">An diesem Tag haben wir Ruhetag. Bitte wählen Sie einen anderen Tag.</p>';
      return;
    }
    if (!groups.length) {
      slotsBox.innerHTML =
        '<p class="slots-empty">An diesem Tag ist online keine Reservierung mehr möglich. Bitte wählen Sie einen anderen Tag oder rufen Sie uns an.</p>';
      return;
    }
    var info = belegung[iso];
    // In der Inhaber-App pausiert oder als geschlossen eingetragen.
    if (info && (info.online === false || info.geschlossen)) {
      slotsBox.innerHTML =
        '<p class="slots-empty">' + (info.geschlossen ? 'An diesem Tag nehmen wir online keine Reservierungen an.' : 'Online-Reservierungen sind gerade pausiert.') +
        ' Rufen Sie uns gern an.</p>';
      return;
    }
    var p = personen();
    slotsBox.innerHTML = '';
    groups.forEach(function (g) {
      if (groups.length > 1) {
        var label = document.createElement('p');
        label.className = 'slots-label';
        label.textContent = g.label;
        slotsBox.appendChild(label);
      }
      var grid = document.createElement('div');
      grid.className = 'slots';
      g.times.forEach(function (t) {
        var voll = info && info.kapazitaet && (info.belegt[t] || 0) + p > info.kapazitaet;
        var chip = document.createElement('label');
        chip.className = 'chip';
        chip.innerHTML = '<input type="radio" name="uhrzeit" value="' + t + '"' + (voll ? ' disabled' : '') + '><span>' + t + '</span>';
        if (voll) chip.title = 'Ausgebucht';
        if (t === keep && !voll) chip.querySelector('input').checked = true;
        grid.appendChild(chip);
      });
      slotsBox.appendChild(grid);
    });
  }

  // Freie Plätze pro Uhrzeit vom Apps Script holen, sofern eingerichtet.
  function loadBelegung(iso) {
    if (!CFG.endpoint || !iso || belegung[iso]) return;
    fetch(CFG.endpoint + '?action=belegung&datum=' + encodeURIComponent(iso))
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (res && res.ok) {
          belegung[iso] = { kapazitaet: res.kapazitaet, belegt: res.belegt || {}, online: res.online, geschlossen: res.geschlossen };
          if (dateInput.value === iso) renderSlots();
        }
      })
      .catch(function () {
        /* Ohne Belegung zeigen wir einfach alle Zeiten; das Skript prüft beim Absenden erneut. */
      });
  }

  var today = berlin(new Date()).iso;
  dateInput.min = today;
  dateInput.max = addDays(today, R.tageImVoraus || 60);
  dateInput.value = firstBookableDay();
  renderSlots();
  loadBelegung(dateInput.value);

  dateInput.addEventListener('change', function () {
    var v = dateInput.value;
    if (v && (v < dateInput.min || v > dateInput.max)) {
      var field = dateInput.closest('.field');
      field.classList.add('is-invalid');
      field.querySelector('.field-error').textContent =
        v < dateInput.min ? 'Dieses Datum liegt in der Vergangenheit.' : 'Online reservieren wir bis zu ' + (R.tageImVoraus || 60) + ' Tage im Voraus.';
    }
    renderSlots();
    loadBelegung(v);
  });
  form.querySelectorAll('input[name="personen"]').forEach(function (r) {
    r.addEventListener('change', renderSlots);
  });

  function showError(msg) {
    errorBox.querySelector('span').textContent = msg;
    errorBox.classList.add('is-visible');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.classList.remove('is-visible');
    if (!window.siteValidate(form)) return;
    var v = dateInput.value;
    if (v < dateInput.min || v > dateInput.max) {
      dateInput.focus();
      return;
    }

    var slot = form.querySelector('input[name="uhrzeit"]:checked').value;
    form.querySelector('input[type="hidden"][name="uhrzeit"]').value = slot;
    var data = {
      action: 'reservierung',
      datum: v,
      uhrzeit: slot,
      personen: personen(),
      name: form.elements.name.value.trim(),
      telefon: form.elements.telefon.value.trim(),
      email: form.elements.email.value.trim(),
      anmerkung: form.elements.anmerkung.value.trim(),
      datenschutz: form.elements.datenschutz.checked ? 'ja' : 'nein',
      'bot-field': form.elements['bot-field'].value,
      t0: form.elements.t0.value,
      seite: location.href,
    };

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    window
      .siteSend(form, data)
      .then(function (res) {
        window.siteTrack('reservierung_gesendet', { personen: data.personen, status: res.status || '' });
        success(data, res);
      })
      .catch(function (err) {
        var msg = String((err && err.message) || '');
        showError(
          msg && msg.indexOf('fetch') === -1
            ? msg
            : 'Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an.',
        );
        delete belegung[v];
        loadBelegung(v);
      })
      .then(function () {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
      });
  });

  function success(data, res) {
    var tpl = document.getElementById('reservation-success').content.cloneNode(true);
    var datum = new Date(data.datum + 'T12:00:00Z').toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
    var bestaetigt = res && res.status === 'bestaetigt';
    tpl.querySelector('[data-success-title]').textContent = bestaetigt
      ? 'Ihr Tisch ist reserviert.'
      : 'Danke, Ihre Anfrage ist bei uns.';
    tpl.querySelector('[data-success-text]').textContent =
      datum + ', ' + data.uhrzeit + ' Uhr, ' + data.personen + (data.personen === 1 ? ' Person' : ' Personen') + '.' +
      (bestaetigt ? '' : ' Wir melden uns kurz, um die Reservierung zu bestätigen.');
    tpl.querySelector('[data-success-mail]').textContent = data.email;
    if (!CFG.endpoint) {
      // Ohne Apps Script geht keine automatische Bestätigung raus, das Restaurant meldet sich selbst.
      tpl.querySelector('[data-success-mail]').parentNode.textContent =
        'Wir melden uns per E-Mail oder Telefon. Bei kurzfristigen Fragen erreichen Sie uns telefonisch.';
    }
    var card = document.querySelector('[data-reservation-card]');
    card.innerHTML = '';
    card.appendChild(tpl);
    var box = card.querySelector('.success');
    box.focus();
    card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
})();
