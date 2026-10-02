/**
 * Il Pomodoro: Reservierungen, Anfragen und Google-Bewertungen für die Website.
 *
 * Läuft als Google-Apps-Script-Web-App im Google-Konto des Restaurants:
 *  - Reservierungen landen im Tab „Reservierungen“, als Termin im Google Kalender und als E-Mail
 *    beim Gast (Bestätigung mit Storno-Link) und beim Restaurant.
 *  - Anfragen (Feiern, Gutscheine …) landen im Tab „Anfragen“ und als E-Mail beim Restaurant.
 *  - Bewertungen holt das Skript über die Google Places API; der Schlüssel bleibt hier, nicht im Browser.
 *
 * Einrichtung: siehe README.md. Geheimnisse (API-Schlüssel, E-Mail-Adressen) stehen in den
 * Skript-Eigenschaften, nicht im Code.
 */

// Muss zu public/assets/js/config.js passen. Wochentag: 0 = Sonntag … 6 = Samstag.
var EINSTELLUNGEN = {
  rasterMinuten: 15,
  tageImVoraus: 60,
  vorlaufMinuten: 90,
  maxPersonenOnline: 8,
  // So viele Gäste dürfen online gleichzeitig reserviert sein. Der Rest bleibt für Laufkundschaft und Telefon.
  kapazitaet: 40,
  // So lange rechnen wir mit einem Tisch (für Kalender und Kapazität).
  dauerMinuten: 120,
  // true: Reservierungen bis maxPersonenOnline werden sofort bestätigt, wenn Platz ist.
  // false: jede Reservierung ist erst „angefragt“ und wird im Tab von Hand auf „bestaetigt“ gesetzt.
  sofortBestaetigen: true,
  zeiten: {
    0: [], // Sonntag Ruhetag
    1: [['11:30', '13:15'], ['17:30', '21:30']],
    2: [['11:30', '13:15'], ['17:30', '21:30']],
    3: [['11:30', '13:15'], ['17:30', '21:30']],
    4: [['11:30', '13:15'], ['17:30', '21:30']],
    5: [['11:30', '13:15'], ['17:30', '22:00']],
    6: [['17:00', '22:00']],
  },
  geschlossen: [], // 'JJJJ-MM-TT'
  loeschenNachTagen: 90,
  restaurant: {
    name: 'Il Pomodoro',
    adresse: 'Filderstraße 25, 70180 Stuttgart',
    telefon: '0711 51 87 66 50',
    website: 'https://www.ilpomodoro-filderstrase25.de',
  },
};

var TZ = 'Europe/Berlin';
var TAB_RES = 'Reservierungen';
var TAB_ANF = 'Anfragen';
var SPALTEN_RES = ['id', 'eingang', 'datum', 'uhrzeit', 'personen', 'name', 'telefon', 'email', 'anmerkung', 'status', 'kalender_id', 'token', 'quelle'];
var SPALTEN_ANF = ['id', 'eingang', 'thema', 'name', 'email', 'telefon', 'datum', 'personen', 'nachricht', 'status'];
var ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/* Eingang --------------------------------------------------------------- */

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // Honeypot gefüllt oder in unter 3 Sekunden abgeschickt: freundlich „ok“ sagen, nichts speichern.
    if (text(d['bot-field']) || (Number(d.t0) && Date.now() - Number(d.t0) < 3000)) return json({ ok: true, status: 'angefragt' });
    if (!drosseln(d.email)) return json({ ok: false, message: 'Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später noch einmal.' });
    if (d.datenschutz !== 'ja') return json({ ok: false, message: 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.' });
    if (d.action === 'reservierung') return json(reservieren(d));
    if (d.action === 'anfrage') return json(anfrage(d));
    return json({ ok: false, message: 'Unbekannte Aktion.' });
  } catch (fehler) {
    console.error(fehler);
    return json({ ok: false, message: 'Das hat leider nicht geklappt. Bitte rufen Sie uns an: ' + EINSTELLUNGEN.restaurant.telefon });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'belegung') return json(belegung(p.datum));
    if (p.action === 'bewertungen' || p.action === 'google') return json(bewertungen());
    if (p.action === 'storno') return stornoSeite(p.id, p.token, p.bestaetigen === '1');
    return json({ ok: true, text: 'Il-Pomodoro-Skript bereit.' });
  } catch (fehler) {
    console.error(fehler);
    return json({ ok: false, message: String(fehler) });
  }
}

