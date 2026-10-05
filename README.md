# Website Il Pomodoro

Neue Website für das Il Pomodoro, Filderstraße 25, 70180 Stuttgart-Süd. Ersetzt die Jimdo-Seite
ilpomodoro-filderstrase25.de. Statische Seiten ohne Framework: schnell, gut für Google, läuft auf jedem Hosting.

| Seite | Adresse | Inhalt |
|---|---|---|
| Start | `/` | Hero mit Holzofen, Status „jetzt geöffnet“, Küche, Geschichte, Bewertungen, Wochenkarte, Anfahrt mit Karte |
| Speisekarte | `/speisekarte/` | Wochenkarte (aus Google Sheets) und feste Karte nach Kategorien |
| Über uns | `/ueber-uns/` | Haus, Holzofen, Werte, Feiern |
| Galerie | `/galerie/` | Fotos im Mauerwerk-Raster |
| Kontakt | `/kontakt/` | Telefon, E-Mail, Zeiten, Karte, Anfrageformular (Feiern, Gutscheine, Abholung) |
| Reservieren | `/reservierung/` | Online-Reservierung über Google |
| Bestellen | `/bestellen/` | Bestellung zur Abholung oder Lieferung mit Warenkorb, Preise live aus der Inhaber-App |
| Inhaber-App | `/app/` | Nur für das Restaurant (PIN): Bestellungen, Reservierungen, Plätze, Karte, Texte, Bilder |
| Rechtliches | `/impressum/`, `/datenschutz/`, `/agb/`, `404.html` | |

Hell- und Dunkelmodus (folgt dem System, umschaltbar oben rechts), Einblend-Animationen und weiche
Seitenwechsel; alles respektiert „Bewegung reduzieren“.

## Arbeiten an der Seite

```bash
npm install        # einmalig, nur für die Bildaufbereitung nötig
npm run build      # Seiten aus src/ nach public/ bauen
npm run bilder     # Fotos aus bilder-original/ komprimieren, Icons und Social-Vorschau erzeugen
npm run pruefen    # Links, Meta-Texte, Alt-Texte, Labels, Kontraste, Geheimnisse prüfen
npm run vorschau   # lokal ansehen unter http://localhost:4173
```

- Texte und Stammdaten: `src/site.mjs` (Adresse, Telefon, Zeiten, Social Links), Seiten in `src/pages/`
- Speisekarte: `src/speisekarte.mjs`
- Design: `public/assets/css/style.css` (Farben als Variablen oben)
- Einstellungen fürs Frontend: `public/assets/js/config.js`

Nach jeder Änderung in `src/` einmal `npm run build`; `public/` wird mit ins Repo eingecheckt und so
veröffentlicht.

## Vor dem Livegang: offene Punkte

Die alte Website war aus dieser Arbeitsumgebung nicht abrufbar. Inhalte stammen aus öffentlichen Quellen
(Branchenverzeichnisse, Speisekarten-Portale) und sind mit dem Restaurant abzugleichen. Im Code mit
`PRÜFEN` markiert, auf den Rechtsseiten gelb hervorgehoben.

- [x] **Logo:** Original-Logo vektorisiert (`tools/logo-vektor.json`, rote und grüne Ebene). Neu erzeugen:
      `python3 tools/logo_aus_vektor.py`, dann `npm run bilder`. Die Akzentfarbe der Seite ist das Logo-Rot.
- [x] **Fotos:** Laterne mit Schild, Holzofen, Pizza mit Burrata, Gastraum, Eingang und Plätze draußen sind eingebaut. Weitere Fotos
      nach `bilder-original/` legen (Dateiname = Bildplatz), `npm run bilder`, in Seite oder Galerie eintragen.
      Eingang und Terrasse liegen nur in kleiner Auflösung vor und stehen deshalb nur in der Galerie.
- [ ] **Speisekarte und Preise** in der Inhaber-App pflegen (`src/speisekarte.mjs` ist nur noch die
      Anzeige, solange das Apps Script nicht verbunden ist). Optional PDF verlinken (`KARTE_PDF`).
- [ ] **App-PIN** 2580 nach der Einrichtung in der App ändern.
- [ ] **Wochenkarte:** in der Inhaber-App pflegen (der Weg über ein veröffentlichtes Google Sheet unten
      funktioniert weiterhin als Alternative).
