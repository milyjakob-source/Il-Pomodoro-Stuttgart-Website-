// Live-Inhalte aus der Inhaber-App: Speisekarte, Wochenkarte, Texte, Bilder und Bestell-Einstellungen
// kommen vom Apps Script (?action=oeffentlich). Was das Restaurant in der App ändert, steht so nach
// spätestens einer Minute auf der Website, ohne neue Veröffentlichung. Ohne Endpoint bleibt alles,
// wie es beim Bauen in die Seiten geschrieben wurde.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var KEY = 'ilpomodoro.live';
  var laden = null;

  window.siteLive = function () {
    if (!CFG.endpoint) return Promise.resolve(null);
    if (laden) return laden;
    try {
      var gemerkt = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (gemerkt && Date.now() - gemerkt.t < 60000) return (laden = Promise.resolve(gemerkt.d));
    } catch (e) {}
    laden = fetch(CFG.endpoint + '?action=oeffentlich', { redirect: 'follow' })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (!d || !d.ok) return null;
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d }));
        } catch (e) {}
        return d;
      })
      .catch(function () {
        return null;
      });
    return laden;
  };

  window.siteEuro = function (n) {
    return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
  };

  window.siteLive().then(function (d) {
    if (!d) return;
    var inh = d.inhalte || {};

    // Bilder, die in der App ausgetauscht wurden.
    document.querySelectorAll('figure[data-foto]').forEach(function (fig) {
      var url = inh['bild_' + fig.getAttribute('data-foto')];
      var img = fig.querySelector('img');
      if (!url || !img || !/^https:\/\//.test(url)) return;
      fig.querySelectorAll('source').forEach(function (s) {
        s.remove();
      });
      img.removeAttribute('srcset');
      img.src = url;
    });

    // Texte, die in der App geändert werden können (data-text="schluessel").
    document.querySelectorAll('[data-text]').forEach(function (el) {
      var t = inh[el.getAttribute('data-text')];
      if (t) el.textContent = t;
    });

    // Hinweis oben auf allen Seiten, z. B. Betriebsferien.
    if (inh.ankuendigung) {
      var bar = document.createElement('div');
      bar.className = 'notice-bar';
      bar.setAttribute('role', 'status');
      bar.textContent = inh.ankuendigung;
      var main = document.getElementById('inhalt');
      if (main) main.insertBefore(bar, main.firstChild);
    }

    // Bestell-Link ausblenden, wenn Bestellungen pausiert sind.
    if (d.bestellung && !d.bestellung.aktiv) {
      document.querySelectorAll('[data-bestell-link]').forEach(function (a) {
        a.hidden = true;
      });
    }
  });
})();
