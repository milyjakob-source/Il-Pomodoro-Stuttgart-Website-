// Gemeinsames Verhalten aller Seiten: Menü, Farbmodus, Einblendungen, Öffnungsstatus,
// Cookie-Einwilligung, Statistik und das Absenden der Formulare.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  /* Farbmodus ------------------------------------------------------------- */
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    function label() {
      btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Hellen Modus einschalten' : 'Dunklen Modus einschalten');
    }
    label();
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      var apply = function () {
        root.dataset.theme = next;
        store('ilpomodoro.theme', next);
        label();
      };
      // Mit View Transitions blendet der ganze Bildschirm weich über statt hart umzuspringen.
      if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
      else apply();
    });
  });

  /* Menü auf kleinen Bildschirmen ----------------------------------------- */
  var nav = document.querySelector('[data-nav]');
  var menuBtn = document.querySelector('[data-menu-toggle]');
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('menu-is-open', open);
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    matchMedia('(min-width: 1024px)').addEventListener('change', function () {
      setMenu(false);
    });
  }

  /* Kopfzeile bekommt beim Scrollen eine Linie (ohne Scroll-Listener). ------ */
  var header = document.querySelector('[data-header]');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Einblenden beim Scrollen ---------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-clip');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  /* Google-Profil (Bewertungen und Fotos) über das Apps Script, einmal pro Sitzung. */
  var googlePromise = null;
  window.siteGoogle = function () {
    if (googlePromise) return googlePromise;
    if (!CFG.endpoint) return (googlePromise = Promise.resolve(null));
    try {
      var cached = JSON.parse(sessionStorage.getItem('ilpomodoro.google') || 'null');
      if (cached && Date.now() - cached.ts < 3600e3) return (googlePromise = Promise.resolve(cached.data));
    } catch (e) {}
    googlePromise = fetch(CFG.endpoint + '?action=google')
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (res && res.ok) {
          try {
            sessionStorage.setItem('ilpomodoro.google', JSON.stringify({ ts: Date.now(), data: res }));
          } catch (e) {}
        }
        return res;
      })
      .catch(function () {
        return null;
      });
    return googlePromise;
  };

  /* Fehlende Fotos: erst Fotos aus dem Google-Profil einsetzen, sonst ruhige Fläche mit Beschriftung. */
  var missingFigs = [];
  var fotoIndex = 0;
  function fillFromGoogle(fig) {
    window.siteGoogle().then(function (res) {
      var fotos = (res && res.fotos) || [];
      if (!fotos.length) return;
      // Jede Seite fängt an einer anderen Stelle an, damit nicht überall dieselben Bilder stehen.
      var start = (document.body.className.length * 7) % fotos.length;
      var f = fotos[(start + fotoIndex++) % fotos.length];
      var img = fig.querySelector('img');
      var src = fig.querySelector('source');
      if (src) src.remove();
      img.addEventListener('load', function () {
        fig.classList.remove('is-missing');
      }, { once: true });
      img.referrerPolicy = 'no-referrer';
      img.src = f.url;
      if (f.author && !fig.querySelector('.photo-credit')) {
        var credit = document.createElement(f.authorUrl ? 'a' : 'span');
        credit.className = 'photo-credit';
        credit.textContent = 'Foto: ' + f.author + ' / Google';
        if (f.authorUrl) {
          credit.href = f.authorUrl;
          credit.target = '_blank';
          credit.rel = 'noopener nofollow';
        }
        fig.appendChild(credit);
      }
    });
  }
  document.querySelectorAll('figure.media img').forEach(function (img) {
    var fig = img.closest('figure');
    function missing() {
      if (fig.classList.contains('is-missing')) return;
      fig.classList.add('is-missing');
      fig.setAttribute('data-label', img.alt || '');
      missingFigs.push(fig);
      fillFromGoogle(fig);
    }
    if (img.complete && img.naturalWidth === 0) missing();
    else img.addEventListener('error', missing, { once: true });
  });

  /* Öffnungsstatus -------------------------------------------------------- */
  function minutes(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function fmt(min) {
    var h = Math.floor(min / 60) % 24;
    var m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  // Zeit in Stuttgart, egal wo das Gerät gerade steht.
  function berlinNow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) {
      map[p.type] = p.value;
    });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[map.weekday], min: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
  }
  function openState() {
    var o = CFG.oeffnung;
    if (!o) return null;
    var now = berlinNow();
    var yesterday = (now.day + 6) % 7;
    // Nach Mitternacht zählt noch der Vortag (bis 01:00).
    var late = (o[yesterday] || []).filter(function (s) {
      return minutes(s[1]) > 1440 && now.min < minutes(s[1]) - 1440;
    });
    if (late.length) return { open: true, text: 'Jetzt geöffnet bis ' + fmt(minutes(late[0][1])) };
    var today = o[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      var from = minutes(today[i][0]);
      var to = minutes(today[i][1]);
      if (now.min >= from && now.min < to) return { open: true, text: 'Jetzt geöffnet bis ' + fmt(to) };
      if (now.min < from) return { open: false, text: 'Heute ab ' + today[i][0] + ' geöffnet' };
    }
    // Nächster Öffnungstag, Ruhetage überspringen.
    var tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    for (var d = 1; d <= 7; d++) {
      var next = o[(now.day + d) % 7] || [];
      if (next.length) {
        return { open: false, text: 'Geschlossen, ' + (d === 1 ? 'morgen' : tage[(now.day + d) % 7]) + ' ab ' + next[0][0] };
      }
    }
    return { open: false, text: 'Derzeit geschlossen' };
  }
  var state = openState();
  if (state) {
    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      el.textContent = state.text;
      el.setAttribute('data-open', String(state.open));
    });
  }
  var todayIdx = berlinNow().day;
  document.querySelectorAll('[data-days]').forEach(function (row) {
    if (row.getAttribute('data-days').split(',').indexOf(String(todayIdx)) !== -1) row.classList.add('is-today');
  });

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Mobile Leiste weicht dem Footer ---------------------------------------- */
  var bar = document.querySelector('[data-mobile-bar]');
  var footer = document.querySelector('.site-footer');
  if (bar && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }).observe(footer);
  }

  /* Einwilligung ----------------------------------------------------------- */
  var CONSENT_KEY = 'ilpomodoro.consent';
  var CONSENT_VERSION = 1;
  function readConsent() {
    try {
      var c = JSON.parse(store(CONSENT_KEY) || 'null');
      return c && c.v === CONSENT_VERSION ? c : null;
    } catch (e) {
      return null;
    }
  }
  function saveConsent(media, stats) {
    var c = { v: CONSENT_VERSION, media: !!media, stats: !!stats, ts: new Date().toISOString() };
    store(CONSENT_KEY, JSON.stringify(c));
    applyConsent(c);
    window.dispatchEvent(new CustomEvent('site:consent', { detail: c }));
    return c;
  }
  window.siteConsent = { read: readConsent, save: saveConsent };

  var banner = document.querySelector('[data-consent]');
  var form = banner && banner.querySelector('[data-consent-form]');
  function showBanner(withSettings) {
    if (!banner) return;
    var c = readConsent() || { media: false, stats: false };
    form.elements.media.checked = c.media;
    form.elements.stats.checked = c.stats;
    toggleSettings(!!withSettings);
    banner.hidden = false;
  }
  function hideBanner() {
    if (banner) banner.hidden = true;
  }
  function toggleSettings(open) {
    form.hidden = !open;
    banner.querySelector('[data-consent-settings]').hidden = open;
    banner.querySelector('[data-consent-save]').hidden = !open;
  }
  if (banner) {
    banner.querySelector('[data-consent-all]').addEventListener('click', function () {
      saveConsent(true, true);
      hideBanner();
    });
    banner.querySelector('[data-consent-necessary]').addEventListener('click', function () {
      saveConsent(false, false);
      hideBanner();
    });
    banner.querySelector('[data-consent-settings]').addEventListener('click', function () {
      toggleSettings(true);
    });
    banner.querySelector('[data-consent-save]').addEventListener('click', function () {
      saveConsent(form.elements.media.checked, form.elements.stats.checked);
      hideBanner();
    });
    document.querySelectorAll('[data-consent-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        showBanner(true);
      });
    });
    if (!readConsent()) showBanner(false);
  }

  /* Statistik (Google Analytics 4) nur nach Zustimmung --------------------- */
  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded || !CFG.ga4Id) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    window.gtag('js', new Date());
    window.gtag('config', CFG.ga4Id, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4Id);
    document.head.appendChild(s);
  }
  function applyConsent(c) {
    if (c && c.stats) loadAnalytics();
    else if (gaLoaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    if (c && c.media) document.querySelectorAll('[data-map]').forEach(loadMap);
  }
  window.siteTrack = function (name, params) {
    if (window.gtag && gaLoaded) window.gtag('event', name, params || {});
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) window.siteTrack(el.getAttribute('data-track'), { link_url: el.getAttribute('href') || '' });
    var reserve = e.target.closest('a[href$="reservierung/"]');
    if (reserve) window.siteTrack('reservierung_klick', { ort: document.body.className });
  });

  /* Google Maps erst auf Klick oder mit Zustimmung ------------------------- */
  function loadMap(box) {
    if (box.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = box.getAttribute('data-map');
    f.title = 'Karte: So finden Sie das Il Pomodoro';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    box.appendChild(f);
  }
  document.querySelectorAll('[data-map-load]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('[data-map]');
      var always = box.querySelector('[data-map-always]');
      if (always && always.checked) {
        var c = readConsent() || { stats: false };
        saveConsent(true, c.stats);
      } else loadMap(box);
    });
  });

  applyConsent(readConsent());

  /* Formulare absenden ----------------------------------------------------- */
  // Mit Apps Script: JSON als text/plain (kein CORS-Vorabcheck). Ohne: Netlify Forms.
  window.siteSend = function (formEl, payload) {
    if (CFG.endpoint) {
      return fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' })
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (!res || res.ok !== true) throw new Error((res && res.message) || 'Unbekannter Fehler');
          return res;
        });
    }
    var body = new URLSearchParams();
    body.append('form-name', formEl.getAttribute('name'));
    Object.keys(payload).forEach(function (k) {
      if (typeof payload[k] !== 'object') body.append(k, payload[k]);
    });
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).then(function (r) {
      if (!r.ok) throw new Error('Senden fehlgeschlagen (' + r.status + ')');
      return { ok: true, status: 'angefragt' };
    });
  };

  /**
   * Prüft ein Formular Feld für Feld und zeigt Fehler direkt unter dem Feld.
   * Eigene Regeln kommen über data-validate="phone" o. ä.
   */
  window.siteValidate = function (formEl) {
    var firstBad = null;
    formEl.querySelectorAll('.field').forEach(function (field) {
      var input = field.querySelector('input, select, textarea');
      if (!input || input.type === 'radio') return;
      var msg = '';
      var v = (input.value || '').trim();
      if (input.required && !v && input.type !== 'checkbox') msg = input.getAttribute('data-msg-required') || 'Bitte ausfüllen.';
      else if (input.type === 'checkbox' && input.required && !input.checked) msg = input.getAttribute('data-msg-required') || 'Bitte bestätigen.';
      else if (v && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Bitte eine gültige E-Mail-Adresse angeben.';
      else if (v && input.getAttribute('data-validate') === 'phone' && v.replace(/[^\d]/g, '').length < 6)
        msg = 'Bitte eine erreichbare Telefonnummer angeben.';
      else if (v && input.maxLength > 0 && v.length > input.maxLength) msg = 'Bitte kürzer fassen.';
      var err = field.querySelector('.field-error');
      field.classList.toggle('is-invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      if (msg && !firstBad) firstBad = input;
    });
    // Radiogruppen (Personen, Uhrzeit)
    formEl.querySelectorAll('[data-required-group]').forEach(function (group) {
      var name = group.getAttribute('data-required-group');
      var ok = !!formEl.querySelector('input[name="' + name + '"]:checked');
      var field = group.closest('.field');
      field.classList.toggle('is-invalid', !ok);
      var err = field.querySelector('.field-error');
      if (err) err.textContent = ok ? '' : group.getAttribute('data-msg-required') || 'Bitte auswählen.';
      if (!ok && !firstBad) firstBad = group.querySelector('input');
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  };

  // Fehler verschwindet, sobald das Feld korrigiert wird.
  document.addEventListener('input', function (e) {
    var field = e.target.closest && e.target.closest('.field.is-invalid');
    if (field) {
      field.classList.remove('is-invalid');
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
  document.addEventListener('change', function (e) {
    var field = e.target.closest && e.target.closest('.field.is-invalid');
    if (field && e.target.type === 'radio') field.classList.remove('is-invalid');
  });

  // Zeitstempel beim Öffnen: Bots schicken Formulare in Sekundenbruchteilen ab.
  document.querySelectorAll('form[data-guard]').forEach(function (f) {
    var t = f.querySelector('input[name="t0"]');
    if (t) t.value = String(Date.now());
  });
})();
