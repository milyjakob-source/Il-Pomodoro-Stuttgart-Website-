/**
 * Bestellungen von der Website (Lieferung oder Abholung). Preise rechnet das Skript selbst aus dem Tab
 * „Karte“ nach, damit niemand im Browser Preise ändern kann. Die Bestellung landet im Tab „Bestellungen“,
 * in der Inhaber-App und als E-Mail beim Restaurant; der Gast bekommt eine Eingangsbestätigung und
 * eine zweite Mail, sobald das Restaurant annimmt (mit Uhrzeit) oder ablehnt.
 */

var TAB_BEST = 'Bestellungen';
var SPALTEN_BEST = ['id', 'eingang', 'typ', 'status', 'name', 'telefon', 'email', 'strasse', 'plz', 'ort', 'wunschzeit',
  'positionen', 'zwischensumme', 'liefergebuehr', 'summe', 'bemerkung', 'fertig_um', 'geaendert'];
var STATUS_BEST = ['neu', 'angenommen', 'in Zubereitung', 'unterwegs', 'abholbereit', 'abgeschlossen', 'abgelehnt'];

function bestellen(d) {
  var o = oeffentlich();
  var B = o.bestellung;
  if (!B.aktiv) return { ok: false, message: 'Online-Bestellungen sind gerade pausiert. Bitte rufen Sie uns an: ' + EINSTELLUNGEN.restaurant.telefon };
  var heute = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (o.geschlossen.indexOf(heute) !== -1) return { ok: false, message: 'Heute nehmen wir keine Online-Bestellungen an.' };

  var b = {
    typ: d.typ === 'lieferung' ? 'lieferung' : 'abholung',
    name: text(d.name, 80),
    telefon: text(d.telefon, 30),
    email: text(d.email, 120).toLowerCase(),
    strasse: text(d.strasse, 120),
    plz: text(d.plz, 5),
    ort: text(d.ort, 60) || 'Stuttgart',
    wunschzeit: text(d.wunschzeit, 5),
    bemerkung: text(d.bemerkung, 500),
  };
  if (b.typ === 'lieferung' && !B.lieferung) return { ok: false, message: 'Lieferung ist gerade nicht möglich, gern zur Abholung.' };
  if (b.typ === 'abholung' && !B.abholung) return { ok: false, message: 'Abholung ist gerade nicht möglich.' };
  if (b.name.length < 2) return { ok: false, message: 'Bitte geben Sie Ihren Namen an.' };
  if (b.telefon.replace(/[^\d]/g, '').length < 6) return { ok: false, message: 'Bitte eine erreichbare Telefonnummer angeben.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email)) return { ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' };
  if (b.typ === 'lieferung') {
    if (b.strasse.length < 4) return { ok: false, message: 'Bitte Straße und Hausnummer angeben.' };
    if (B.plz.length && B.plz.indexOf(b.plz) === -1) return { ok: false, message: 'In die PLZ ' + b.plz + ' liefern wir leider nicht. Gern zur Abholung.' };
  }
  var zeitFehler = pruefeBestellzeit(b.wunschzeit, B.vorlaufMinuten);
  if (zeitFehler) return { ok: false, message: zeitFehler };

  // Positionen gegen die aktuelle Karte prüfen und Preise selbst berechnen.
  var nachId = {};
  o.karte.forEach(function (g) {
    nachId[g.id] = g;
  });
  var positionen = [];
  var zwischensumme = 0;
  (Array.isArray(d.positionen) ? d.positionen : []).slice(0, 60).forEach(function (p) {
    var g = nachId[String(p.id)];
    var menge = Math.min(20, Math.max(0, parseInt(p.menge, 10) || 0));
    if (!g || !g.bestellbar || !menge) return;
    positionen.push({ id: g.id, name: g.name, menge: menge, preis: g.preis, notiz: text(p.notiz, 120) });
    zwischensumme += g.preis * menge;
  });
  if (!positionen.length) return { ok: false, message: 'Ihr Warenkorb ist leer oder die Gerichte sind gerade nicht verfügbar.' };
  zwischensumme = runde(zwischensumme);
  var gebuehr = b.typ === 'lieferung' ? runde(B.liefergebuehr) : 0;
  if (b.typ === 'lieferung' && zwischensumme < B.mindestbestellwert) {
    return { ok: false, message: 'Der Mindestbestellwert für Lieferungen ist ' + euro(B.mindestbestellwert) + '.' };
  }

  b.id = neueId('B');
  b.eingang = new Date();
  b.status = 'neu';
  b.positionen = JSON.stringify(positionen);
  b.zwischensumme = zwischensumme;
  b.liefergebuehr = gebuehr;
  b.summe = runde(zwischensumme + gebuehr);
  b.fertig_um = '';
  b.geaendert = new Date();
  blatt(TAB_BEST, SPALTEN_BEST).appendRow(SPALTEN_BEST.map(function (s) {
    return b[s] === undefined ? '' : b[s];
  }));

  var liste = positionen.map(function (p) {
    return p.menge + ' × ' + p.name + (p.notiz ? ' (' + p.notiz + ')' : '') + '  ' + euro(p.preis * p.menge);
  }).join('\n');
  mailRestaurant(
    'Neue Bestellung (' + (b.typ === 'lieferung' ? 'Lieferung' : 'Abholung') + '): ' + euro(b.summe) + ', ' + b.name,
    [
      ['Art', b.typ === 'lieferung' ? 'Lieferung' : 'Abholung'], ['Wunschzeit', b.wunschzeit || 'so schnell wie möglich'],
      ['Name', b.name], ['Telefon', b.telefon], ['E-Mail', b.email],
      ['Adresse', b.typ === 'lieferung' ? b.strasse + ', ' + b.plz + ' ' + b.ort : '–'],
      ['Bestellung', liste], ['Liefergebühr', euro(gebuehr)], ['Summe', euro(b.summe)], ['Bemerkung', b.bemerkung || '–'],
    ],
    b.email,
  );
  mailBestellung(b, positionen, 'eingang');
  return { ok: true, id: b.id, summe: b.summe };
}