- [x] **Öffnungszeiten** vom Restaurant bestätigt (Mo–Do 11:30–14:00 und 17:30–22:30, Fr bis 23:00,
      Sa 17:00–23:00, So Ruhetag). Bei Änderungen `src/site.mjs`, `public/assets/js/config.js` und
      `apps-script/Code.gs` anpassen.
- [ ] **Impressum:** Inhaber Fabrizio Ricci ist eingetragen. Eine USt-IdNr. bei `ustId` in `src/site.mjs`
      ergänzen, falls vorhanden. Rechtstexte bitte prüfen lassen.
- [ ] **E-Mail-Adresse** in `src/site.mjs` prüfen (stammt aus einem Branchenverzeichnis).
- [ ] **Google-Sternewert** in `src/site.mjs` (`googleBewertung`) prüfen; mit Places-API-Schlüssel kommt er live.

## Wochenkarte pflegen (für das Restaurant)

Die Wochenkarte steht in einer Google-Tabelle. Wer sie ändert, ändert die Website: kein Login auf der
Website, keine Programmierkenntnisse, keine neue Veröffentlichung nötig. Änderungen erscheinen nach
wenigen Minuten (Google aktualisiert veröffentlichte Tabellen mit kurzer Verzögerung).

**Einmal einrichten**
1. Mit dem Google-Konto des Restaurants eine neue Google-Tabelle anlegen, Name z. B. „Il Pomodoro Wochenkarte“.
2. *Datei → Importieren → Hochladen* und `wochenkarte-vorlage.csv` aus diesem Ordner hochladen
   („Aktuelles Tabellenblatt ersetzen“). Das Tabellenblatt in „Wochenkarte“ umbenennen.
3. *Datei → Freigeben → Im Web veröffentlichen*: Tabellenblatt „Wochenkarte“, Format
   „Kommagetrennte Werte (.csv)“, *Veröffentlichen*. Die angezeigte Adresse kopieren.
4. Die Adresse in `public/assets/js/config.js` bei `wochenkarteCsv` eintragen und die Seite einmal neu
   veröffentlichen. Danach nie wieder nötig.

**Jede Woche**
- Zeilen in der Tabelle überschreiben. Spalten: **Kategorie** (z. B. Vorspeise, Pasta, Hauptgang, Dessert
  oder Montag, Dienstag …), **Gericht**, **Beschreibung**, **Preis** (so, wie er erscheinen soll, z. B. „12,90 €“).
- Die erste Zeile mit Kategorie **Hinweis** erscheint über der Karte, z. B. „Gültig vom 6. bis 10. Oktober“.
- Leere Zeilen werden ignoriert. Zum Ausblenden eines Gerichts einfach die Zeile löschen.

Weitere Personen (z. B. Küche oder Service) bekommen über *Freigeben* in der Google-Tabelle Bearbeitungsrechte.
Ist die Tabelle einmal nicht erreichbar, zeigt die Seite die Karte aus `src/wochenkarte.mjs`.

## Reservierung über Google einrichten

Die Reservierung läuft über ein Google Apps Script im Google-Konto des Restaurants. Jede Reservierung
landet als Zeile in einer Google-Tabelle, als Termin im Google Kalender, der Gast bekommt eine
Bestätigung mit Storno-Link, das Restaurant eine Benachrichtigung. Die Seite prüft freie Plätze pro
Uhrzeit (Kapazität einstellbar), gegen Spam gibt es ein unsichtbares Feld, eine Zeitsperre und eine
Drosselung pro E-Mail. Kosten: keine.

1. Mit dem Google-Konto des Restaurants eine neue Google-Tabelle „Il Pomodoro Reservierungen“ anlegen.
2. *Erweiterungen → Apps Script*. Den Inhalt von `apps-script/Code.gs` in `Code.gs` kopieren und mit
   *Datei +* zwei weitere Skriptdateien `App` und `Bestellung` anlegen, darin `apps-script/App.gs` und
   `apps-script/Bestellung.gs`.
   Unter *Projekteinstellungen* „appsscript.json im Editor anzeigen“ einschalten und den Inhalt von
   `apps-script/appsscript.json` übernehmen.
