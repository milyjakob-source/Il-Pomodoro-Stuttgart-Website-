// Bestellung zur Abholung oder Lieferung. Karte, Preise, Liefergebiet und Mindestbestellwert kommen live
// aus der Inhaber-App (live.js). Das Apps Script rechnet beim Absenden alles noch einmal selbst nach.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var root = document.querySelector('[data-order]');
  if (!root) return;
  var KEY = 'ilpomodoro.warenkorb';
  var menuBox = root.querySelector('[data-order-menu]');
  var cats = root.querySelector('[data-order-cats]');
  var form = root.querySelector('[data-order-form]');
  var listEl = root.querySelector('[data-cart-list]');
  var bar = document.querySelector('[data-cart-bar]');
  var euro = window.siteEuro;
  var karte = [];
  var B = null;
  var korb = {};
  var zu = ''; // Hinweis, wenn heute nicht mehr bestellt werden kann
  try {
    korb = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {}

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    return 'b-' + String(s).toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  }
  function offline() {
    menuBox.innerHTML = document.getElementById('order-offline').innerHTML;
    root.querySelector('[data-cart]').hidden = true;
    root.classList.add('is-offline');
  }
  function typ() {
    var r = form.querySelector('input[name="typ"]:checked');
    return r ? r.value : 'abholung';
  }

  /* Uhrzeiten für heute ---------------------------------------------------- */
  function berlin() {
    var p = {};
    new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date())
      .forEach(function (x) {
        p[x.type] = x.value;
      });
    var tage = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
    return { tag: tage[p.weekday.replace('.', '')], min: Number(p.hour) * 60 + Number(p.minute) };
  }
  function minuten(t) {
    var a = t.split(':');
    return Number(a[0]) * 60 + Number(a[1]);
  }
  function hhmm(m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function zeiten() {
    var jetzt = berlin();
    var slots = (CFG.oeffnung || {})[jetzt.tag] || [];
    var frueh = jetzt.min + (B.vorlaufMinuten || 30);
    var out = [];
    var sofort = false;
    slots.forEach(function (s) {
      var von = minuten(s[0]);
      var bis = minuten(s[1]) - 15;
      if (frueh >= von && frueh <= bis) sofort = true;
      for (var m = Math.ceil(Math.max(von, frueh) / 15) * 15; m <= bis; m += 15) out.push(hhmm(m));
    });
    return { sofort: sofort, liste: out };
  }
  function zeitAuswahl() {
    var sel = form.querySelector('[data-order-zeit]');
    var z = zeiten();
    var alt = sel.value;
    sel.innerHTML =
      (z.sofort ? '<option value="">So schnell wie möglich</option>' : '') +
      z.liste.map(function (t) {
        return '<option value="' + t + '">Heute ' + t + ' Uhr</option>';
      }).join('');
    if (alt) sel.value = alt;
    return z.sofort || z.liste.length;
  }

  /* Karte ------------------------------------------------------------------ */
  function renderKarte() {
    var gruppen = [];
    karte.forEach(function (g) {
      var gr = gruppen.filter(function (x) {
        return x.titel === g.kategorie;
      })[0];
      if (!gr) gruppen.push((gr = { titel: g.kategorie || 'Weitere Gerichte', gerichte: [] }));
      gr.gerichte.push(g);
    });
    cats.innerHTML = gruppen.map(function (gr) {
      return '<a href="#' + slug(gr.titel) + '">' + esc(gr.titel) + '</a>';
    }).join('');
    menuBox.innerHTML = gruppen
      .map(function (gr) {
        return (
          '<section class="order-section" id="' + slug(gr.titel) + '"><h2>' + esc(gr.titel) + '</h2><ul class="order-list">' +
          gr.gerichte
            .map(function (g) {
              return (
                '<li class="order-item"><div><h3>' + esc(g.name) + '</h3>' + (g.beschreibung ? '<p>' + esc(g.beschreibung) + '</p>' : '') + '</div>' +
                '<span class="price">' + euro(g.preis) + '</span>' +
                '<button type="button" class="icon-btn add-btn" data-add="' + esc(g.id) + '" aria-label="' + esc(g.name) + ' in den Warenkorb">' +
                '<svg class="icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>' +
                '<span class="add-count" data-count="' + esc(g.id) + '"></span></button></li>'
              );
            })
            .join('') +
          '</ul></section>'
        );
      })
      .join('');
  }

  /* Warenkorb -------------------------------------------------------------- */
  function nachId(id) {
    return karte.filter(function (g) {
      return g.id === id;
    })[0];
  }
  function speichern() {
    try {
      localStorage.setItem(KEY, JSON.stringify(korb));
    } catch (e) {}
  }
  function summen() {
    var zw = 0;
    var n = 0;
    Object.keys(korb).forEach(function (id) {
      var g = nachId(id);
      if (!g) return;
      zw += g.preis * korb[id];
      n += korb[id];
    });
    var lief = typ() === 'lieferung' ? B.liefergebuehr || 0 : 0;
    return { zw: zw, lief: lief, gesamt: zw + lief, n: n };
  }
  function renderKorb() {
    Object.keys(korb).forEach(function (id) {
      if (!nachId(id) || korb[id] < 1) delete korb[id];
    });
    speichern();
    var ids = Object.keys(korb);
    listEl.innerHTML = ids
      .map(function (id) {
        var g = nachId(id);
        return (
          '<li><span class="cart-name">' + esc(g.name) + '</span>' +
          '<span class="stepper"><button type="button" class="icon-btn" data-minus="' + esc(id) + '" aria-label="Eins weniger ' + esc(g.name) + '">−</button>' +
          '<span aria-live="polite">' + korb[id] + '</span>' +
          '<button type="button" class="icon-btn" data-add="' + esc(id) + '" aria-label="Eins mehr ' + esc(g.name) + '">+</button></span>' +
          '<span class="price">' + euro(g.preis * korb[id]) + '</span></li>'
        );
      })
      .join('');
    root.querySelectorAll('[data-count]').forEach(function (el) {
      var n = korb[el.getAttribute('data-count')] || 0;
      el.textContent = n ? n : '';
      el.closest('.add-btn').classList.toggle('has-count', !!n);
    });
    var s = summen();
    root.querySelector('[data-cart-empty]').hidden = !!ids.length;
    root.querySelector('[data-cart-sum]').hidden = !ids.length;
    form.hidden = !ids.length;
    root.querySelector('[data-sum-zwischen]').textContent = euro(s.zw);
    root.querySelector('[data-sum-liefer]').textContent = euro(s.lief);
    root.querySelector('[data-sum-liefer-row]').hidden = typ() !== 'lieferung';
    root.querySelector('[data-sum-gesamt]').textContent = euro(s.gesamt);
    var hinweis = '';
    if (typ() === 'lieferung') {
      hinweis = 'Lieferung ab ' + euro(B.mindestbestellwert) + (B.plz.length ? ' in die PLZ ' + B.plz.join(', ') : '') + '.';
      if (ids.length && s.zw < B.mindestbestellwert) hinweis = 'Noch ' + euro(B.mindestbestellwert - s.zw) + ' bis zum Mindestbestellwert für Lieferungen.';
    }
    root.querySelector('[data-cart-hinweis]').textContent = zu || hinweis;
    if (bar) {
      bar.hidden = !ids.length;
      bar.querySelector('[data-cart-bar-text]').textContent = s.n + (s.n === 1 ? ' Gericht' : ' Gerichte') + ' · ' + euro(s.gesamt);
    }
  }

  root.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    var minus = e.target.closest('[data-minus]');
    if (add) {
      var id = add.getAttribute('data-add');
      korb[id] = Math.min(20, (korb[id] || 0) + 1);
      renderKorb();
      if (add.classList.contains('add-btn')) {
        add.classList.remove('pop');
        void add.offsetWidth;
        add.classList.add('pop');
      }
    }
    if (minus) {
      var mid = minus.getAttribute('data-minus');
      korb[mid] = (korb[mid] || 0) - 1;
      renderKorb();
    }
  });

  /* Abholen oder Liefern --------------------------------------------------- */
  function typWechsel() {
    var lief = typ() === 'lieferung';
    form.querySelector('[data-adresse]').hidden = !lief;
    ['strasse', 'plz'].forEach(function (n) {
      form.querySelector('[name="' + n + '"]').required = lief;
    });
    renderKorb();
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'typ') typWechsel();
  });

  /* Absenden --------------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = form.querySelector('[data-form-error]');
    err.classList.remove('is-visible');
    function fehler(msg) {
      err.querySelector('span').textContent = msg;
      err.classList.add('is-visible');
    }
    if (!window.siteValidate(form)) return;
    var lief = typ() === 'lieferung';
    var f = form.elements;
    var plz = f.plz.value.trim();
    if (lief && B.plz.length && B.plz.indexOf(plz) === -1) {
      var feld = f.plz.closest('.field');
      feld.classList.add('is-invalid');
      feld.querySelector('.field-error').textContent = 'In diese PLZ liefern wir leider nicht. Gern zur Abholung.';
      f.plz.focus();
      return;
    }
    var s = summen();
    if (lief && s.zw < B.mindestbestellwert) return fehler('Der Mindestbestellwert für Lieferungen ist ' + euro(B.mindestbestellwert) + '.');
    if (!zeitAuswahl()) return fehler('Heute nehmen wir keine Bestellungen mehr an. Rufen Sie uns gern an.');

    var btn = form.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    var payload = {
      action: 'bestellung', typ: typ(), name: f.name.value, telefon: f.telefon.value, email: f.email.value,
      strasse: lief ? f.strasse.value : '', plz: lief ? plz : '', ort: lief ? f.ort.value : '',
      wunschzeit: f.wunschzeit.value, bemerkung: f.bemerkung.value, datenschutz: 'ja',
      'bot-field': f['bot-field'].value, t0: f.t0.value,
      positionen: Object.keys(korb).map(function (id) {
        return { id: id, menge: korb[id] };
      }),
    };
    window
      .siteSend(form, payload)
      .then(function () {
        korb = {};
        speichern();
        var card = root.querySelector('[data-cart]');
        card.innerHTML = document.getElementById('order-success').innerHTML;
        if (bar) bar.hidden = true;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.querySelector('.success').focus({ preventScroll: true });
        if (window.siteTrack) window.siteTrack('bestellung', { value: s.gesamt, currency: 'EUR' });
      })
      .catch(function (x) {
        if (zu) return;
        fehler(x.message || 'Das hat leider nicht geklappt. Bitte rufen Sie uns an.');
      })
      .then(function () {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      });
  });

  /* Start ------------------------------------------------------------------ */
  if (!CFG.endpoint) return offline();
  window.siteLive().then(function (d) {
    if (!d || !d.bestellung || !d.bestellung.aktiv) return offline();
    B = d.bestellung;
    karte = (d.karte || []).filter(function (g) {
      return g.bestellbar;
    });
    if (!karte.length) return offline();
    // Nur die angebotenen Arten zeigen.
    var radios = form.querySelectorAll('input[name="typ"]');
    radios.forEach(function (r) {
      var an = r.value === 'lieferung' ? B.lieferung : B.abholung;
      r.closest('.chip').hidden = !an;
      if (!an && r.checked) r.checked = false;
    });
    if (!form.querySelector('input[name="typ"]:checked')) {
      var erste = [].filter.call(radios, function (r) {
        return !r.closest('.chip').hidden;
      })[0];
      if (!erste) return offline();
      erste.checked = true;
    }
    var heute = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
    renderKarte();
    typWechsel();
    if ((d.geschlossen || []).indexOf(heute) !== -1 || !zeitAuswahl()) {
      zu = 'Heute nehmen wir keine Bestellungen mehr an. Stöbern Sie gern, bestellen können Sie während unserer Öffnungszeiten.';
      form.querySelector('button[type="submit"]').disabled = true;
      renderKorb();
    }
  });
})();