/** Wunschzeit leer = so schnell wie möglich (nur während der Öffnungszeit), sonst heute, mit Vorlauf. */
function pruefeBestellzeit(wunsch, vorlauf) {
  var jetzt = minuten(Utilities.formatDate(new Date(), TZ, 'HH:mm'));
  var tag = Number(Utilities.formatDate(new Date(), TZ, 'u')) % 7; // 1 = Montag … 7 = Sonntag → 0
  var offen = (EINSTELLUNGEN.oeffnung || {})[tag] || [];
  function inOeffnung(m) {
    return offen.some(function (s) {
      return m >= minuten(s[0]) && m <= minuten(s[1]) - 15;
    });
  }
  if (!offen.length) return 'Heute haben wir Ruhetag. Bestellen Sie gern an einem anderen Tag.';
  if (!wunsch) {
    return inOeffnung(jetzt + vorlauf) ? '' : 'Gerade nehmen wir keine Bestellungen an. Wählen Sie eine Uhrzeit während unserer Öffnungszeiten.';
  }
  if (!/^\d{2}:\d{2}$/.test(wunsch)) return 'Bitte eine gültige Uhrzeit wählen.';
  var w = minuten(wunsch);
  if (w < jetzt + vorlauf) return 'Bitte wählen Sie eine Uhrzeit frühestens in ' + vorlauf + ' Minuten.';
  if (!inOeffnung(w)) return 'Um ' + wunsch + ' Uhr haben wir geschlossen. Bitte eine andere Uhrzeit wählen.';
  return '';
}

function bestellungenListe(alle) {
  var heute = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  return zeilenVon(TAB_BEST, SPALTEN_BEST)
    .filter(function (z) {
      var tag = z.eingang instanceof Date ? Utilities.formatDate(z.eingang, TZ, 'yyyy-MM-dd') : '';
      return alle ? true : tag === heute || ['neu', 'angenommen', 'in Zubereitung', 'unterwegs', 'abholbereit'].indexOf(z.status) !== -1;
    })
    .map(function (z) {
      var pos = [];
      try {
        pos = JSON.parse(z.positionen || '[]');
      } catch (e) {}
      return {
        id: z.id, eingang: z.eingang instanceof Date ? z.eingang.toISOString() : String(z.eingang), typ: z.typ, status: z.status,
        name: z.name, telefon: z.telefon, email: z.email, strasse: z.strasse, plz: z.plz, ort: z.ort,
        wunschzeit: zeitText(z.wunschzeit), positionen: pos, liefergebuehr: zahl(z.liefergebuehr), summe: zahl(z.summe),
        bemerkung: z.bemerkung, fertig_um: zeitText(z.fertig_um),
      };
    })
    .sort(function (a, b) {
      return a.eingang < b.eingang ? 1 : -1;
    })
    .slice(0, alle ? 200 : 100);
}