3. *Projekteinstellungen → Skripteigenschaften*:
   - `NOTIFY_EMAIL`: Adresse, die über neue Reservierungen und Bestellungen informiert wird (leer = das
     Google-Konto, dem das Skript gehört)
   - `CALENDAR_ID` (optional): eigener Kalender „Reservierungen“ (Kalender-Einstellungen → Kalender-ID).
     Leer = Hauptkalender des Kontos.
4. Im Editor die Funktion `einrichten` auswählen und ausführen, Berechtigungen erlauben. Legt alle Tabs
   an (Reservierungen, Anfragen, Bestellungen, Einstellungen, Karte, Wochenkarte, Inhalte), füllt die Karte
   mit den Gerichten der Website, setzt die App-PIN **2580** und löscht künftig jede Nacht Reservierungen
   und Bestellungen, die älter als 90 Tage sind (Datenschutz).
5. *Bereitstellen → Neue Bereitstellung → Web-App*: „Ausführen als: Ich“, „Zugriff: Jeder“. Die Adresse
   (endet auf `/exec`) in `public/assets/js/config.js` bei `endpoint` eintragen, `npm run build`,
   veröffentlichen.
6. Testen: Reservierung auf der Seite abschicken. Zeile in der Tabelle, Termin im Kalender, zwei E-Mails.

Plätze, Sitzdauer, sofortige Bestätigung, Pause und geschlossene Tage stellt das Restaurant in der
Inhaber-App ein (siehe unten). Zeitraster und buchbare Uhrzeiten stehen oben in `Code.gs` unter
`EINSTELLUNGEN` und müssen zu `reservierung` in `config.js` passen.

Nach Änderungen am Skript: *Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Neue Version*,
damit die Adresse gleich bleibt.

**Ohne Apps Script** funktioniert das Formular trotzdem: Auf Netlify gehen Reservierungen und Anfragen als
Netlify-Formular raus (Benachrichtigung per E-Mail unter *Forms → Notifications*), der Knopf heißt dann
„Reservierung anfragen“ und das Restaurant bestätigt selbst.

**Google-Unternehmensprofil:** Unter *Profil bearbeiten → Buchungen / Reservierungen* als Link
`https://www.ilpomodoro-filderstrase25.de/reservierung/` eintragen. Dann führt der Knopf „Reservieren“ in Google Maps
und in der Suche direkt zum Formular. Wer zusätzlich eine Google-Kalender-Terminbuchungsseite nutzt, kann
deren Link in `config.js` bei `googleBookingUrl` eintragen.

## Inhaber-App (für das Restaurant)

Unter **`/app/`** (z. B. `https://www.ilpomodoro-filderstrase25.de/app/`) liegt die App für den Inhaber.
Sie braucht das Apps Script von oben und läuft im Browser auf Handy, Tablet oder Computer. Auf dem Handy
im Browser *Teilen → Zum Home-Bildschirm*, dann startet sie wie eine App. Suchmaschinen sehen sie nicht.

**Anmelden:** PIN eingeben (am Anfang **2580**, bitte gleich unter *Mehr → PIN ändern* ändern). Nach
10 falschen Versuchen ist 10 Minuten Pause. Die Anmeldung gilt, solange die App benutzt wird (6 Stunden
ohne Benutzung, dann neu anmelden).

| Bereich | Was man dort macht |
|---|---|
| **Heute** | Neue Bestellungen, offene Reservierungsanfragen, Gäste heute. Schalter: Online-Reservierung und Online-Bestellung an/aus. Knopf *Telefon-Reservierung*. |
| **Bestellungen** | Neue Bestellung *Annehmen* und die Minuten wählen (der Gast bekommt sofort eine E-Mail mit der Uhrzeit) oder *Ablehnen*. Danach *In Zubereitung* → *Losgefahren* bzw. *Abholbereit* → *Erledigt*. Adresse öffnet Google Maps, Telefonnummer ruft an. |
| **Tische** | Reservierungen pro Tag, Auslastung pro Uhrzeit, Anfragen bestätigen, *Da*, *Nicht gekommen*, *Stornieren*. *+ Reservierung* für Anrufe: Die Plätze sind auf der Website sofort vergeben. Ist es voll, fragt die App, ob trotzdem eingetragen werden soll. |
| **Karte** | Preise direkt eintippen, Schalter = online bestellbar (z. B. aus, wenn etwas ausverkauft ist). Gericht antippen zum Bearbeiten, Ausblenden oder Löschen, Pfeile zum Sortieren, *Neues Gericht*. Reiter *Wochenkarte* für die Gerichte der Woche. *Speichern* nicht vergessen. |
| **Mehr** | Plätze für Online-Reservierungen (mit Knöpfen *Sommer* und *Winter*), Sitzdauer, sofort bestätigen, geschlossene Tage, Lieferung (Liefergebiet, Mindestbestellwert, Liefergebühr, Vorlaufzeit), Texte der Website, Bilder austauschen, PIN. Einstellungen speichern sich sofort. |