/* Reservierung ---------------------------------------------------------- */

function reservieren(d) {
  var E = EINSTELLUNGEN;
  var r = {
    datum: text(d.datum),
    uhrzeit: text(d.uhrzeit),
    personen: parseInt(d.personen, 10),
    name: text(d.name, 80),
    telefon: text(d.telefon, 30),
    email: text(d.email, 120).toLowerCase(),
    anmerkung: text(d.anmerkung, 500),
  };
  var fehler = pruefeReservierung(r);
  if (fehler) return { ok: false, message: fehler };

  var sperre = LockService.getScriptLock();
  sperre.waitLock(20000);
  try {
    var belegt = belegung(r.datum).belegt[r.uhrzeit] || 0;
    if (belegt + r.personen > E.kapazitaet) {
      return { ok: false, message: 'Um ' + r.uhrzeit + ' Uhr ist online leider nichts mehr frei. Bitte wählen Sie eine andere Uhrzeit oder rufen Sie uns an.' };
    }
    r.id = neueId('R');
    r.token = neueId('T') + neueId('');
    r.eingang = new Date();
    r.status = E.sofortBestaetigen ? 'bestaetigt' : 'angefragt';
    r.quelle = 'Website';
    r.kalender_id = kalenderEintrag(r);
    blatt(TAB_RES, SPALTEN_RES).appendRow(SPALTEN_RES.map(function (s) {
      return r[s] === undefined ? '' : r[s];
    }));
  } finally {
    sperre.releaseLock();
  }

  mailGast(r);
  mailRestaurant(
    (r.status === 'bestaetigt' ? 'Neue Reservierung: ' : 'Reservierung prüfen: ') + r.personen + ' P., ' + datumLang(r.datum) + ', ' + r.uhrzeit,
    [
      ['Name', r.name], ['Datum', datumLang(r.datum)], ['Uhrzeit', r.uhrzeit + ' Uhr'], ['Personen', r.personen],
      ['Telefon', r.telefon], ['E-Mail', r.email], ['Anmerkung', r.anmerkung || '–'], ['Status', r.status],
    ],
    r.email,
  );
  return { ok: true, status: r.status, id: r.id };
}

function pruefeReservierung(r) {
  var E = EINSTELLUNGEN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.datum)) return 'Bitte ein gültiges Datum wählen.';
  if (!/^\d{2}:\d{2}$/.test(r.uhrzeit)) return 'Bitte eine Uhrzeit wählen.';
  if (!(r.personen >= 1 && r.personen <= E.maxPersonenOnline)) return 'Online reservieren wir für 1 bis ' + E.maxPersonenOnline + ' Personen. Für größere Gruppen nutzen Sie bitte das Anfrageformular.';
  if (r.name.length < 2) return 'Bitte geben Sie Ihren Namen an.';
  if (r.telefon.replace(/[^\d]/g, '').length < 6) return 'Bitte eine erreichbare Telefonnummer angeben.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email)) return 'Bitte eine gültige E-Mail-Adresse angeben.';
  if (E.geschlossen.indexOf(r.datum) !== -1) return 'An diesem Tag nehmen wir online keine Reservierungen an.';
  if (erlaubteZeiten(r.datum).indexOf(r.uhrzeit) === -1) return 'Diese Uhrzeit ist online nicht buchbar. Bitte wählen Sie eine andere.';
  return '';
}

/** Buchbare Uhrzeiten eines Tages im Raster, ohne vergangene und zu kurzfristige. */
function erlaubteZeiten(datum) {
  var E = EINSTELLUNGEN;
  var heute = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var bis = Utilities.formatDate(new Date(Date.now() + E.tageImVoraus * 864e5), TZ, 'yyyy-MM-dd');
  if (datum < heute || datum > bis) return [];
  var jetzt = Utilities.formatDate(new Date(), TZ, 'HH:mm');
  var frueh = datum === heute ? minuten(jetzt) + E.vorlaufMinuten : -1;
  var tag = new Date(datum + 'T12:00:00Z').getUTCDay();
  var out = [];
  (E.zeiten[tag] || []).forEach(function (z) {
    for (var m = minuten(z[0]); m <= minuten(z[1]); m += E.rasterMinuten) if (m >= frueh) out.push(hhmm(m));
  });
  return out;
}

