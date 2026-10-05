/**
 * Inhaber-App und Inhalte der Website: Einstellungen (Plätze, Lieferung …), Speisekarte, Wochenkarte,
 * Texte und Bilder. Alles liegt in Tabs der Google-Tabelle; die Website liest es über ?action=oeffentlich,
 * die App schreibt es über POST mit action=admin… und einem Login-Token.
 *
 * Die PIN für die App steht in den Skript-Eigenschaften (ADMIN_PIN) und kann in der App geändert werden.
 */

var TAB_EIN = 'Einstellungen';
var TAB_KARTE = 'Karte';
var TAB_WOCHE = 'Wochenkarte';
var TAB_INH = 'Inhalte';
var SPALTEN_EIN = ['schluessel', 'wert'];
var SPALTEN_KARTE = ['id', 'kategorie', 'name', 'beschreibung', 'preis', 'tags', 'aktiv', 'bestellbar', 'reihenfolge'];
var SPALTEN_WOCHE = ['id', 'kategorie', 'gericht', 'beschreibung', 'preis', 'reihenfolge'];
var SPALTEN_INH = ['schluessel', 'wert'];

// Standardwerte, solange im Tab „Einstellungen“ nichts anderes steht.
var STANDARD = {
  kapazitaet: 40, // Gäste gleichzeitig, die online reserviert sein dürfen
  dauerMinuten: 120, // so lange rechnen wir mit einem Tisch
  sofortBestaetigen: true,
  reservierungOnline: true, // false = Online-Reservierung pausiert
  geschlossen: '', // Tage ohne Online-Reservierung und Bestellung, JJJJ-MM-TT, durch Komma getrennt
  presetSommer: 60,
  presetWinter: 40,
  bestellungAktiv: true,
  lieferungAktiv: true,
  abholungAktiv: true,
  liefergebietPlz: '70173,70178,70180,70182,70184,70197,70199',
  mindestbestellwert: 15,
  liefergebuehr: 2.5,
  vorlaufMinuten: 30, // so lange dauert eine Bestellung mindestens
};

/* Öffentlich: alles, was die Website zum Anzeigen braucht ---------------- */

function oeffentlich() {
  var cache = CacheService.getScriptCache();
  var gemerkt = cache.get('oeffentlich');
  if (gemerkt) return JSON.parse(gemerkt);
  var e = einstellungen();
  var karte = zeilenVon(TAB_KARTE, SPALTEN_KARTE)
    .filter(function (z) {
      return wahr(z.aktiv) && text(z.name);
    })
    .sort(nachReihenfolge)
    .map(function (z) {
      var preis = zahl(z.preis);
      return {
        id: String(z.id),
        kategorie: text(z.kategorie),
        name: text(z.name),
        beschreibung: text(z.beschreibung),
        preis: preis,
        tags: text(z.tags) ? text(z.tags).split(/\s*,\s*/) : [],
        bestellbar: wahr(z.bestellbar) && preis > 0,
      };
    });
  var woche = zeilenVon(TAB_WOCHE, SPALTEN_WOCHE)
    .filter(function (z) {
      return text(z.gericht);
    })
    .sort(nachReihenfolge)
    .map(function (z) {
      return { kategorie: text(z.kategorie), gericht: text(z.gericht), beschreibung: text(z.beschreibung), preis: text(z.preis) };
    });
  var inhalte = {};
  zeilenVon(TAB_INH, SPALTEN_INH).forEach(function (z) {
    if (text(z.schluessel)) inhalte[text(z.schluessel)] = text(z.wert);
  });
  var ergebnis = {
    ok: true,
    karte: karte,
    wochenkarte: { hinweis: inhalte.wochenkarte_hinweis || '', gerichte: woche },
    inhalte: inhalte,
    reservierungOnline: wahr(e.reservierungOnline),
    bestellung: {
      aktiv: wahr(e.bestellungAktiv),
      lieferung: wahr(e.lieferungAktiv),
      abholung: wahr(e.abholungAktiv),
      plz: String(e.liefergebietPlz || '').split(/\s*,\s*/).filter(String),
      mindestbestellwert: zahl(e.mindestbestellwert),
      liefergebuehr: zahl(e.liefergebuehr),
      vorlaufMinuten: zahl(e.vorlaufMinuten),
    },
    geschlossen: geschlosseneTage(),
  };
  cache.put('oeffentlich', JSON.stringify(ergebnis), 60);
  return ergebnis;
}