Alle 20 Sekunden schaut die App nach neuen Bestellungen und Reservierungen und klingelt (Glocke oben
schaltet den Ton). Die App muss dafür geöffnet sein; zusätzlich kommt jede Bestellung per E-Mail.

Änderungen an Karte, Texten und Bildern erscheinen nach spätestens einer Minute auf der Website, ohne
Netlify und ohne neue Veröffentlichung. Alles liegt in der Google-Tabelle des Restaurants und kann dort
auch direkt bearbeitet werden. Hochgeladene Bilder landen im Google Drive im Ordner „Il Pomodoro
Website-Bilder“.

**Wichtig vor dem Start der Bestellungen:** In der App unter *Karte* alle Preise eintragen. Gerichte
ohne Preis zeigt die Website ohne Preis und sie sind nicht bestellbar. Liefergebiet (PLZ), Mindestbestellwert
und Liefergebühr unter *Mehr* prüfen; voreingestellt sind die PLZ rund um Stuttgart-Süd, 15 € und 2,50 €.

## Online-Bestellung

Die Seite `/bestellen/` zeigt die Karte mit Preisen aus der App, einen Warenkorb und die Wahl zwischen
Abholen und Liefern. Bestellbar ist nur während der Öffnungszeiten und frühestens nach der Vorlaufzeit
(Uhrzeiten im 15-Minuten-Raster oder „so schnell wie möglich“). Das Apps Script rechnet alle Preise selbst
aus der Karte nach, prüft Liefergebiet, Mindestbestellwert und Uhrzeit, speichert die Bestellung im Tab
„Bestellungen“ und schickt eine E-Mail an Restaurant und Gast. Bezahlt wird bei Übergabe. Ohne Apps
Script oder bei pausierter Bestellung zeigt die Seite die Telefonnummer.

## Google-Bewertungen und Fotos einbinden

Mit einem Places-API-Schlüssel holt das Apps Script aus dem Google-Unternehmensprofil:
- Sternedurchschnitt, Anzahl und die Top-Rezensionen (beste zuerst) für die Startseite,
- bis zu 10 Fotos, die automatisch in alle Bildrahmen gesetzt werden, für die noch kein eigenes Foto in
  `assets/img/fotos` liegt, mit Urhebernennung, wie Google es verlangt.

Eigene Fotos haben immer Vorrang. Der API-Schlüssel liegt nur im Apps Script, nie im Browser.