/** Gäste, die zu jeder Uhrzeit des Tages schon im Haus sind (Reservierungen, die sich überschneiden). */
function belegung(datum) {
  var E = EINSTELLUNGEN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datum))) return { ok: false, message: 'Datum fehlt.' };
  var zeilen = zeilenVon(TAB_RES, SPALTEN_RES).filter(function (z) {
    return datumText(z.datum) === datum && z.status !== 'storniert' && z.status !== 'abgelehnt';
  });
  var belegt = {};
  erlaubteZeitenOhneFrist(datum).forEach(function (t) {
    var start = minuten(t);
    belegt[t] = zeilen.reduce(function (summe, z) {
      var s = minuten(zeitText(z.uhrzeit));
      return s < start + E.dauerMinuten && start < s + E.dauerMinuten ? summe + Number(z.personen || 0) : summe;
    }, 0);
  });
  return { ok: true, kapazitaet: E.kapazitaet, belegt: belegt };
}

function erlaubteZeitenOhneFrist(datum) {
  var E = EINSTELLUNGEN;
  var tag = new Date(datum + 'T12:00:00Z').getUTCDay();
  var out = [];
  (E.zeiten[tag] || []).forEach(function (z) {
    for (var m = minuten(z[0]); m <= minuten(z[1]); m += E.rasterMinuten) out.push(hhmm(m));
  });
  return out;
}

function kalenderEintrag(r) {
  try {
    var id = eigenschaft('CALENDAR_ID');
    var kal = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
    if (!kal) return '';
    var start = zeitpunkt(r.datum, r.uhrzeit);
    var ende = new Date(start.getTime() + EINSTELLUNGEN.dauerMinuten * 60000);
    var titel = r.personen + ' P. ' + r.name + (r.status === 'angefragt' ? ' (prüfen)' : '');
    var ev = kal.createEvent(titel, start, ende, {
      description: 'Telefon: ' + r.telefon + '\nE-Mail: ' + r.email + (r.anmerkung ? '\nAnmerkung: ' + r.anmerkung : '') + '\nID: ' + r.id,
    });
    return ev.getId();
  } catch (fehler) {
    // Ohne Kalender geht die Reservierung trotzdem durch, sie steht ja in der Tabelle.
    console.error('Kalender:', fehler);
    return '';
  }
}

/* Storno ---------------------------------------------------------------- */

function stornoSeite(id, token, bestaetigen) {
  var treffer = findeReservierung(id, token);
  if (!treffer) return seite('Link ungültig', '<p>Diese Reservierung haben wir nicht gefunden. Bitte rufen Sie uns an: ' + esc(EINSTELLUNGEN.restaurant.telefon) + '</p>');
  var r = treffer.werte;
  var info = datumLang(datumText(r.datum)) + ', ' + zeitText(r.uhrzeit) + ' Uhr, ' + r.personen + ' Personen';
  if (r.status === 'storniert') return seite('Bereits storniert', '<p>Die Reservierung (' + esc(info) + ') ist schon storniert.</p>');
  if (!bestaetigen) {
    var url = ScriptApp.getService().getUrl() + '?action=storno&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token) + '&bestaetigen=1';
    return seite('Reservierung stornieren?', '<p>' + esc(info) + ' auf den Namen ' + esc(r.name) + '.</p><p><a class="btn" href="' + url + '" target="_top">Ja, stornieren</a></p>');
  }
  treffer.blatt.getRange(treffer.zeile, SPALTEN_RES.indexOf('status') + 1).setValue('storniert');
  try {
    var id2 = eigenschaft('CALENDAR_ID');
    var kal = id2 ? CalendarApp.getCalendarById(id2) : CalendarApp.getDefaultCalendar();
    var ev = r.kalender_id && kal.getEventById(r.kalender_id);
    if (ev) ev.deleteEvent();
  } catch (fehler) {
    console.error('Kalender beim Storno:', fehler);
  }
  mailRestaurant('Storniert: ' + r.personen + ' P., ' + info, [['Name', r.name], ['Telefon', r.telefon], ['E-Mail', r.email]], r.email);
  return seite('Storniert', '<p>Ihre Reservierung (' + esc(info) + ') ist storniert. Danke, dass Sie Bescheid gegeben haben.</p>');
}