/* Einstellungen --------------------------------------------------------- */

function einstellungen() {
  var cache = CacheService.getScriptCache();
  var gemerkt = cache.get('einstellungen');
  if (gemerkt) return JSON.parse(gemerkt);
  var e = {};
  Object.keys(STANDARD).forEach(function (k) {
    e[k] = STANDARD[k];
  });
  zeilenVon(TAB_EIN, SPALTEN_EIN).forEach(function (z) {
    var k = text(z.schluessel);
    if (k && z.wert !== '' && z.wert !== null) e[k] = z.wert;
  });
  cache.put('einstellungen', JSON.stringify(e), 60);
  return e;
}

function einstellung(k, fallback) {
  var v = einstellungen()[k];
  if (v === undefined || v === '') return fallback;
  if (typeof STANDARD[k] === 'boolean') return wahr(v);
  return v;
}

function kapazitaet() {
  return zahl(einstellung('kapazitaet', EINSTELLUNGEN.kapazitaet)) || EINSTELLUNGEN.kapazitaet;
}

function dauer() {
  return zahl(einstellung('dauerMinuten', EINSTELLUNGEN.dauerMinuten)) || EINSTELLUNGEN.dauerMinuten;
}

function geschlosseneTage() {
  var aus = String(einstellung('geschlossen', '') || '')
    .split(/\s*,\s*/)
    .filter(function (d) {
      return /^\d{4}-\d{2}-\d{2}$/.test(d);
    });
  return EINSTELLUNGEN.geschlossen.concat(aus);
}

function speichereSchluesselWerte(tab, werte) {
  var b = blatt(tab, SPALTEN_EIN);
  var daten = b.getDataRange().getValues();
  var zeile = {};
  for (var i = 1; i < daten.length; i++) zeile[String(daten[i][0])] = i + 1;
  Object.keys(werte).forEach(function (k) {
    var v = werte[k];
    if (typeof v === 'boolean') v = v ? 'ja' : 'nein';
    if (zeile[k]) b.getRange(zeile[k], 2).setValue(v);
    else b.appendRow([k, v]);
  });
  leereCache();
}

function leereCache() {
  CacheService.getScriptCache().removeAll(['oeffentlich', 'einstellungen']);
}

/* Inhaber-App ----------------------------------------------------------- */

