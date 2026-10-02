import { SITE } from '../site.mjs';

export default {
  id: 'legal',
  slug: 'agb/',
  priority: 0.2,
  title: 'AGB und Reservierungsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen des Il Pomodoro für Reservierungen, Gruppen, Feiern und Gutscheine.',
  body: (ctx) => `
<section class="wrap page-hero"><h1>AGB und Reservierungs&shy;bedingungen</h1><p class="lead">Kurz und fair: So handhaben wir Reservierungen, Feiern und Gutscheine.</p></section>
<div class="wrap legal-text">
  <h2>1. Geltungsbereich</h2>
  <p>Diese Bedingungen gelten für Tischreservierungen, Gruppen- und Veranstaltungsbuchungen sowie Gutscheine des ${SITE.name}, ${SITE.inhaber.join(' und ')}, ${SITE.strasse}, ${SITE.plz} ${SITE.ort}. Für den Restaurantbesuch ohne Reservierung gelten die gesetzlichen Bestimmungen.</p>

  <h2>2. Reservierung</h2>
  <ul>
    <li>Eine Online-Reservierung ist verbindlich, sobald Sie unsere Bestätigung per E-Mail erhalten. Bei Reservierungen, die wir erst prüfen müssen, melden wir uns per E-Mail oder Telefon.</li>
    <li>Reservierte Tische halten wir 15 Minuten nach der vereinbarten Uhrzeit frei. Danach können wir den Tisch anderweitig vergeben, wenn Sie sich nicht gemeldet haben.</li>
    <li>Ein Anspruch auf einen bestimmten Tisch oder Platz besteht nicht; Wünsche berücksichtigen wir gern.</li>
  </ul>

  <h2>3. Änderung und Stornierung</h2>
  <ul>
    <li>Bitte ändern oder stornieren Sie spätestens 24 Stunden vor dem Termin, über den Link in der Bestätigung oder telefonisch unter ${SITE.telefonAnzeige}.</li>
    <li>Für Reservierungen bis 8 Personen berechnen wir keine Stornogebühr.</li>
    <li>Für Gruppen ab 9 Personen und Veranstaltungen gelten die mit Ihnen vereinbarten Bedingungen; bitte sagen Sie solche Reservierungen spätestens 48 Stunden vorher ab.</li>
  </ul>

  <h2>4. Gruppen und Feiern</h2>
  <p>Ab 9 Personen stimmen wir Menü, Ablauf und Preise individuell ab. Wir können eine Anzahlung verlangen, die mit der Rechnung verrechnet wird. Die endgültige Personenzahl teilen Sie uns bitte spätestens drei Tage vorher mit; sie ist Grundlage der Abrechnung.</p>

  <h2>5. Gutscheine</h2>
  <ul>
    <li>Gutscheine sind drei Jahre gültig, gerechnet ab dem Ende des Jahres, in dem sie gekauft wurden (§ 195 BGB).</li>
    <li>Gutscheine können nicht bar ausgezahlt werden. Ein Restbetrag bleibt auf dem Gutschein erhalten.</li>
    <li>Für verlorene Gutscheine leisten wir keinen Ersatz.</li>
  </ul>

  <h2>6. Allergien und Unverträglichkeiten</h2>
  <p>Bitte teilen Sie uns Allergien und Unverträglichkeiten bei der Reservierung oder vor der Bestellung mit. Informationen zu Allergenen erhalten Sie beim Service. Spuren von Allergenen können wir in unserer Küche nicht vollständig ausschließen.</p>

  <h2>7. Zahlung</h2>
  <p>Die Rechnung ist am Ende des Besuchs fällig. Welche Zahlungsarten wir annehmen, sagt Ihnen gern unser Service.</p>

  <h2>8. Haftung</h2>
  <p>Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit. Für leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten, begrenzt auf den vorhersehbaren Schaden. Für mitgebrachte Garderobe und Wertgegenstände haften wir nur nach den gesetzlichen Vorschriften (§§ 701 ff. BGB).</p>

  <h2>9. Datenschutz</h2>
  <p>Wie wir Ihre Daten bei Reservierung und Anfrage verarbeiten, steht in der <a href="${ctx.root}datenschutz/">Datenschutzerklärung</a>.</p>

  <h2>10. Schlussbestimmungen</h2>
  <p>Es gilt deutsches Recht. Sollte eine Bestimmung unwirksam sein, bleibt der Rest wirksam.</p>
  
</div>
`,
};