function findeReservierung(id, token) {
  if (!id || !token) return null;
  var b = blatt(TAB_RES, SPALTEN_RES);
  var daten = b.getDataRange().getValues();
  var kopf = daten[0];
  for (var i = 1; i < daten.length; i++) {
    var werte = {};
    kopf.forEach(function (k, j) {
      werte[k] = daten[i][j];
    });
    if (werte.id === id && werte.token === token) return { blatt: b, zeile: i + 1, werte: werte };
  }
  return null;
}

/* Anfrage --------------------------------------------------------------- */

function anfrage(d) {
  var a = {
    id: neueId('A'),
    eingang: new Date(),
    thema: text(d.thema, 60),
    name: text(d.name, 80),
    email: text(d.email, 120).toLowerCase(),
    telefon: text(d.telefon, 30),
    datum: text(d.datum, 10),
    personen: text(d.personen, 4),
    nachricht: text(d.nachricht, 2000),
    status: 'neu',
  };
  if (a.name.length < 2) return { ok: false, message: 'Bitte geben Sie Ihren Namen an.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email)) return { ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' };
  if (a.nachricht.length < 5) return { ok: false, message: 'Bitte schreiben Sie uns kurz, worum es geht.' };
  blatt(TAB_ANF, SPALTEN_ANF).appendRow(SPALTEN_ANF.map(function (s) {
    return a[s];
  }));
  mailRestaurant(
    'Anfrage: ' + a.thema + ' von ' + a.name,
    [['Thema', a.thema], ['Name', a.name], ['E-Mail', a.email], ['Telefon', a.telefon || '–'], ['Wunschdatum', a.datum ? datumLang(a.datum) : '–'], ['Personen', a.personen || '–'], ['Nachricht', a.nachricht]],
    a.email,
  );
  return { ok: true, id: a.id };
}

/* Bewertungen ----------------------------------------------------------- */

/**
 * Bewertungen und Fotos aus dem Google-Unternehmensprofil (Places API, New).
 * Liefert Sterne, Anzahl, bis zu 5 Bewertungen (die besten zuerst) und bis zu 10 Fotos mit Urheber.
 * Die Foto-Adressen zeigen auf Googles Bildserver; der API-Schlüssel steckt nicht darin.
 */
function bewertungen() {
  var cache = CacheService.getScriptCache();
  var gemerkt = cache.get('google');
  if (gemerkt) return JSON.parse(gemerkt);
  var key = eigenschaft('PLACES_API_KEY');
  var placeId = eigenschaft('PLACE_ID');
  if (!key || !placeId) return { ok: false, message: 'PLACES_API_KEY oder PLACE_ID fehlt.' };
  var antwort = UrlFetchApp.fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId) + '?languageCode=de', {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,photos,googleMapsUri' },
    muteHttpExceptions: true,
  });
  if (antwort.getResponseCode() !== 200) {
    console.error('Places API', antwort.getResponseCode(), antwort.getContentText());
    return { ok: false, message: 'Google-Daten gerade nicht verfügbar.' };
  }
  var p = JSON.parse(antwort.getContentText());
  var reviews = (p.reviews || [])
    .map(function (r) {
      var t = (r.text && r.text.text) || (r.originalText && r.originalText.text) || '';
      return {
        author: (r.authorAttribution && r.authorAttribution.displayName) || 'Google-Nutzer',
        authorUrl: (r.authorAttribution && r.authorAttribution.uri) || '',
        rating: r.rating || 0,
        text: t,
        when: r.relativePublishTimeDescription || '',
      };
    })
    // Top-Rezensionen zuerst: beste Sterne, bei Gleichstand die ausführlichere.
    .sort(function (a, b) {
      return b.rating - a.rating || b.text.length - a.text.length;
    });
  var fotos = (p.photos || []).slice(0, 10).map(function (f) {
    var uri = '';
    try {
      var m = UrlFetchApp.fetch('https://places.googleapis.com/v1/' + f.name + '/media?maxWidthPx=1600&skipHttpRedirect=true', {
        headers: { 'X-Goog-Api-Key': key },
        muteHttpExceptions: true,
      });
      if (m.getResponseCode() === 200) uri = JSON.parse(m.getContentText()).photoUri || '';
    } catch (fehler) {
      console.error('Foto', fehler);
    }
    var a = (f.authorAttributions || [])[0] || {};
    return { url: uri, width: f.widthPx || 0, height: f.heightPx || 0, author: a.displayName || '', authorUrl: a.uri || '' };
  }).filter(function (f) {
    return f.url;
  });
  var ergebnis = { ok: true, rating: p.rating || 0, count: p.userRatingCount || 0, url: p.googleMapsUri || '', reviews: reviews, fotos: fotos };
  cache.put('google', JSON.stringify(ergebnis), 6 * 3600);
  return ergebnis;
}

