/**
 * Il Pomodoro – Tageskarte, Wochenkarte und Neuigkeiten aus Google Drive.
 *
 * Was das Skript macht: Die Website fragt hier an, welche Bilder gerade in den Drive-Ordnern
 * „Tageskarte“, „Wochenkarte“ und „Neuigkeiten“ liegen. Das Skript schaut nach und antwortet mit
 * den neuesten Bildern. Es ändert und speichert nichts.
 *
 * Einrichtung (einmalig):
 *  1. script.google.com → Neues Projekt → diesen Code komplett einfügen (alten Code ersetzen).
 *  2. Speichern, oben „pruefen“ auswählen → Ausführen → Berechtigung erlauben.
 *  3. Bereitstellen → Neue Bereitstellung → Typ „Web-App“ → Ausführen als „Ich“,
 *     Zugriff „Jeder“ → Bereitstellen → Web-App-URL (endet auf /exec) kopieren.
 *
 * Neue Bilder brauchen keinerlei Änderung hier: einfach in den Drive-Ordner hochladen.
 */

// Die freigegebenen Drive-Ordner. Reihenfolge egal: Das Skript erkennt Tageskarte, Wochenkarte und
// Neuigkeiten am Ordnernamen. Auch der Hauptordner darf dabei sein (dann werden seine Unterordner gesucht).
var ORDNER = [
  '1kah0Du0Xu9l2rJZLMxwg2GoidRDu3rX2',
  '1lYqGs0SjhRlLZEF0jEf3qTMUXU4rQ7vl',
  '1bfUc4jFDdtFt4Q6-G6Zn1oiPdLax-S7u',
  '1i6s6FRENioYCZ076MtPljjmCyPERi-aH',
];

var BEREICHE = {
  tageskarte: /tages/i,
  wochenkarte: /wochen/i,
  neuigkeiten: /neuigkeit|news|aktuell/i,
};
var MAX_BILDER = 4; // so viele Bilder je Bereich, neueste zuerst
var CACHE_SEKUNDEN = 300; // neue Bilder erscheinen nach spätestens 5 Minuten

function doGet() {
  var cache = CacheService.getScriptCache();
  var gemerkt = cache.get('karten');
  if (gemerkt) return antwort(gemerkt);
  var text;
  try {
    text = JSON.stringify(sammeln());
  } catch (fehler) {
    console.error(fehler);
    text = JSON.stringify({ ok: false, message: String(fehler) });
    return antwort(text);
  }
  cache.put('karten', text, CACHE_SEKUNDEN);
  return antwort(text);
}

/** Zum Testen im Editor: zeigt im Protokoll, welche Ordner und Bilder gefunden werden. */
function pruefen() {
  CacheService.getScriptCache().remove('karten');
  console.log(JSON.stringify(sammeln(), null, 2));
}

function sammeln() {
  var ordner = findeOrdner();
  var ergebnis = { ok: true, stand: new Date().toISOString() };
  Object.keys(BEREICHE).forEach(function (bereich) {
    ergebnis[bereich] = ordner[bereich] ? bilderIn(ordner[bereich]) : [];
  });
  ergebnis.gefunden = Object.keys(ordner); // hilft bei der Fehlersuche
  return ergebnis;
}

/** Ordnet die freigegebenen Ordner (und ggf. Unterordner) den Bereichen zu. */
function findeOrdner() {
  var gefunden = {};
  function zuordnen(f) {
    var name = f.getName();
    Object.keys(BEREICHE).forEach(function (bereich) {
      if (!gefunden[bereich] && BEREICHE[bereich].test(name)) gefunden[bereich] = f;
    });
  }
  ORDNER.forEach(function (id) {
    var f;
    try {
      f = DriveApp.getFolderById(id);
    } catch (e) {
      console.warn('Ordner nicht erreichbar: ' + id);
      return;
    }
    zuordnen(f);
    var unter = f.getFolders();
    while (unter.hasNext()) zuordnen(unter.next());
  });
  return gefunden;
}

/** Bilder eines Ordners, neueste zuerst. Andere Dateien (PDF, Dokumente) werden übersprungen. */
function bilderIn(ordner) {
  var liste = [];
  var dateien = ordner.getFiles();
  while (dateien.hasNext()) {
    var d = dateien.next();
    if (d.isTrashed() || String(d.getMimeType()).indexOf('image/') !== 0) continue;
    liste.push({ datei: d, zeit: Math.max(d.getDateCreated().getTime(), d.getLastUpdated().getTime()) });
  }
  liste.sort(function (a, b) {
    return b.zeit - a.zeit;
  });
  return liste.slice(0, MAX_BILDER).map(function (x) {
    var id = x.datei.getId();
    return {
      id: id,
      titel: x.datei.getName().replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim(),
      datum: new Date(x.zeit).toISOString(),
      // Google liefert das Bild als JPG aus, auch iPhone-Fotos (HEIC); „=w2000“ begrenzt die Breite.
      bild: 'https://lh3.googleusercontent.com/d/' + id + '=w2000',
      vorschau: 'https://lh3.googleusercontent.com/d/' + id + '=w800',
    };
  });
}

function antwort(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
