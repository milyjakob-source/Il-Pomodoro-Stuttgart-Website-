// Alle Stammdaten an einer Stelle. Seiten, strukturierte Daten (JSON-LD), Sitemap und Footer lesen von hier.
// Werte mit PRÜFEN stammen aus öffentlichen Quellen (alte Website, Branchenverzeichnisse) und sollten
// vor dem Livegang mit dem Restaurant abgeglichen werden.

export const SITE = {
  url: 'https://www.ilpomodoro-filderstrase25.de', // ohne Schrägstrich am Ende
  name: 'Il Pomodoro',
  shortName: 'Il Pomodoro',
  claim: 'Pizza aus dem Holzofen, Pasta und Pinsa im Stuttgarter Süden',
  telefon: '+49 711 51876650',
  telefonAnzeige: '0711 51 87 66 50',
  email: 'fabrizio-ricci@t-online.de', // PRÜFEN: aus einem Branchenverzeichnis
  strasse: 'Filderstraße 25',
  plz: '70180',
  ort: 'Stuttgart',
  stadtteil: 'Stuttgart-Süd',
  geo: { lat: 48.7666, lng: 9.1724 }, // PRÜFEN: Koordinaten grob ermittelt, in Google Maps nachsehen
  inhaber: ['Fabrizio Ricci'], // PRÜFEN: Name aus der E-Mail-Adresse abgeleitet
  seit: 2012,
  // USt-IdNr. nach § 27a UStG; nur eintragen, wenn vorhanden, dann erscheint sie im Impressum. PRÜFEN
  ustId: '',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Il+Pomodoro+Filderstra%C3%9Fe+25+70180+Stuttgart',
  mapsEmbed: 'https://www.google.com/maps?q=Il+Pomodoro,+Filderstra%C3%9Fe+25,+70180+Stuttgart&output=embed',
  // Link „Bewertung schreiben“: im Google-Unternehmensprofil unter „Rezensionen erhalten“ kopieren. PRÜFEN
  reviewLink: 'https://www.google.com/maps/search/?api=1&query=Il+Pomodoro+Filderstra%C3%9Fe+25+70180+Stuttgart',
  // Google-Sternebewertung für die Anzeige, solange das Apps Script die Live-Werte nicht liefert. PRÜFEN
  googleBewertung: 4.4,
  social: {
    facebook: 'https://www.facebook.com/ilpomodorofilderstrasse/', // PRÜFEN
    instagram: '', // Handle eintragen, sonst wird kein Link gezeigt
  },
};

// Öffnungszeiten (vom Restaurant bestätigt). Wochentag nach JavaScript: 0 = Sonntag … 6 = Samstag. Leere Liste = Ruhetag.
export const ZEITEN = [
  { tage: 'Montag bis Donnerstag', kurz: 'Mo-Do', days: [1, 2, 3, 4], slots: [['11:30', '14:00'], ['17:30', '22:30']] },
  { tage: 'Freitag', kurz: 'Fr', days: [5], slots: [['11:30', '14:00'], ['17:30', '23:00']] },
  { tage: 'Samstag', kurz: 'Sa', days: [6], slots: [['17:00', '23:00']] },
  { tage: 'Sonntag', kurz: 'So', days: [0], slots: [] },
];
// Küchenschluss; leer lassen, wenn er mit den Öffnungszeiten zusammenfällt.
export const KUECHE_BIS = '';

// Hauptnavigation: sechs Seiten. Pfade sind Ordner, damit die Adressen sauber bleiben (/speisekarte/).
export const NAV = [
  { slug: '', label: 'Start' },
  { slug: 'speisekarte/', label: 'Speisekarte' },
  { slug: 'ueber-uns/', label: 'Über uns' },
  { slug: 'galerie/', label: 'Galerie' },
  { slug: 'kontakt/', label: 'Kontakt' },
  { slug: 'reservierung/', label: 'Reservieren', cta: true },
];

export const LEGAL = [
  { slug: 'impressum/', label: 'Impressum' },
  { slug: 'datenschutz/', label: 'Datenschutz' },
  { slug: 'agb/', label: 'AGB' },
];

/** Öffnungszeiten als Text, z. B. „11:30-14:00 & 17:30-22:30“, oder „Ruhetag“. */
export function zeitText(slots) {
  if (!slots.length) return 'Ruhetag';
  return slots.map(([von, bis]) => `${von}-${bis.replace('25:', '01:')}`).join(' & ');
}
