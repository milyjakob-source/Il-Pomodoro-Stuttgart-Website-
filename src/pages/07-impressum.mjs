import { SITE } from '../site.mjs';

export default {
  id: 'legal',
  slug: 'impressum/',
  priority: 0.2,
  title: 'Impressum',
  description: 'Impressum des Il Pomodoro, Filderstraße 25, 70180 Stuttgart.',
  body: () => `
<section class="wrap page-hero"><h1>Impressum</h1></section>
<div class="wrap legal-text">
  <h2>Angaben gemäß § 5 DDG</h2>
  <p>${SITE.name}, Pizzeria und Ristorante<br>
  Inhaber: ${SITE.inhaber.join(', ')}<br>
  ${SITE.strasse}<br>
  ${SITE.plz} ${SITE.ort}</p>

  <h2>Kontakt</h2>
  <p>Telefon: <a href="tel:${SITE.telefon.replace(/\s/g, '')}">${SITE.telefonAnzeige}</a><br>
  E-Mail: <a href="mailto:${SITE.email}">${SITE.email}</a></p>

  ${SITE.ustId ? `<h2>Umsatzsteuer</h2>
  <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${SITE.ustId}</p>
` : ''}
  <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
  <p>${SITE.inhaber[0]}, ${SITE.strasse}, ${SITE.plz} ${SITE.ort}</p>

  <h2>Verbraucherstreitbeilegung</h2>
  <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

  <h2>Haftung für Inhalte</h2>
  <p>Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Bei Bekanntwerden von Rechtsverletzungen entfernen wir diese Inhalte umgehend.</p>

  <h2>Haftung für Links</h2>
  <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.</p>

  <h2>Urheberrecht</h2>
  <p>Die Inhalte und Werke auf diesen Seiten, insbesondere Texte und Fotos, unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung. Bewertungstexte stammen von Google-Nutzerinnen und -Nutzern und werden mit Namensnennung angezeigt.</p>
</div>
`,
};
