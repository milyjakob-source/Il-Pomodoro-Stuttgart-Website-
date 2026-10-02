// Wochenkarte als Rückfall, falls kein Google Sheet verbunden ist (config.js → wochenkarteCsv).
// Mit Google Sheet pflegt das Restaurant die Karte selbst; dann wird diese Liste nur angezeigt,
// solange das Sheet noch lädt oder nicht erreichbar ist.
//
// Felder: kategorie (z. B. „Vorspeise“, „Pasta“, „Montag“), gericht, beschreibung, preis (Text, z. B. „12,90 €“).
// hinweis: Zeile über der Karte, z. B. „Gültig vom 6. bis 10. Oktober“.

export const WOCHENKARTE = {
  hinweis: '',
  gerichte: [],
};