/* E-Mails --------------------------------------------------------------- */

function mailGast(r) {
  var R = EINSTELLUNGEN.restaurant;
  var bestaetigt = r.status === 'bestaetigt';
  var storno = ScriptApp.getService().getUrl() + '?action=storno&id=' + encodeURIComponent(r.id) + '&token=' + encodeURIComponent(r.token);
  var betreff = bestaetigt ? 'Ihre Reservierung im Il Pomodoro am ' + datumLang(r.datum) : 'Ihre Reservierungsanfrage im Il Pomodoro';
  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#151a17;max-width:520px">' +
    '<h1 style="font-size:24px;margin:0 0 12px">' + (bestaetigt ? 'Ihr Tisch ist reserviert.' : 'Danke für Ihre Anfrage.') + '</h1>' +
    '<p>Hallo ' + esc(r.name) + ',</p>' +
    '<p>' + (bestaetigt ? 'wir freuen uns auf Ihren Besuch:' : 'wir prüfen Ihre Reservierung und melden uns kurz zur Bestätigung:') + '</p>' +
    '<p style="padding:16px;border-radius:12px;background:#e2e8df"><strong>' + esc(datumLang(r.datum)) + ', ' + esc(r.uhrzeit) + ' Uhr</strong><br>' +
    r.personen + (r.personen === 1 ? ' Person' : ' Personen') + (r.anmerkung ? '<br>Anmerkung: ' + esc(r.anmerkung) : '') + '</p>' +
    '<p>Wir halten den Tisch 15 Minuten für Sie frei. Pläne geändert? <a href="' + storno + '">Reservierung stornieren</a> oder anrufen: ' + esc(R.telefon) + '.</p>' +
    '<p>' + esc(R.name) + '<br>' + esc(R.adresse) + '<br><a href="' + R.website + '">' + R.website.replace('https://', '') + '</a></p></div>';
  MailApp.sendEmail({
    to: r.email,
    subject: betreff,
    htmlBody: html,
    name: R.name,
    replyTo: eigenschaft('NOTIFY_EMAIL') || undefined,
  });
}

function mailRestaurant(betreff, zeilen, antwortAn) {
  var an = eigenschaft('NOTIFY_EMAIL');
  if (!an) return;
  var html =
    '<table style="font-family:Helvetica,Arial,sans-serif;font-size:15px;border-collapse:collapse">' +
    zeilen
      .map(function (z) {
        return '<tr><td style="padding:6px 16px 6px 0;color:#4a524d;vertical-align:top">' + esc(z[0]) + '</td><td style="padding:6px 0">' + esc(String(z[1])).replace(/\n/g, '<br>') + '</td></tr>';
      })
      .join('') +
    '</table>';
  MailApp.sendEmail({ to: an, subject: betreff, htmlBody: html, replyTo: antwortAn || undefined, name: 'Il Pomodoro Website' });
}

/* Einrichtung und Pflege ------------------------------------------------ */

/** Einmal im Editor ausführen: legt die Tabs an und plant das nächtliche Aufräumen. */
function einrichten() {
  blatt(TAB_RES, SPALTEN_RES);
  blatt(TAB_ANF, SPALTEN_ANF);
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'aufraeumen') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('aufraeumen').timeBased().everyDays(1).atHour(4).inTimezone(TZ).create();
  console.log('Fertig. Tabs angelegt, Aufräumen täglich um 4 Uhr.');
}