function bestellungStatus(d) {
  if (STATUS_BEST.indexOf(d.status) === -1) return { ok: false, message: 'Unbekannter Status.' };
  var b = blatt(TAB_BEST, SPALTEN_BEST);
  var daten = b.getDataRange().getValues();
  var kopf = daten[0];
  for (var i = 1; i < daten.length; i++) {
    if (daten[i][kopf.indexOf('id')] !== d.id) continue;
    var z = {};
    kopf.forEach(function (k, j) {
      z[k] = daten[i][j];
    });
    var setze = function (k, v) {
      b.getRange(i + 1, kopf.indexOf(k) + 1).setValue(v);
      z[k] = v;
    };
    setze('status', d.status);
    setze('geaendert', new Date());
    if (d.status === 'angenommen') {
      var min = Math.max(5, Math.min(180, parseInt(d.minuten, 10) || 30));
      var fertig = Utilities.formatDate(new Date(Date.now() + min * 60000), TZ, 'HH:mm');
      b.getRange(i + 1, kopf.indexOf('fertig_um') + 1).setNumberFormat('@');
      setze('fertig_um', fertig);
      mailBestellung(z, JSON.parse(z.positionen || '[]'), 'angenommen');
    }
    if (d.status === 'abgelehnt') mailBestellung(z, JSON.parse(z.positionen || '[]'), 'abgelehnt', text(d.grund, 200));
    return { ok: true, fertig_um: z.fertig_um };
  }
  return { ok: false, message: 'Bestellung nicht gefunden.' };
}

function mailBestellung(b, positionen, art, grund) {
  if (!b.email) return;
  var R = EINSTELLUNGEN.restaurant;
  var lief = b.typ === 'lieferung';
  var titel = {
    eingang: 'Danke, Ihre Bestellung ist bei uns.',
    angenommen: lief ? 'Ihre Bestellung kommt gegen ' + b.fertig_um + ' Uhr.' : 'Ihre Bestellung ist gegen ' + b.fertig_um + ' Uhr abholbereit.',
    abgelehnt: 'Ihre Bestellung können wir leider nicht annehmen.',
  }[art];
  var text1 = {
    eingang: 'Wir prüfen Ihre Bestellung und schicken Ihnen gleich eine Bestätigung mit Uhrzeit.',
    angenommen: lief ? 'Wir bereiten alles frisch zu und liefern an ' + esc(b.strasse) + ', ' + esc(b.plz) + '. Bezahlt wird bei Übergabe.' : 'Holen Sie Ihre Bestellung bei uns ab: ' + esc(R.adresse) + '. Bezahlt wird bei Abholung.',
    abgelehnt: (grund ? esc(grund) + ' ' : '') + 'Rufen Sie uns gern an: ' + esc(R.telefon) + '.',
  }[art];
  var zeilen = positionen.map(function (p) {
    return '<tr><td style="padding:4px 12px 4px 0">' + p.menge + ' × ' + esc(p.name) + '</td><td style="text-align:right">' + euro(p.preis * p.menge) + '</td></tr>';
  }).join('');
  if (lief && zahl(b.liefergebuehr)) zeilen += '<tr><td style="padding:4px 12px 4px 0">Liefergebühr</td><td style="text-align:right">' + euro(b.liefergebuehr) + '</td></tr>';
  zeilen += '<tr><td style="padding:8px 12px 4px 0"><strong>Summe</strong></td><td style="text-align:right"><strong>' + euro(b.summe) + '</strong></td></tr>';
  MailApp.sendEmail({
    to: b.email,
    subject: titel + ' (' + R.name + ')',
    htmlBody:
      '<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#151a17;max-width:520px">' +
      '<h1 style="font-size:22px;margin:0 0 12px">' + esc(titel) + '</h1><p>Hallo ' + esc(b.name) + ',</p><p>' + text1 + '</p>' +
      (art !== 'abgelehnt' ? '<table style="border-collapse:collapse;font-size:15px">' + zeilen + '</table>' : '') +
      '<p>' + esc(R.name) + ', ' + esc(R.adresse) + ', ' + esc(R.telefon) + '</p></div>',
    name: R.name,
    replyTo: eigenschaft('NOTIFY_EMAIL') || undefined,
  });
}

function euro(n) {
  return zahl(n).toFixed(2).replace('.', ',') + ' €';
}

function runde(n) {
  return Math.round(zahl(n) * 100) / 100;
}