function admin(d) {
  if (d.action === 'adminLogin') return adminLogin(d);
  var cache = CacheService.getScriptCache();
  if (!d.token || !cache.get('admin:' + d.token)) return { ok: false, login: true, message: 'Bitte neu anmelden.' };
  cache.put('admin:' + d.token, '1', 6 * 3600); // aktiv = angemeldet bleiben

  switch (d.action) {
    case 'adminUebersicht':
      return adminUebersicht(d);
    case 'adminReservierungen':
      return { ok: true, reservierungen: reservierungenAm(text(d.datum)) };
    case 'adminReservierungStatus':
      return adminReservierungStatus(d);
    case 'adminReservierungNeu':
      return adminReservierungNeu(d);
    case 'adminBestellungen':
      return { ok: true, bestellungen: bestellungenListe(d.alle) };
    case 'adminBestellungStatus':
      return bestellungStatus(d);
    case 'adminKarte':
      return { ok: true, karte: zeilenVon(TAB_KARTE, SPALTEN_KARTE).sort(nachReihenfolge), wochenkarte: zeilenVon(TAB_WOCHE, SPALTEN_WOCHE).sort(nachReihenfolge), hinweis: inhalt('wochenkarte_hinweis') };
    case 'adminKarteSpeichern':
      return ersetzeTab(TAB_KARTE, SPALTEN_KARTE, d.karte || []);
    case 'adminWochenkarteSpeichern':
      speichereSchluesselWerte(TAB_INH, { wochenkarte_hinweis: text(d.hinweis, 200) });
      return ersetzeTab(TAB_WOCHE, SPALTEN_WOCHE, d.gerichte || []);
    case 'adminEinstellungen':
      return { ok: true, einstellungen: einstellungen() };
    case 'adminEinstellungenSpeichern':
      speichereSchluesselWerte(TAB_EIN, erlaubteWerte(d.werte || {}, Object.keys(STANDARD)));
      return { ok: true, einstellungen: einstellungen() };
    case 'adminInhalte':
      return { ok: true, inhalte: oeffentlich().inhalte };
    case 'adminInhalteSpeichern':
      speichereSchluesselWerte(TAB_INH, d.werte || {});
      return { ok: true };
    case 'adminBild':
      return adminBild(d);
    case 'adminPin':
      if (!/^\d{4,8}$/.test(String(d.pin || ''))) return { ok: false, message: 'Die PIN braucht 4 bis 8 Ziffern.' };
      PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', String(d.pin));
      return { ok: true };
  }
  return { ok: false, message: 'Unbekannte Aktion.' };
}

function adminLogin(d) {
  var cache = CacheService.getScriptCache();
  var versuche = Number(cache.get('login-versuche') || 0);
  if (versuche >= 10) return { ok: false, message: 'Zu viele Versuche. Bitte in 10 Minuten noch einmal.' };
  var pin = eigenschaft('ADMIN_PIN');
  if (!pin) return { ok: false, message: 'ADMIN_PIN ist im Skript noch nicht gesetzt.' };
  if (String(d.pin || '') !== pin) {
    cache.put('login-versuche', String(versuche + 1), 600);
    Utilities.sleep(800);
    return { ok: false, message: 'Die PIN stimmt nicht.' };
  }
  var token = neueId('') + neueId('') + neueId('') + neueId('');
  cache.put('admin:' + token, '1', 6 * 3600);
  return { ok: true, token: token, name: EINSTELLUNGEN.restaurant.name };
}

function adminUebersicht(d) {
  var heute = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var datum = /^\d{4}-\d{2}-\d{2}$/.test(String(d.datum)) ? d.datum : heute;
  return {
    ok: true,
    heute: heute,
    datum: datum,
    reservierungen: reservierungenAm(datum),
    angefragt: zeilenVon(TAB_RES, SPALTEN_RES)
      .filter(function (z) {
        return z.status === 'angefragt' && datumText(z.datum) >= heute;
      })
      .map(resKurz),
    bestellungen: bestellungenListe(false),
    belegung: belegung(datum),
    einstellungen: einstellungen(),
  };
}

function reservierungenAm(datum) {
  return zeilenVon(TAB_RES, SPALTEN_RES)
    .filter(function (z) {
      return datumText(z.datum) === datum;
    })
    .map(resKurz)
    .sort(function (a, b) {
      return a.uhrzeit < b.uhrzeit ? -1 : 1;
    });
}

function resKurz(z) {
  return {
    id: z.id, datum: datumText(z.datum), uhrzeit: zeitText(z.uhrzeit), personen: Number(z.personen),
    name: z.name, telefon: z.telefon, email: z.email, anmerkung: z.anmerkung, status: z.status, quelle: z.quelle,
  };
}