/** Löscht Reservierungen, deren Termin länger als loeschenNachTagen zurückliegt (Datenschutz). */
function aufraeumen() {
  var grenze = Utilities.formatDate(new Date(Date.now() - EINSTELLUNGEN.loeschenNachTagen * 864e5), TZ, 'yyyy-MM-dd');
  var b = blatt(TAB_RES, SPALTEN_RES);
  var daten = b.getDataRange().getValues();
  var spalte = daten[0].indexOf('datum');
  for (var i = daten.length - 1; i >= 1; i--) {
    if (datumText(daten[i][spalte]) < grenze) b.deleteRow(i + 1);
  }
}

/* Hilfen ---------------------------------------------------------------- */

function tabelle() {
  var id = eigenschaft('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function blatt(name, spalten) {
  var ss = tabelle();
  var b = ss.getSheetByName(name);
  if (!b) {
    b = ss.insertSheet(name);
    b.getRange(1, 1, 1, spalten.length).setValues([spalten]).setFontWeight('bold');
    b.setFrozenRows(1);
    // Datum und Uhrzeit als Text, damit Sheets nichts umrechnet.
    var di = spalten.indexOf('datum');
    if (di !== -1) b.getRange(2, di + 1, b.getMaxRows() - 1, 1).setNumberFormat('@');
    var ui = spalten.indexOf('uhrzeit');
    if (ui !== -1) b.getRange(2, ui + 1, b.getMaxRows() - 1, 1).setNumberFormat('@');
  }
  return b;
}

function zeilenVon(name, spalten) {
  var daten = blatt(name, spalten).getDataRange().getValues();
  var kopf = daten.shift();
  return daten.map(function (z) {
    var o = {};
    kopf.forEach(function (k, j) {
      o[k] = z[j];
    });
    return o;
  });
}

/** Weniger als 5 Einsendungen je E-Mail in 10 Minuten und 30 insgesamt. */
function drosseln(email) {
  var cache = CacheService.getScriptCache();
  var keys = ['gesamt', 'mail:' + String(email || '').toLowerCase().slice(0, 100)];
  var grenzen = [30, 5];
  for (var i = 0; i < keys.length; i++) {
    var n = Number(cache.get(keys[i]) || 0);
    if (n >= grenzen[i]) return false;
    cache.put(keys[i], String(n + 1), 600);
  }
  return true;
}

function eigenschaft(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

function text(v, max) {
  var s = v === undefined || v === null ? '' : String(v).trim();
  return max && s.length > max ? s.slice(0, max) : s;
}

function datumText(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || '');
}

function zeitText(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'HH:mm') : String(v || '');
}

function zeitpunkt(datum, uhrzeit) {
  // „2026-10-02 19:30“ in Berliner Zeit, unabhängig von der Zeitzone des Servers.
  var versatz = Utilities.formatDate(new Date(datum + 'T12:00:00Z'), TZ, 'XXX');
  return new Date(datum + 'T' + uhrzeit + ':00' + versatz);
}

function datumLang(iso) {
  var tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var d = new Date(iso + 'T12:00:00Z');
  return tage[d.getUTCDay()] + ', ' + d.getUTCDate() + '. ' + monate[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

function minuten(t) {
  var p = String(t).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function hhmm(m) {
  return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
}

function neueId(praefix) {
  var z = '';
  for (var i = 0; i < 8; i++) z += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  return praefix ? praefix + '-' + z : z;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function seite(titel, inhalt) {
  var html =
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + ' | Il Pomodoro</title>' +
    '<style>body{font-family:Helvetica,Arial,sans-serif;background:#f2f3ef;color:#151a17;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}' +
    'main{max-width:480px;background:#fafbf8;border-radius:18px;padding:32px;border:1px solid rgba(21,26,23,.12)}h1{margin:0 0 12px}' +
    '.btn{display:inline-block;background:#b3351f;color:#fafbf8;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600}</style></head>' +
    '<body><main><h1>' + esc(titel) + '</h1>' + inhalt + '<p><a href="' + EINSTELLUNGEN.restaurant.website + '" target="_top">Zur Website</a></p></main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(titel).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