1. [console.cloud.google.com](https://console.cloud.google.com): Projekt anlegen, **Places API (New)**
   aktivieren, *Anmeldedaten → API-Schlüssel*. Schlüssel beschränken auf „Places API (New)“.
   Die Abfrage wird 6 Stunden zwischengespeichert; das bleibt im kostenlosen Kontingent.
2. Place ID suchen: [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   → „Il Pomodoro Filderstraße Stuttgart“.
3. Im Apps Script unter Skripteigenschaften `PLACES_API_KEY` und `PLACE_ID` eintragen.

Ohne diese Werte zeigt der Abschnitt nur die Links „Alle Bewertungen auf Google“ und „Bewertung
schreiben“ (Link dafür: Unternehmensprofil → „Rezensionen erhalten“, in `src/site.mjs` bei `reviewLink`).

## Veröffentlichen (Netlify)

1. app.netlify.com → *Add new site → Import from Git* → dieses Repo.
   **Base directory:** leer, **Publish directory:** `public`, Build command leer (steht auch in `netlify.toml`).
2. *Domain management*: `www.ilpomodoro-filderstrase25.de` und `ilpomodoro-filderstrase25.de` hinzufügen, DNS beim
   Domain-Anbieter umstellen, *HTTPS → Force HTTPS*. `netlify.toml` leitet `http://` und `www.` um und setzt
   HSTS und die Sicherheits-Header (Content-Security-Policy u. a.).
3. Alte Adressen der Jimdo-Seite (`/wochen-und-speisekarte` …) leiten per 301 auf die neuen Seiten.
4. Search Console: Domain bestätigen, `https://www.ilpomodoro-filderstrase25.de/sitemap.xml` einreichen.

Liegt die Seite stattdessen bei einem Apache-Hoster, übernimmt `public/.htaccess` dieselben Aufgaben.

## Statistik

Google Analytics 4: Messungs-ID (`G-…`) in `config.js` bei `ga4Id` eintragen. Geladen wird erst nach
Zustimmung im Cookie-Banner (Consent Mode, IP gekürzt, keine Werbefunktionen). Gemessen werden zusätzlich
`reservierung_klick`, `reservierung_gesendet`, `anfrage_gesendet` und `anruf`. In GA4 unter
*Verwaltung → Datenaufbewahrung* 14 Monate einstellen (so steht es in der Datenschutzerklärung).

## Checkliste

| # | Punkt | Umsetzung |
|---|---|---|
| 1 | Datenschutzerklärung | `/datenschutz/`, alle Dienste einzeln (Hosting, Reservierung, Maps, Analytics, Bewertungen) |
| 2 | AGB | `/agb/`, Reservierung, Storno, Gruppen, Gutscheine |
| 3 | Keine Geheimnisse im Frontend | API-Schlüssel und E-Mails in Skripteigenschaften; `npm run pruefen` sucht nach Schlüsseln |
| 4 | HTTPS erzwingen | `netlify.toml` / `.htaccess`: Umleitung, HSTS, `upgrade-insecure-requests` |
| 5 | Cookie-Banner | Gleichwertige Knöpfe, Einstellungen je Kategorie, jederzeit im Footer änderbar, nichts lädt vorher |
| 6 | Meta-Titel und Beschreibungen | je Seite eindeutig, Länge geprüft |
| 7 | Social-Vorschau | Open Graph und Twitter Card, `og.jpg` 1200 × 630 |
| 8 | Favicon | SVG, ICO, Apple-Touch-Icon, Web-Manifest |
| 9 | Sitemap und robots.txt | werden beim Build erzeugt |
| 10 | Alt-Texte | an jedem Bild, geprüft |
| 11 | Bilder komprimiert | WebP 800/1600 px + JPG, responsive `srcset`, Lazy Loading, ohne EXIF/GPS |
| 12 | Ladegeschwindigkeit | Lighthouse mobil geprüft, Schriften lokal und vorgeladen |
| 13 | Farbkontrast | WCAG AA in hell und dunkel, geprüft (mind. 5,4 : 1 für Text) |
| 14 | Mobilfreundlich | ab 320 px, feste Leiste „Anrufen / Reservieren“, Tippflächen ≥ 44 px |
| 15 | Eigene 404-Seite | `404.html` mit Wegen zu Reservierung, Karte, Start |
| 16 | Defekte Links | `npm run pruefen` prüft Links, Dateien und Anker; alte Adressen per 301 |
| 17 | Formular-Validierung | im Browser mit Fehlern am Feld, im Apps Script noch einmal serverseitig |
| 18 | Spam-Schutz | Honeypot, Zeitsperre, Drosselung, Kapazitätsprüfung unter Sperre |
| 19 | Analytik | GA4 nach Einwilligung, Ereignisse für Reservierung und Anrufe |
| 20 | Klarer Aufruf zum Handeln | „Tisch reservieren“ in Kopfzeile, Hero, Band, Mobilleiste |

Außerdem: strukturierte Daten (Restaurant mit Zeiten und Speisekarte), Google Maps erst nach Klick,
Schriften ohne Google-Fonts-Verbindung, Tastaturbedienung mit sichtbarem Fokus und Sprunglink.