function adminReservierungStatus(d) {
  var erlaubt = ['bestaetigt', 'abgelehnt', 'storniert', 'erschienen', 'nicht erschienen'];
  if (erlaubt.indexOf(d.status) === -1) return { ok: false, message: 'Unbekannter Status.' };
  var b = blatt(TAB_RES, SPALTEN_RES);
  var daten = b.getDataRange().getValues();
  var kopf = daten[0];
  for (var i = 1; i < daten.length; i++) {
    if (daten[i][kopf.indexOf('id')] !== d.id) continue;
    var r = {};
    kopf.forEach(function (k, j) {
      r[k] = daten[i][j];
    });
    var vorher = r.status;
    b.getRange(i + 1, kopf.indexOf('status') + 1).setValue(d.status);
    if (d.status === 'abgelehnt' || d.status === 'storniert') loescheKalender(r.kalender_id);
    r.datum = datumText(r.datum);
    r.uhrzeit = zeitText(r.uhrzeit);
    r.personen = Number(r.personen);
    if (r.email && vorher === 'angefragt' && d.status === 'bestaetigt') {
      r.status = 'bestaetigt';
      mailGast(r);
    }
    if (r.email && d.status === 'abgelehnt') {
      MailApp.sendEmail({
        to: r.email,
        subject: 'Ihre Reservierungsanfrage im ' + EINSTELLUNGEN.restaurant.name,
        htmlBody: '<p>Hallo ' + esc(r.name) + ',</p><p>leider sind wir am ' + esc(datumLang(r.datum)) + ' um ' + esc(r.uhrzeit) +
          ' Uhr ausgebucht. Rufen Sie uns gern an, vielleicht finden wir eine andere Zeit: ' + esc(EINSTELLUNGEN.restaurant.telefon) + '.</p><p>' + esc(EINSTELLUNGEN.restaurant.name) + '</p>',
        name: EINSTELLUNGEN.restaurant.name,
      });
    }
    return { ok: true };
  }
  return { ok: false, message: 'Reservierung nicht gefunden.' };
}

/** Telefonische Reservierung: ohne Vorlauf und E-Mail, auf Wunsch auch über die Online-Kapazität hinaus. */
function adminReservierungNeu(d) {
  var r = {
    datum: text(d.datum), uhrzeit: text(d.uhrzeit), personen: parseInt(d.personen, 10),
    name: text(d.name, 80), telefon: text(d.telefon, 30), email: text(d.email, 120).toLowerCase(), anmerkung: text(d.anmerkung, 500),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.datum) || !/^\d{2}:\d{2}$/.test(r.uhrzeit)) return { ok: false, message: 'Bitte Datum und Uhrzeit angeben.' };
  if (!(r.personen >= 1 && r.personen <= 200)) return { ok: false, message: 'Bitte die Personenzahl angeben.' };
  if (r.name.length < 2) return { ok: false, message: 'Bitte einen Namen angeben.' };
  var sperre = LockService.getScriptLock();
  sperre.waitLock(20000);
  try {
    var belegt = (belegung(r.datum).belegt[r.uhrzeit] || 0);
    if (!d.trotzVoll && belegt + r.personen > kapazitaet()) {
      return { ok: false, voll: true, message: 'Um ' + r.uhrzeit + ' Uhr sind schon ' + belegt + ' von ' + kapazitaet() + ' Plätzen vergeben. Trotzdem eintragen?' };
    }
    r.id = neueId('R');
    r.token = neueId('T') + neueId('');
    r.eingang = new Date();
    r.status = 'bestaetigt';
    r.quelle = 'Telefon';
    r.kalender_id = kalenderEintrag(r);
    blatt(TAB_RES, SPALTEN_RES).appendRow(SPALTEN_RES.map(function (s) {
      return r[s] === undefined ? '' : r[s];
    }));
  } finally {
    sperre.releaseLock();
  }
  if (r.email) mailGast(r);
  return { ok: true, id: r.id };
}

function loescheKalender(id) {
  if (!id) return;
  try {
    var cid = eigenschaft('CALENDAR_ID');
    var kal = cid ? CalendarApp.getCalendarById(cid) : CalendarApp.getDefaultCalendar();
    var ev = kal.getEventById(id);
    if (ev) ev.deleteEvent();
  } catch (fehler) {
    console.error('Kalender:', fehler);
  }
}

