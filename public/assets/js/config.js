// Einstellungen für die Seite. Hier steht nichts Geheimes: Alles, was hier eingetragen wird, ist öffentlich
// sichtbar. Schlüssel (z. B. für die Google Places API) gehören in die Skript-Eigenschaften des Apps Scripts.
window.SITE_CONFIG = {
  // Adresse der Apps-Script-Web-App (endet auf /exec), siehe apps-script/README.md.
  // Leer: Reservierungen und Anfragen gehen als Netlify-Formular raus (E-Mail an das Restaurant).
  endpoint: '',

  // Optional: Link zu einer Google-Kalender-Terminbuchungsseite (calendar.app.google/…). Erscheint als
  // zusätzlicher Weg auf der Reservierungsseite. Leer lassen, wenn nur das Formular genutzt wird.
  googleBookingUrl: '',

  // Wochenkarte aus Google Sheets: im Sheet „Datei → Freigeben → Im Web veröffentlichen“, Tabellenblatt
  // „Wochenkarte“, Format „CSV“ wählen und die Adresse hier eintragen. Leer: Karte aus src/wochenkarte.mjs.
  wochenkarteCsv: '',

  // Google-Analytics-4-Messungs-ID (G-XXXXXXX). Leer: keine Statistik. Wird erst nach Zustimmung geladen.
  ga4Id: '',

  // Reservierung: Zeitraster und Grenzen. Muss zu den Werten im Apps Script passen.
  reservierung: {
    rasterMinuten: 15,
    maxPersonenOnline: 8, // größere Gruppen bitte telefonisch oder über das Anfrageformular
    tageImVoraus: 60,
    vorlaufMinuten: 90, // so kurzfristig kann man frühestens online reservieren
    // Letzte Reservierung vor Küchenschluss bzw. Mittagsende
    zeiten: {
      0: [], // Sonntag Ruhetag
      1: [['11:30', '13:15'], ['17:30', '21:30']],
      2: [['11:30', '13:15'], ['17:30', '21:30']],
      3: [['11:30', '13:15'], ['17:30', '21:30']],
      4: [['11:30', '13:15'], ['17:30', '21:30']],
      5: [['11:30', '13:15'], ['17:30', '22:00']],
      6: [['17:00', '22:00']], // Samstag
    },
    // Tage ohne Online-Reservierung, z. B. Betriebsferien oder Feiertage (JJJJ-MM-TT).
    geschlossen: [],
  },

  // Öffnungszeiten für den Hinweis „Jetzt geöffnet“. Leere Liste = Ruhetag.
  oeffnung: {
    0: [],
    1: [['11:30', '14:00'], ['17:30', '22:30']],
    2: [['11:30', '14:00'], ['17:30', '22:30']],
    3: [['11:30', '14:00'], ['17:30', '22:30']],
    4: [['11:30', '14:00'], ['17:30', '22:30']],
    5: [['11:30', '14:00'], ['17:30', '23:00']],
    6: [['17:00', '23:00']],
  },
};
