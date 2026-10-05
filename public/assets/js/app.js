// Inhaber-App des Il Pomodoro. Spricht über POST (JSON als text/plain) mit dem Apps Script; Anmeldung per
// PIN, danach ein Sitzungsschlüssel, der 6 Stunden gilt. Neue Bestellungen und Reservierungen kommen
// alle 20 Sekunden herein, mit Ton.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var SPEICHER = 'ilpomodoro.app';
  var $ = function (s, el) {
    return (el || document).querySelector(s);
  };
  var $$ = function (s, el) {
    return [].slice.call((el || document).querySelectorAll(s));
  };
  var sitzung = lesen();
  var st = {
    view: 'heute',
    datum: '',
    heute: '',
    einstellungen: {},
    bestFilter: 'aktiv',
    bekannt: null, // IDs schon gesehener Bestellungen und Anfragen
    karte: [],
    woche: [],
    karteGeladen: false,
    dirty: false,
    ton: true,
    timer: null,
  };

  /* Hilfen ----------------------------------------------------------------- */
  function lesen() {
    try {
      return JSON.parse(localStorage.getItem(SPEICHER) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function merken() {
    try {
      localStorage.setItem(SPEICHER, JSON.stringify(sitzung));
    } catch (e) {}
  }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ic(n) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
  }
  function euro(n) {
    return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
  }
  function heuteIso() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  }
  function plusTage(iso, n) {
    var d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function datumLang(iso) {
    return new Date(iso + 'T12:00:00Z').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  }
  function uhr(isoZeit) {
    var d = new Date(isoZeit);
    return isNaN(d) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  }
  var toastTimer;
  function toast(text, fehler) {
    var t = $('[data-toast]');
    t.textContent = text;
    t.classList.toggle('is-error', !!fehler);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.hidden = true;
    }, fehler ? 5000 : 2500);
  }

  function api(action, daten) {
    var body = Object.assign({ action: action }, daten || {});
    body.token = sitzung.token;
    return fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        $('[data-live]').classList.remove('is-off');
        if (res && res.login) {
          abmelden();
          throw new Error(res.message || 'Bitte neu anmelden.');
        }
        if (!res || !res.ok) {
          var e = new Error((res && res.message) || 'Das hat nicht geklappt.');
          e.res = res;
          throw e;
        }
        return res;
      }, function (e) {
        $('[data-live]').classList.add('is-off');
        throw new Error('Keine Verbindung. Bitte Internet prüfen.');
      });
  }
  function fehler(e) {
    toast(e.message || String(e), true);
  }

  /* Ton -------------------------------------------------------------------- */
  var audio = null;
  function tonEntsperren() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) {}
  }
  function klingeln() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (!st.ton || !audio) return;
    [880, 1175, 1568].forEach(function (f, i) {
      var o = audio.createOscillator();
      var g = audio.createGain();
      var t = audio.currentTime + i * 0.18;
      o.frequency.value = f;
      o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
  }

  /* Anmeldung -------------------------------------------------------------- */
  function zeigeLogin() {
    $('[data-login]').hidden = false;
    $('[data-shell]').hidden = true;
    clearInterval(st.timer);
    if (!CFG.endpoint) {
      $('[data-login-setup]').hidden = false;
      $('[data-login-form] button').disabled = true;
    }
    setTimeout(function () {
      $('#pin').focus();
    }, 50);
  }
  function abmelden() {
    sitzung = {};
    merken();
    zeigeLogin();
  }
  $('[data-login-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    tonEntsperren();
    var err = $('[data-login-error]');
    var btn = this.querySelector('button');
    err.classList.remove('is-visible');
    btn.setAttribute('aria-busy', 'true');
    api('adminLogin', { pin: $('#pin').value })
      .then(function (res) {
        sitzung = { token: res.token };
        merken();
        $('#pin').value = '';
        start();
      })
      .catch(function (x) {
        err.querySelector('span').textContent = x.message;
        err.classList.add('is-visible');
      })
      .then(function () {
        btn.removeAttribute('aria-busy');
      });
  });
  $('[data-logout]').addEventListener('click', abmelden);

  /* Navigation ------------------------------------------------------------- */
  function zeige(view) {
    if (st.dirty && st.view === 'karte' && view !== 'karte' && !confirm('Änderungen an der Karte verwerfen?')) return;
    if (view !== 'karte') st.dirty = false;
    st.view = view;
    $$('[data-view]').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== view;
    });
    $$('[data-tab]').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-tab') === view ? 'page' : 'false');
    });
    window.scrollTo(0, 0);
    laden();
    try {
      history.replaceState(null, '', '#' + view);
    } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-goto]');
    if (t) zeige(t.getAttribute('data-tab') || t.getAttribute('data-goto'));
    var close = e.target.closest('[data-close]');
    if (close) close.closest('dialog').close();
  });

  function laden() {
    if (st.view === 'heute') return uebersicht();
    if (st.view === 'bestellungen') return bestellungen();
    if (st.view === 'reservierungen') return reservierungen();
    if (st.view === 'karte' && !st.karteGeladen) return karteLaden();
    if (st.view === 'einstellungen') return einstellungenLaden();
  }

  /* Übersicht und Abfrage im Hintergrund ----------------------------------- */
  function uebersicht(still) {
    return api('adminUebersicht', { datum: heuteIso() })
      .then(function (res) {
        st.heute = res.heute;
        st.einstellungen = res.einstellungen;
        einstellungenZeigen();
        var neu = res.bestellungen.filter(function (b) {
          return b.status === 'neu';
        });
        var aktiveRes = res.reservierungen.filter(function (r) {
          return r.status !== 'storniert' && r.status !== 'abgelehnt';
        });
        // Neues seit der letzten Abfrage? Dann klingeln.
        var ids = neu.map(function (b) {
          return b.id;
        }).concat(res.angefragt.map(function (r) {
          return r.id;
        }));
        if (st.bekannt) {
          var frisch = ids.filter(function (id) {
            return st.bekannt.indexOf(id) === -1;
          });
          if (frisch.length) {
            klingeln();
            toast(frisch.length === 1 ? 'Neu: 1 Eingang' : 'Neu: ' + frisch.length + ' Eingänge');
            if (st.view === 'bestellungen') bestellungen();
          }
        }
        st.bekannt = ids;
        badge('bestellungen', neu.length);
        badge('reservierungen', res.angefragt.length);
        document.title = (neu.length ? '(' + neu.length + ') ' : '') + 'Inhaber-App | Il Pomodoro';
        if (still && st.view !== 'heute') return;

        var stunde = Number(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false }).format(new Date()));
        $('[data-gruss]').textContent = stunde < 12 ? 'Buongiorno' : stunde < 17 ? 'Buon pomeriggio' : 'Buonasera';
        $('[data-heute-datum]').textContent = datumLang(res.heute);
        $('[data-kpi="bestellungen"]').textContent = neu.length;
        $('[data-kpi="gaeste"]').textContent = aktiveRes.reduce(function (s, r) {
          return s + r.personen;
        }, 0);
        $('[data-kpi="anfragen"]').textContent = res.angefragt.length;
        $('[data-kpi="plaetze"]').textContent = res.einstellungen.kapazitaet;
        $('[data-titel-neu]').hidden = !neu.length;
        $('[data-heute-bestellungen]').innerHTML = neu.map(bestellKarte).join('');
        $('[data-titel-anfragen]').hidden = !res.angefragt.length;
        $('[data-heute-anfragen]').innerHTML = res.angefragt.map(function (r) {
          return resKarte(r, true);
        }).join('');
        $('[data-heute-res]').innerHTML = aktiveRes.length
          ? aktiveRes.map(function (r) {
              return resKarte(r);
            }).join('')
          : '<p class="leer">Heute noch keine Reservierungen.</p>';
      })
      .catch(function (e) {
        if (!still) fehler(e);
      });
  }
  function badge(tab, n) {
    var b = $('[data-badge="' + tab + '"]');
    b.textContent = n;
    b.hidden = !n;
  }
  function abfragen() {
    clearInterval(st.timer);
    st.timer = setInterval(function () {
      if (document.visibilityState === 'visible' && sitzung.token) uebersicht(true);
    }, 20000);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && sitzung.token) uebersicht(true);
  });

  /* Bestellungen ----------------------------------------------------------- */
  var STATUS_TEXT = {
    neu: 'Neu', angenommen: 'Angenommen', 'in Zubereitung': 'In Zubereitung', unterwegs: 'Unterwegs',
    abholbereit: 'Abholbereit', abgeschlossen: 'Erledigt', abgelehnt: 'Abgelehnt',
  };
  function naechster(b) {
    if (b.status === 'angenommen') return ['in Zubereitung', 'chef-hat', 'In Zubereitung'];
    if (b.status === 'in Zubereitung') return b.typ === 'lieferung' ? ['unterwegs', 'moped', 'Losgefahren'] : ['abholbereit', 'storefront', 'Abholbereit'];
    if (b.status === 'unterwegs' || b.status === 'abholbereit') return ['abgeschlossen', 'check', 'Erledigt'];
    return null;
  }
  function bestellKarte(b) {
    var lief = b.typ === 'lieferung';
    var adresse = b.strasse + ', ' + b.plz + ' ' + b.ort;
    var weiter = naechster(b);
    var aktionen =
      b.status === 'neu'
        ? '<button class="btn btn-accent btn-lg" type="button" data-annehmen="' + esc(b.id) + '">' + ic('check') + 'Annehmen</button>' +
          '<button class="btn btn-ghost" type="button" data-best-status="abgelehnt" data-id="' + esc(b.id) + '">' + ic('x') + 'Ablehnen</button>'
        : weiter
          ? '<button class="btn btn-accent" type="button" data-best-status="' + weiter[0] + '" data-id="' + esc(b.id) + '">' + ic(weiter[1]) + weiter[2] + '</button>'
          : '';
    return (
      '<article class="card order is-' + esc(b.status.replace(' ', '-')) + '">' +
      '<div class="order-head"><span class="pill pill-' + (lief ? 'lief' : 'abh') + '">' + ic(lief ? 'moped' : 'storefront') + (lief ? 'Lieferung' : 'Abholung') + '</span>' +
      '<span class="pill pill-status">' + esc(STATUS_TEXT[b.status] || b.status) + '</span>' +
      '<span class="fine">Eingang ' + uhr(b.eingang) + '</span></div>' +
      '<div class="order-zeit">' + ic('clock') + (b.fertig_um ? 'Fertig um <strong>' + esc(b.fertig_um) + '</strong>' : b.wunschzeit ? 'Gewünscht <strong>' + esc(b.wunschzeit) + '</strong>' : '<strong>So schnell wie möglich</strong>') + '</div>' +
      '<ul class="order-pos">' + b.positionen.map(function (p) {
        return '<li><b>' + p.menge + '×</b><span>' + esc(p.name) + (p.notiz ? ' <em>' + esc(p.notiz) + '</em>' : '') + '</span><span>' + euro(p.preis * p.menge) + '</span></li>';
      }).join('') + (lief && b.liefergebuehr ? '<li class="fine"><b></b><span>Liefergebühr</span><span>' + euro(b.liefergebuehr) + '</span></li>' : '') + '</ul>' +
      '<div class="order-summe"><span>Summe (bar/Karte bei Übergabe)</span><strong>' + euro(b.summe) + '</strong></div>' +
      (b.bemerkung ? '<p class="order-notiz">' + ic('warning') + esc(b.bemerkung) + '</p>' : '') +
      '<div class="order-kunde"><strong>' + esc(b.name) + '</strong>' +
      '<a href="tel:' + esc(String(b.telefon).replace(/[^\d+]/g, '')) + '">' + ic('phone') + esc(b.telefon) + '</a>' +
      (lief ? '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(adresse) + '" target="_blank" rel="noopener">' + ic('map-pin') + esc(adresse) + '</a>' : '') +
      '</div>' + (aktionen ? '<div class="order-aktionen">' + aktionen + '</div>' : '') + '</article>'
    );
  }
  function bestellungen() {
    return api('adminBestellungen', { alle: st.bestFilter === 'alle' })
      .then(function (res) {
        var liste = res.bestellungen.filter(function (b) {
          return st.bestFilter === 'alle' || ['abgeschlossen', 'abgelehnt'].indexOf(b.status) === -1;
        });
        $('[data-best-liste]').innerHTML = liste.length ? liste.map(bestellKarte).join('') : '<p class="leer">Gerade keine offenen Bestellungen.</p>';
      })
      .catch(fehler);
  }
  $$('[data-best-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.bestFilter = b.getAttribute('data-best-filter');
      $$('[data-best-filter]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      bestellungen();
    });
  });

  var annehmenId = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-annehmen]');
    if (a) {
      annehmenId = a.getAttribute('data-annehmen');
      $('[data-annehmen-info]').textContent = 'Wählen Sie, in wie vielen Minuten die Bestellung fertig ist.';
      $('[data-annehmen-dialog]').showModal();
    }
    var m = e.target.closest('[data-minuten]');
    if (m && annehmenId) {
      $('[data-annehmen-dialog]').close();
      setzeBestellung(annehmenId, 'angenommen', { minuten: Number(m.getAttribute('data-minuten')) });
      annehmenId = null;
    }
    var s = e.target.closest('[data-best-status]');
    if (s) {
      var status = s.getAttribute('data-best-status');
      var extra = {};
      if (status === 'abgelehnt') {
        var grund = prompt('Bestellung ablehnen? Der Gast bekommt eine E-Mail. Optional einen Grund angeben:', '');
        if (grund === null) return;
        extra.grund = grund;
      }
      setzeBestellung(s.getAttribute('data-id'), status, extra);
    }
  });
  function setzeBestellung(id, status, extra) {
    api('adminBestellungStatus', Object.assign({ id: id, status: status }, extra))
      .then(function (res) {
        toast(status === 'angenommen' ? 'Angenommen, fertig um ' + res.fertig_um + ' Uhr' : 'Gespeichert');
        laden();
        if (st.view !== 'heute') uebersicht(true);
      })
      .catch(fehler);
  }

  /* Reservierungen --------------------------------------------------------- */
  var RES_TEXT = { bestaetigt: 'Bestätigt', angefragt: 'Anfrage', storniert: 'Storniert', abgelehnt: 'Abgelehnt', erschienen: 'Da', 'nicht erschienen': 'Nicht gekommen' };
  function resKarte(r, anfrage) {
    var aktionen = '';
    if (r.status === 'angefragt') {
      aktionen = '<button class="btn btn-accent" type="button" data-res-status="bestaetigt" data-id="' + esc(r.id) + '">' + ic('check') + 'Bestätigen</button>' +
        '<button class="btn btn-ghost" type="button" data-res-status="abgelehnt" data-id="' + esc(r.id) + '">' + ic('x') + 'Absagen</button>';
    } else if (r.status === 'bestaetigt') {
      aktionen = '<button class="btn btn-ghost btn-sm" type="button" data-res-status="erschienen" data-id="' + esc(r.id) + '">Da</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-res-status="nicht erschienen" data-id="' + esc(r.id) + '">Nicht gekommen</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-res-status="storniert" data-id="' + esc(r.id) + '">Stornieren</button>';
    }
    return (
      '<article class="card res is-' + esc(r.status.replace(' ', '-')) + '">' +
      '<div class="res-zeit"><strong>' + esc(r.uhrzeit) + '</strong>' + (anfrage ? '<span class="fine">' + esc(datumLang(r.datum)) + '</span>' : '') + '</div>' +
      '<div class="res-info"><strong>' + esc(r.name) + '</strong><span class="res-meta">' + ic('users-three') + r.personen + ' P.' +
      (r.telefon ? ' · <a href="tel:' + esc(String(r.telefon).replace(/[^\d+]/g, '')) + '">' + esc(r.telefon) + '</a>' : '') +
      ' · <span class="pill pill-status">' + esc(RES_TEXT[r.status] || r.status) + '</span>' + (r.quelle === 'Telefon' ? ' · ' + ic('phone') : '') + '</span>' +
      (r.anmerkung ? '<span class="fine">' + esc(r.anmerkung) + '</span>' : '') + '</div>' +
      (aktionen ? '<div class="res-aktionen">' + aktionen + '</div>' : '') + '</article>'
    );
  }
  function reservierungen() {
    var feld = $('[data-res-datum]');
    if (!st.datum) st.datum = heuteIso();
    feld.value = st.datum;
    return api('adminUebersicht', { datum: st.datum })
      .then(function (res) {
        st.einstellungen = res.einstellungen;
        var liste = res.reservierungen;
        var aktiv = liste.filter(function (r) {
          return r.status !== 'storniert' && r.status !== 'abgelehnt';
        });
        $('[data-res-liste]').innerHTML =
          (res.angefragt.length && st.datum === res.heute
            ? '<h3 class="list-title">Zu bestätigen</h3>' + res.angefragt.map(function (r) {
                return resKarte(r, true);
              }).join('') + '<h3 class="list-title">' + esc(datumLang(st.datum)) + '</h3>'
            : '<h3 class="list-title">' + esc(datumLang(st.datum)) + '</h3>') +
          (liste.length ? liste.map(function (r) {
            return resKarte(r);
          }).join('') : '<p class="leer">Keine Reservierungen an diesem Tag.</p>');
        auslastung(res.belegung, aktiv);
      })
      .catch(fehler);
  }
  function auslastung(b, aktiv) {
    var box = $('[data-auslastung]');
    var zeiten = Object.keys((b && b.belegt) || {});
    var gaeste = aktiv.reduce(function (s, r) {
      return s + r.personen;
    }, 0);
    $('[data-auslastung-info]').textContent = gaeste + ' Gäste · ' + (b.kapazitaet || 0) + ' Plätze online';
    if (!zeiten.length) {
      box.innerHTML = '<p class="leer">Ruhetag.</p>';
      return;
    }
    box.innerHTML = zeiten
      .filter(function (t, i) {
        return i % 2 === 0; // halbstündlich reicht für den Überblick
      })
      .map(function (t) {
        var n = b.belegt[t] || 0;
        var p = b.kapazitaet ? Math.min(100, Math.round((n / b.kapazitaet) * 100)) : 0;
        return '<div class="bar' + (p >= 100 ? ' is-voll' : p >= 75 ? ' is-knapp' : '') + '"><span>' + t + '</span><i><b data-w="' + p + '"></b></i><span>' + n + '/' + b.kapazitaet + '</span></div>';
      })
      .join('');
    // Breite per CSSOM setzen (die Sicherheitsregeln der Seite erlauben keine style-Attribute).
    $$('[data-w]', box).forEach(function (el) {
      el.style.width = el.getAttribute('data-w') + '%';
    });
  }
  $('[data-res-datum]').addEventListener('change', function () {
    if (this.value) {
      st.datum = this.value;
      reservierungen();
    }
  });
  $$('[data-tag-schritt]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.datum = plusTage(st.datum || heuteIso(), Number(b.getAttribute('data-tag-schritt')));
      reservierungen();
    });
  });
  $('[data-tag-heute]').addEventListener('click', function () {
    st.datum = heuteIso();
    reservierungen();
  });
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-res-status]');
    if (!s) return;
    var status = s.getAttribute('data-res-status');
    if ((status === 'storniert' || status === 'abgelehnt') && !confirm(status === 'storniert' ? 'Reservierung stornieren?' : 'Anfrage absagen? Der Gast bekommt eine E-Mail.')) return;
    api('adminReservierungStatus', { id: s.getAttribute('data-id'), status: status })
      .then(function () {
        toast('Gespeichert');
        laden();
      })
      .catch(fehler);
  });

  /* Telefonische Reservierung ---------------------------------------------- */
  var resDialog = $('[data-res-dialog]');
  var resForm = $('[data-res-form]');
  var belegtCache = {};
  function zeitenFuer(iso) {
    var tag = new Date(iso + 'T12:00:00Z').getUTCDay();
    var R = CFG.reservierung || {};
    var out = [];
    ((CFG.oeffnung || {})[tag] || []).forEach(function (s) {
      var a = s[0].split(':');
      var b = s[1].split(':');
      for (var m = Number(a[0]) * 60 + Number(a[1]); m <= Number(b[0]) * 60 + Number(b[1]) - 30; m += R.rasterMinuten || 15) {
        out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
      }
    });
    return out;
  }
  function zeitOptionen() {
    var iso = resForm.datum.value;
    var sel = resForm.uhrzeit;
    var alt = sel.value;
    var zeiten = zeitenFuer(iso);
    var b = belegtCache[iso];
    sel.innerHTML = zeiten.length
      ? zeiten.map(function (t) {
          var frei = b && b.belegt[t] !== undefined ? b.kapazitaet - b.belegt[t] : null;
          return '<option value="' + t + '">' + t + ' Uhr' + (frei !== null ? ' · ' + (frei > 0 ? frei + ' frei' : 'voll') : '') + '</option>';
        }).join('')
      : '<option value="">Ruhetag</option>';
    if (alt && zeiten.indexOf(alt) !== -1) sel.value = alt;
    else if (zeiten.indexOf('19:00') !== -1) sel.value = '19:00';
    if (!b && iso && zeiten.length) {
      fetch(CFG.endpoint + '?action=belegung&datum=' + iso)
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (res.ok) {
            belegtCache[iso] = res;
            if (resForm.datum.value === iso) zeitOptionen();
          }
        })
        .catch(function () {});
    }
  }
  $$('[data-neue-res]').forEach(function (b) {
    b.addEventListener('click', function () {
      resForm.reset();
      belegtCache = {};
      resForm.datum.value = st.view === 'reservierungen' && st.datum ? st.datum : heuteIso();
      resForm.personen.value = 2;
      $('[data-res-error]').classList.remove('is-visible');
      zeitOptionen();
      resDialog.showModal();
      setTimeout(function () {
        resForm.elements.name.focus();
      }, 50);
    });
  });
  resForm.datum.addEventListener('change', zeitOptionen);
  $$('[data-personen]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = resForm.personen;
      f.value = Math.max(1, Math.min(200, (Number(f.value) || 0) + Number(b.getAttribute('data-personen'))));
    });
  });
  function resSenden(trotzVoll) {
    var f = resForm.elements;
    var err = $('[data-res-error]');
    err.classList.remove('is-visible');
    var btn = resForm.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');
    api('adminReservierungNeu', {
      datum: f.datum.value, uhrzeit: f.uhrzeit.value, personen: f.personen.value, name: f.name.value,
      telefon: f.telefon.value, email: f.email.value, anmerkung: f.anmerkung.value, trotzVoll: !!trotzVoll,
    })
      .then(function () {
        resDialog.close();
        toast('Eingetragen. Die Plätze sind auf der Website sofort vergeben.');
        st.datum = f.datum.value;
        laden();
      })
      .catch(function (x) {
        if (x.res && x.res.voll && confirm(x.message)) return resSenden(true);
        err.querySelector('span').textContent = x.message;
        err.classList.add('is-visible');
      })
      .then(function () {
        btn.removeAttribute('aria-busy');
      });
  }
  resForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!resForm.elements.name.value.trim() || !resForm.uhrzeit.value) {
      $('[data-res-error] span').textContent = 'Bitte Name und Uhrzeit angeben.';
      $('[data-res-error]').classList.add('is-visible');
      return;
    }
    resSenden(false);
  });

  /* Karte ------------------------------------------------------------------ */
  function karteLaden() {
    return api('adminKarte')
      .then(function (res) {
        st.karte = res.karte.map(function (g) {
          return {
            id: String(g.id), kategorie: g.kategorie, name: g.name, beschreibung: g.beschreibung, preis: g.preis,
            tags: String(g.tags || '').split(/\s*,\s*/).filter(String), aktiv: g.aktiv !== 'nein', bestellbar: g.bestellbar !== 'nein',
          };
        });
        st.woche = res.wochenkarte.map(function (w) {
          return { kategorie: w.kategorie, gericht: w.gericht, beschreibung: w.beschreibung, preis: w.preis };
        });
        $('[data-wk-hinweis]').value = res.hinweis || '';
        st.karteGeladen = true;
        sauber();
        karteZeigen();
        wocheZeigen();
      })
      .catch(fehler);
  }
  function schmutzig() {
    st.dirty = true;
    $('[data-savebar]').hidden = false;
  }
  function sauber() {
    st.dirty = false;
    $('[data-savebar]').hidden = true;
  }
  function kategorien() {
    var k = [];
    st.karte.forEach(function (g) {
      if (g.kategorie && k.indexOf(g.kategorie) === -1) k.push(g.kategorie);
    });
    return k;
  }
  function karteZeigen() {
    var box = $('[data-karte-liste]');
    box.innerHTML = kategorien()
      .map(function (kat) {
        return (
          '<h3 class="list-title">' + esc(kat) + '</h3><div class="card dish-list">' +
          st.karte
            .map(function (g, i) {
              if (g.kategorie !== kat) return '';
              return (
                '<div class="dish-row' + (g.aktiv ? '' : ' is-aus') + '">' +
                '<button type="button" class="dish-name" data-gericht="' + i + '"><strong>' + esc(g.name) + '</strong><span class="fine">' + (g.aktiv ? esc(g.beschreibung || 'Beschreibung hinzufügen') : 'Auf der Website ausgeblendet') + '</span></button>' +
                '<label class="preis-feld"><span class="sr-only">Preis ' + esc(g.name) + '</span><input class="input" type="number" step="0.1" min="0" inputmode="decimal" placeholder="Preis" value="' + (g.preis === '' || g.preis === undefined ? '' : esc(g.preis)) + '" data-preis="' + i + '"><span>€</span></label>' +
                '<label class="mini-switch" title="Online bestellbar"><span class="sr-only">' + esc(g.name) + ' online bestellbar</span><input type="checkbox" class="switch" data-bestellbar="' + i + '"' + (g.bestellbar ? ' checked' : '') + '></label>' +
                '<span class="reihe"><button type="button" class="icon-btn" data-hoch="' + i + '" aria-label="Nach oben">' + ic('arrow-up') + '</button><button type="button" class="icon-btn" data-runter="' + i + '" aria-label="Nach unten">' + ic('arrow-down') + '</button></span>' +
                '</div>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('') || '<p class="leer">Noch keine Gerichte.</p>';
    $('[data-kategorien]').innerHTML = kategorien().map(function (k) {
      return '<option value="' + esc(k) + '">';
    }).join('');
  }
  $('[data-karte-liste]').addEventListener('input', function (e) {
    var i = e.target.getAttribute('data-preis');
    if (i !== null) {
      st.karte[i].preis = e.target.value;
      schmutzig();
    }
  });
  $('[data-karte-liste]').addEventListener('change', function (e) {
    var i = e.target.getAttribute('data-bestellbar');
    if (i !== null) {
      st.karte[i].bestellbar = e.target.checked;
      schmutzig();
    }
  });
  function verschieben(i, richtung) {
    var g = st.karte[i];
    var j = i + richtung;
    while (j >= 0 && j < st.karte.length && st.karte[j].kategorie !== g.kategorie) j += richtung;
    if (j < 0 || j >= st.karte.length) return;
    st.karte[i] = st.karte[j];
    st.karte[j] = g;
    schmutzig();
    karteZeigen();
  }
  var gDialog = $('[data-gericht-dialog]');
  var gForm = $('[data-gericht-form]');
  var gIndex = -1;
  function gerichtOeffnen(i) {
    gIndex = i;
    var g = i >= 0 ? st.karte[i] : { kategorie: kategorien()[0] || '', name: '', beschreibung: '', preis: '', tags: [], aktiv: true, bestellbar: true };
    var f = gForm.elements;
    f.name.value = g.name;
    f.preis.value = g.preis;
    f.kategorie.value = g.kategorie;
    f.beschreibung.value = g.beschreibung;
    $$('input[name="tag"]', gForm).forEach(function (c) {
      c.checked = g.tags.indexOf(c.value) !== -1;
    });
    f.aktiv.checked = g.aktiv;
    f.bestellbar.checked = g.bestellbar;
    $('[data-gericht-loeschen]').hidden = i < 0;
    $('#gericht-title').textContent = i >= 0 ? 'Gericht bearbeiten' : 'Neues Gericht';
    gDialog.showModal();
  }
  $('[data-karte-liste]').addEventListener('click', function (e) {
    var t = e.target.closest('[data-gericht],[data-hoch],[data-runter]');
    if (!t) return;
    if (t.hasAttribute('data-gericht')) gerichtOeffnen(Number(t.getAttribute('data-gericht')));
    if (t.hasAttribute('data-hoch')) verschieben(Number(t.getAttribute('data-hoch')), -1);
    if (t.hasAttribute('data-runter')) verschieben(Number(t.getAttribute('data-runter')), 1);
  });
  $('[data-gericht-neu]').addEventListener('click', function () {
    gerichtOeffnen(-1);
  });
  gForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = gForm.elements;
    if (!f.name.value.trim() || !f.kategorie.value.trim()) return toast('Bitte Name und Kategorie angeben.', true);
    var g = {
      id: gIndex >= 0 ? st.karte[gIndex].id : '',
      name: f.name.value.trim(), preis: f.preis.value, kategorie: f.kategorie.value.trim(), beschreibung: f.beschreibung.value.trim(),
      tags: $$('input[name="tag"]:checked', gForm).map(function (c) {
        return c.value;
      }),
      aktiv: f.aktiv.checked, bestellbar: f.bestellbar.checked,
    };
    if (gIndex >= 0) st.karte[gIndex] = g;
    else {
      // Ans Ende der Kategorie setzen
      var letzte = -1;
      st.karte.forEach(function (x, i) {
        if (x.kategorie === g.kategorie) letzte = i;
      });
      st.karte.splice(letzte >= 0 ? letzte + 1 : st.karte.length, 0, g);
    }
    gDialog.close();
    schmutzig();
    karteZeigen();
  });
  $('[data-gericht-loeschen]').addEventListener('click', function () {
    if (gIndex < 0 || !confirm('„' + st.karte[gIndex].name + '“ löschen?')) return;
    st.karte.splice(gIndex, 1);
    gDialog.close();
    schmutzig();
    karteZeigen();
  });

  function wocheZeigen() {
    $('[data-wk-liste]').innerHTML = st.woche.length
      ? st.woche
          .map(function (w, i) {
            return (
              '<div class="card wk-row" data-wk="' + i + '">' +
              '<div class="form-row"><input class="input" aria-label="Kategorie oder Tag" placeholder="Kategorie, z. B. Pasta oder Montag" maxlength="40" data-f="kategorie" value="' + esc(w.kategorie) + '">' +
              '<input class="input" aria-label="Preis" placeholder="Preis, z. B. 12,90 €" maxlength="20" data-f="preis" value="' + esc(w.preis) + '"></div>' +
              '<input class="input" aria-label="Gericht" placeholder="Gericht" maxlength="80" data-f="gericht" value="' + esc(w.gericht) + '">' +
              '<input class="input" aria-label="Beschreibung" placeholder="Beschreibung (optional)" maxlength="200" data-f="beschreibung" value="' + esc(w.beschreibung) + '">' +
              '<button type="button" class="icon-btn" data-wk-weg="' + i + '" aria-label="Gericht entfernen">' + ic('trash') + '</button></div>'
            );
          })
          .join('')
      : '<p class="leer">Die Wochenkarte ist leer. Fügen Sie die Gerichte dieser Woche hinzu.</p>';
  }
  $('[data-wk-liste]').addEventListener('input', function (e) {
    var row = e.target.closest('[data-wk]');
    if (!row) return;
    st.woche[row.getAttribute('data-wk')][e.target.getAttribute('data-f')] = e.target.value;
    schmutzig();
  });
  $('[data-wk-liste]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wk-weg]');
    if (!b) return;
    st.woche.splice(Number(b.getAttribute('data-wk-weg')), 1);
    schmutzig();
    wocheZeigen();
  });
  $('[data-wk-hinweis]').addEventListener('input', schmutzig);
  $('[data-wk-neu]').addEventListener('click', function () {
    var letzte = st.woche[st.woche.length - 1];
    st.woche.push({ kategorie: letzte ? letzte.kategorie : '', gericht: '', beschreibung: '', preis: '' });
    schmutzig();
    wocheZeigen();
    var felder = $$('[data-wk-liste] [data-f="gericht"]');
    if (felder.length) felder[felder.length - 1].focus();
  });
  $('[data-wk-leeren]').addEventListener('click', function () {
    if (!st.woche.length || !confirm('Alle Gerichte der Wochenkarte entfernen?')) return;
    st.woche = [];
    schmutzig();
    wocheZeigen();
  });
  $$('[data-karte-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      var w = b.getAttribute('data-karte-tab') === 'woche';
      $$('[data-karte-tab]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      $('[data-karte-speise]').hidden = w;
      $('[data-karte-woche]').hidden = !w;
    });
  });
  $('[data-karte-speichern]').addEventListener('click', function () {
    var btn = this;
    btn.setAttribute('aria-busy', 'true');
    var karte = st.karte.map(function (g) {
      return { id: g.id, kategorie: g.kategorie, name: g.name, beschreibung: g.beschreibung, preis: g.preis, tags: g.tags.join(','), aktiv: g.aktiv, bestellbar: g.bestellbar };
    });
    var woche = st.woche.filter(function (w) {
      return String(w.gericht).trim();
    });
    api('adminKarteSpeichern', { karte: karte })
      .then(function () {
        return api('adminWochenkarteSpeichern', { hinweis: $('[data-wk-hinweis]').value, gerichte: woche });
      })
      .then(function () {
        toast('Gespeichert. In etwa einer Minute auf der Website.');
        st.karteGeladen = false;
        sauber();
        return karteLaden();
      })
      .catch(fehler)
      .then(function () {
        btn.removeAttribute('aria-busy');
      });
  });
  window.addEventListener('beforeunload', function (e) {
    if (st.dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* Einstellungen ---------------------------------------------------------- */
  function wahr(v) {
    return v === true || /^(ja|true|1|x)$/i.test(String(v).trim());
  }
  function einstellungenZeigen() {
    var e = st.einstellungen || {};
    $$('[data-setting]').forEach(function (f) {
      if (f === document.activeElement) return;
      var v = e[f.name];
      if (f.type === 'checkbox') f.checked = wahr(v);
      else f.value = v === undefined ? '' : v;
    });
    $$('[data-preset-wert]').forEach(function (b) {
      b.textContent = e[b.getAttribute('data-preset-wert')] || '';
    });
    var zu = String(e.geschlossen || '').split(/\s*,\s*/).filter(String).sort();
    $('[data-zu-liste]').innerHTML = zu.length
      ? zu.map(function (d) {
          return '<span class="chip-tag">' + esc(datumLang(d)) + '<button type="button" data-zu-weg="' + d + '" aria-label="' + esc(datumLang(d)) + ' entfernen">' + ic('x') + '</button></span>';
        }).join('')
      : '<span class="fine">Keine geschlossenen Tage eingetragen.</span>';
  }
  function einstellungenLaden() {
    texteLaden();
    bilderZeigen();
    return api('adminEinstellungen')
      .then(function (res) {
        st.einstellungen = res.einstellungen;
        einstellungenZeigen();
      })
      .catch(fehler);
  }
  var speicherTimer;
  function speichereEinstellungen(werte, sofort) {
    Object.assign(st.einstellungen, werte);
    einstellungenZeigen();
    clearTimeout(speicherTimer);
    $('[data-gespeichert]').textContent = 'Speichert …';
    speicherTimer = setTimeout(function () {
      api('adminEinstellungenSpeichern', { werte: werte })
        .then(function (res) {
          st.einstellungen = res.einstellungen;
          einstellungenZeigen();
          $('[data-gespeichert]').textContent = 'Gespeichert';
          toast('Gespeichert');
        })
        .catch(function (e) {
          $('[data-gespeichert]').textContent = '';
          fehler(e);
        });
    }, sofort ? 0 : 700);
  }
  document.addEventListener('change', function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute('data-setting')) return;
    var w = {};
    w[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    speichereEinstellungen(w, f.type === 'checkbox');
  });
  $$('[data-schritt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = $('#s-kapazitaet');
      f.value = Math.max(0, (Number(f.value) || 0) + Number(b.getAttribute('data-schritt')));
      speichereEinstellungen({ kapazitaet: f.value });
    });
  });
  $$('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var wert = st.einstellungen[b.getAttribute('data-preset')];
      if (wert) speichereEinstellungen({ kapazitaet: wert }, true);
    });
  });
  $('[data-zu-neu]').addEventListener('click', function () {
    var d = $('[data-zu-datum]').value;
    if (!d) return toast('Bitte zuerst einen Tag wählen.', true);
    var zu = String(st.einstellungen.geschlossen || '').split(/\s*,\s*/).filter(String);
    if (zu.indexOf(d) === -1) zu.push(d);
    // Vergangene Tage aufräumen
    var heute = heuteIso();
    speichereEinstellungen({ geschlossen: zu.filter(function (x) {
      return x >= heute;
    }).sort().join(',') }, true);
    $('[data-zu-datum]').value = '';
  });
  $('[data-zu-liste]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-zu-weg]');
    if (!b) return;
    var zu = String(st.einstellungen.geschlossen || '').split(/\s*,\s*/).filter(function (x) {
      return x && x !== b.getAttribute('data-zu-weg');
    });
    speichereEinstellungen({ geschlossen: zu.join(',') }, true);
  });

  // Texte
  var texte = $('[data-texte]');
  function texteLaden() {
    api('adminInhalte')
      .then(function (res) {
        ['ankuendigung', 'start_text', 'ueber_text'].forEach(function (k) {
          texte.elements[k].value = res.inhalte[k] || '';
        });
        st.inhalte = res.inhalte;
        bilderZeigen();
      })
      .catch(fehler);
  }
  texte.addEventListener('submit', function (e) {
    e.preventDefault();
    var w = {};
    ['ankuendigung', 'start_text', 'ueber_text'].forEach(function (k) {
      w[k] = texte.elements[k].value.trim();
    });
    api('adminInhalteSpeichern', { werte: w })
      .then(function () {
        toast('Texte gespeichert. In etwa einer Minute auf der Website.');
      })
      .catch(fehler);
  });

  // Bilder
  var BILDER = [
    ['holzofen', 'Holzofen', 'Startseite oben, Über uns'],
    ['pizza-burrata', 'Pizza', 'Startseite'],
    ['gastraum', 'Gastraum', 'Startseite'],
    ['laterne', 'Laterne', 'Über uns oben'],
    ['eingang', 'Eingang', 'Galerie'],
    ['terrasse', 'Terrasse', 'Galerie'],
  ];
  function bilderZeigen() {
    var inh = st.inhalte || {};
    $('[data-bilder]').innerHTML = BILDER.map(function (b) {
      var src = inh['bild_' + b[0]] || '../assets/img/fotos/' + b[0] + '-800.jpg';
      return (
        '<label class="bild"><img src="' + esc(src) + '" alt="' + esc(b[1]) + '" loading="lazy">' +
        '<span><strong>' + esc(b[1]) + '</strong><span class="fine">' + esc(b[2]) + '</span></span>' +
        '<input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" data-bild="' + b[0] + '"></label>'
      );
    }).join('');
  }
  function verkleinern(datei) {
    return new Promise(function (ok, nein) {
      var img = new Image();
      img.onload = function () {
        var max = 1600;
        var f = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * f);
        c.height = Math.round(img.height * f);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () {
        nein(new Error('Das Bild konnte nicht gelesen werden.'));
      };
      img.src = URL.createObjectURL(datei);
    });
  }
  $('[data-bilder]').addEventListener('change', function (e) {
    var f = e.target;
    if (!f.files || !f.files[0]) return;
    var slot = f.getAttribute('data-bild');
    var box = f.closest('.bild');
    box.classList.add('is-laden');
    verkleinern(f.files[0])
      .then(function (daten) {
        return api('adminBild', { slot: slot, daten: daten });
      })
      .then(function (res) {
        st.inhalte = st.inhalte || {};
        st.inhalte['bild_' + slot] = res.url;
        bilderZeigen();
        toast('Bild gespeichert. In etwa einer Minute auf der Website.');
      })
      .catch(fehler)
      .then(function () {
        box.classList.remove('is-laden');
      });
  });

  // PIN
  $('[data-pin-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var pin = $('#neue-pin').value;
    if (!/^\d{4,8}$/.test(pin)) return toast('Die PIN braucht 4 bis 8 Ziffern.', true);
    api('adminPin', { pin: pin })
      .then(function () {
        $('#neue-pin').value = '';
        toast('PIN geändert. Bitte gut merken.');
      })
      .catch(fehler);
  });

  /* Ton, Farbmodus --------------------------------------------------------- */
  st.ton = sitzung.ton !== false;
  $('[data-sound]').setAttribute('aria-pressed', String(st.ton));
  $('[data-sound]').addEventListener('click', function () {
    tonEntsperren();
    st.ton = !st.ton;
    sitzung.ton = st.ton;
    merken();
    this.setAttribute('aria-pressed', String(st.ton));
    if (st.ton) klingeln();
    toast(st.ton ? 'Ton an' : 'Ton aus');
  });
  document.addEventListener('pointerdown', tonEntsperren, { once: true });
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dunkel = document.documentElement.getAttribute('data-theme') !== 'dark';
      document.documentElement.setAttribute('data-theme', dunkel ? 'dark' : 'light');
      try {
        localStorage.setItem('ilpomodoro.theme', dunkel ? 'dark' : 'light');
      } catch (e) {}
    });
  });
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) d.close(); // Klick neben das Fenster schließt
    });
  });

  /* Start ------------------------------------------------------------------ */
  function start() {
    $('[data-login]').hidden = true;
    $('[data-shell]').hidden = false;
    var ziel = location.hash.slice(1);
    zeige($('[data-view="' + ziel + '"]') ? ziel : 'heute');
    if (st.view !== 'heute') uebersicht(true);
    abfragen();
  }
  if (sitzung.token && CFG.endpoint) start();
  else zeigeLogin();
})();