/** Ersetzt den Inhalt eines Tabs (Karte, Wochenkarte) durch die Liste aus der App. */
function ersetzeTab(tab, spalten, liste) {
  if (!Array.isArray(liste) || liste.length > 400) return { ok: false, message: 'Ungültige Liste.' };
  var zeilen = liste.map(function (o, i) {
    return spalten.map(function (s) {
      if (s === 'id') return text(o.id) || neueId(tab === TAB_KARTE ? 'K' : 'W');
      if (s === 'reihenfolge') return i + 1;
      if (s === 'aktiv' || s === 'bestellbar') return o[s] === false || o[s] === 'nein' ? 'nein' : 'ja';
      if (s === 'preis' && tab === TAB_KARTE) return zahl(o.preis) || '';
      return text(o[s], 600);
    });
  });
  var sperre = LockService.getScriptLock();
  sperre.waitLock(20000);
  try {
    var b = blatt(tab, spalten);
    if (b.getLastRow() > 1) b.getRange(2, 1, b.getLastRow() - 1, b.getLastColumn()).clearContent();
    if (zeilen.length) b.getRange(2, 1, zeilen.length, spalten.length).setValues(zeilen);
  } finally {
    sperre.releaseLock();
  }
  leereCache();
  return { ok: true };
}

/** Bild aus der App: landet öffentlich lesbar im Drive-Ordner „Website-Bilder“, die Adresse in „Inhalte“. */
function adminBild(d) {
  var slot = String(d.slot || '').replace(/[^a-z0-9-]/g, '');
  var m = String(d.daten || '').match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!slot || !m) return { ok: false, message: 'Bitte ein JPG-, PNG- oder WebP-Bild wählen.' };
  var bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > 4 * 1024 * 1024) return { ok: false, message: 'Das Bild ist zu groß (höchstens 4 MB).' };
  var ordner = websiteOrdner();
  var datei = ordner.createFile(Utilities.newBlob(bytes, m[1], slot + '-' + Date.now() + '.' + m[2]));
  datei.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://lh3.googleusercontent.com/d/' + datei.getId() + '=w1600';
  var werte = {};
  werte['bild_' + slot] = url;
  speichereSchluesselWerte(TAB_INH, werte);
  return { ok: true, url: url };
}

function websiteOrdner() {
  var id = eigenschaft('BILDER_ORDNER_ID');
  if (id) return DriveApp.getFolderById(id);
  var ordner = DriveApp.createFolder('Il Pomodoro Website-Bilder');
  PropertiesService.getScriptProperties().setProperty('BILDER_ORDNER_ID', ordner.getId());
  return ordner;
}

/* Einrichtung ------------------------------------------------------------ */

/** Legt die Tabs an und füllt Karte und Einstellungen beim ersten Mal. Wird von einrichten() aufgerufen. */
function einrichtenApp() {
  var ein = blatt(TAB_EIN, SPALTEN_EIN);
  if (ein.getLastRow() < 2) {
    ein.getRange(2, 1, Object.keys(STANDARD).length, 2).setValues(Object.keys(STANDARD).map(function (k) {
      var v = STANDARD[k];
      return [k, typeof v === 'boolean' ? (v ? 'ja' : 'nein') : v];
    }));
  }
  var karte = blatt(TAB_KARTE, SPALTEN_KARTE);
  if (karte.getLastRow() < 2) ersetzeTab(TAB_KARTE, SPALTEN_KARTE, STARTKARTE);
  blatt(TAB_WOCHE, SPALTEN_WOCHE);
  blatt(TAB_INH, SPALTEN_INH);
  if (!eigenschaft('ADMIN_PIN')) PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', '2580');
  // Ohne eigene Angabe gehen Bestell- und Reservierungsmails an das Google-Konto, dem das Skript gehört.
  if (!eigenschaft('NOTIFY_EMAIL')) {
    try {
      PropertiesService.getScriptProperties().setProperty('NOTIFY_EMAIL', Session.getEffectiveUser().getEmail());
    } catch (e) {}
  }
  leereCache();
}

