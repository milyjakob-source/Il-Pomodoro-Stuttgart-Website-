// Wochenkarte: zuerst aus der Inhaber-App (live.js), sonst aus einem Google Sheet: Das Restaurant trägt die Gerichte in eine Tabelle ein,
// die Seite liest sie beim Aufruf als CSV. Keine Neuveröffentlichung der Website nötig.
//
// Spalten (erste Zeile = Überschriften): Kategorie | Gericht | Beschreibung | Preis
// Eine Zeile mit Kategorie „Hinweis“ wird als Text über der Karte gezeigt, z. B. „Gültig vom 6. bis 10. Oktober“.
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var boxes = document.querySelectorAll('[data-wochenkarte]');
  if (!boxes.length) return;

  // CSV mit Anführungszeichen, Kommas und Zeilenumbrüchen in Feldern.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else field += c;
    }
    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toData(rows) {
    if (!rows.length) return null;
    var head = rows[0].map(function (h) {
      return h.trim().toLowerCase();
    });
    function col(name) {
      return head.indexOf(name);
    }
    var iK = col('kategorie');
    var iG = col('gericht');
    var iB = col('beschreibung');
    var iP = col('preis');
    if (iG === -1) return null;
    var hinweis = '';
    var gerichte = [];
    rows.slice(1).forEach(function (r) {
      var kat = iK > -1 ? (r[iK] || '').trim() : '';
      var ger = (r[iG] || '').trim();
      if (kat.toLowerCase() === 'hinweis') {
        hinweis = ger || (iB > -1 ? r[iB] : '') || '';
        return;
      }
      if (!ger) return;
      gerichte.push({
        kategorie: kat,
        gericht: ger,
        beschreibung: iB > -1 ? (r[iB] || '').trim() : '',
        preis: iP > -1 ? (r[iP] || '').trim() : '',
      });
    });
    return { hinweis: hinweis, gerichte: gerichte };
  }

  function render(box, data) {
    var kompakt = box.getAttribute('data-kompakt') === '1';
    var liste = kompakt ? data.gerichte.slice(0, 6) : data.gerichte;
    var gruppen = [];
    liste.forEach(function (g) {
      var gr = gruppen.filter(function (x) {
        return x.titel === g.kategorie;
      })[0];
      if (!gr) gruppen.push((gr = { titel: g.kategorie, gerichte: [] }));
      gr.gerichte.push(g);
    });
    if (!gruppen.length) return;
    box.querySelector('[data-wk-inhalt]').innerHTML = gruppen
      .map(function (gr) {
        return (
          '<div class="wk-gruppe">' +
          (gr.titel ? '<h3 class="wk-titel">' + esc(gr.titel) + '</h3>' : '') +
          '<ul class="wk-liste">' +
          gr.gerichte
            .map(function (g) {
              return (
                '<li><div><strong>' + esc(g.gericht) + '</strong>' +
                (g.beschreibung ? '<span>' + esc(g.beschreibung) + '</span>' : '') +
                '</div>' + (g.preis ? '<em>' + esc(g.preis) + '</em>' : '') + '</li>'
              );
            })
            .join('') +
          '</ul></div>'
        );
      })
      .join('');
    if (data.hinweis) box.querySelector('[data-wk-hinweis]').textContent = data.hinweis;
  }

  function ausCsv() {
    if (!CFG.wochenkarteCsv) return;
    fetch(CFG.wochenkarteCsv, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (text) {
        var data = toData(parseCsv(text));
        if (data) boxes.forEach(function (b) {
          render(b, data);
        });
      })
      .catch(function () {
        /* Sheet nicht erreichbar: die beim Bauen eingesetzte Karte bleibt stehen. */
      });
  }

  (window.siteLive ? window.siteLive() : Promise.resolve(null)).then(function (d) {
    var wk = d && d.wochenkarte;
    if (wk && wk.gerichte && wk.gerichte.length) {
      boxes.forEach(function (b) {
        render(b, wk);
      });
    } else ausCsv();
  });
})();