// Startkarte (aus der Website übernommen). Preise in der App eintragen; ohne Preis nicht bestellbar.
var STARTKARTE = [
  { kategorie: 'Antipasti', name: 'Antipasto Verdura', beschreibung: 'Gegrilltes und eingelegtes Gemüse nach Art des Hauses', tags: 'veg' },
  { kategorie: 'Antipasti', name: 'Insalata di Mare', beschreibung: 'Meeresfrüchtesalat' },
  { kategorie: 'Antipasti', name: 'Carpaccio di Salmone', beschreibung: 'Hauchdünn geschnittener Lachs' },
  { kategorie: 'Antipasti', name: 'Carpaccio di Manzo', beschreibung: 'Hauchdünn geschnittenes Rindfleisch', tags: 'haus' },
  { kategorie: 'Pizza', name: 'Pizza Margherita', beschreibung: 'Tomatensauce, Mozzarella und Basilikum', tags: 'veg,gf' },
  { kategorie: 'Pizza', name: 'Pizza Salami', beschreibung: 'Tomatensauce, Mozzarella und Salami', tags: 'gf' },
  { kategorie: 'Pizza', name: 'Pizza Frutti di Mare', beschreibung: 'Tomatensauce, Mozzarella und Meeresfrüchte', tags: 'gf' },
  { kategorie: 'Pizza', name: 'Pizza Gialla', beschreibung: 'Sauce aus gelben Tomaten, scharfe Spianata, Rucola und Büffelmozzarella', tags: 'haus,scharf,gf' },
  { kategorie: 'Pinsa', name: 'Pinsa Gialla', beschreibung: 'Gelbe Tomaten, scharfe Spianata, Rucola und Büffelmozzarella', tags: 'scharf,gf' },
  { kategorie: 'Pinsa', name: 'Pinsa Burrata', beschreibung: 'Tomatensauce, Mozzarella, Kirschtomaten, Basilikum und Burrata', tags: 'veg,haus,gf' },
  { kategorie: 'Pasta', name: "Penne all'Arrabbiata", beschreibung: 'Scharfe Tomatensauce mit Knoblauch und Peperoncino', tags: 'veg,scharf' },
  { kategorie: 'Pasta', name: 'Tortellini alla Panna', beschreibung: 'Tortellini in Sahnesauce' },
  { kategorie: 'Pasta', name: 'Paglia e Fieno', beschreibung: 'Gelbe und grüne Bandnudeln' },
  { kategorie: 'Pasta', name: 'Fettuccine al Salmone', beschreibung: 'Bandnudeln mit Lachs', tags: 'haus' },
  { kategorie: 'Fisch und Fleisch', name: 'Salmone al Forno', beschreibung: 'Lachssteak aus dem Holzofen mit frischem Gemüse in Tomatensauce', tags: 'haus' },
];

/* Hilfen ---------------------------------------------------------------- */

function inhalt(k) {
  var z = zeilenVon(TAB_INH, SPALTEN_INH).filter(function (x) {
    return x.schluessel === k;
  })[0];
  return z ? text(z.wert) : '';
}

function erlaubteWerte(werte, schluessel) {
  var out = {};
  schluessel.forEach(function (k) {
    if (werte[k] !== undefined) out[k] = typeof werte[k] === 'boolean' ? werte[k] : text(werte[k], 500);
  });
  return out;
}

function wahr(v) {
  return v === true || /^(ja|true|1|x)$/i.test(String(v).trim());
}

function zahl(v) {
  var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.'));
  return isFinite(n) ? n : 0;
}

function nachReihenfolge(a, b) {
  return zahl(a.reihenfolge) - zahl(b.reihenfolge);
}
