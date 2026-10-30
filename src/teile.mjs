// Bausteine, die auf mehreren Seiten vorkommen.
import { icon } from '../tools/build.mjs';
import { SITE, ZEITEN, KUECHE_BIS, zeitText } from './site.mjs';

/** Öffnungszeiten als Liste; die Zeile von heute wird im Browser markiert. */
export function zeitenListe() {
  return `<dl class="hours">${ZEITEN.map(
    (z) => `<div data-days="${z.days.join(',')}"><dt>${z.tage}</dt><dd>${zeitText(z.slots)}</dd></div>`,
  ).join('')}</dl>
  <p class="fine mt-12">${KUECHE_BIS ? `Küche bis ${KUECHE_BIS} Uhr. ` : ''}An Feiertagen können die Zeiten abweichen.</p>`;
}

/** Karte mit Zwei-Klick-Lösung: Google Maps lädt erst nach Klick oder Zustimmung. */
export function karte(ctx) {
  return `<div class="map" data-map="${SITE.mapsEmbed}">
    <div class="map-consent">
      ${icon('map-pin')}
      <p><strong>Karte von Google Maps</strong></p>
      <p class="fine">Beim Laden der Karte werden Daten an Google übertragen. Mehr dazu in der <a href="${ctx.root}datenschutz/#maps">Datenschutzerklärung</a>.</p>
      <button type="button" class="btn btn-accent" data-map-load>Karte laden</button>
      <label class="check fine"><input type="checkbox" data-map-always> <span>Karten künftig immer laden</span></label>
      <a class="text-link" href="${SITE.mapsLink}" rel="noopener" target="_blank">In Google Maps öffnen${icon('arrow-up-right')}</a>
    </div>
  </div>`;
}

/** Abschnitt „Besuch“: Adresse, Zeiten, Anfahrt und Karte. */
export function besuch(ctx, { titel = 'So finden Sie uns', h = 'h2' } = {}) {
  return `<section class="section" id="besuch" aria-labelledby="besuch-title">
  <div class="wrap visit">
    <div class="reveal">
      <${h} id="besuch-title">${titel}</${h}>
      <p class="lead mt-12">${SITE.strasse}, ${SITE.plz} ${SITE.ort}. Mitten im Stuttgarter Süden, die Stadtbahn-Haltestellen Marienplatz und Österreichischer Platz sind ganz in der Nähe.</p>
      ${zeitenListe()}
      <div class="cta-actions mt-28">
        <a class="btn btn-ghost" href="${SITE.mapsLink}" rel="noopener" target="_blank">${icon('map-pin')}Route planen</a>
        <a class="btn btn-ghost" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}${SITE.telefonAnzeige}</a>
      </div>
    </div>
    ${karte(ctx)}
  </div>
</section>`;
}

/**
 * Instagram-Bereich: Wochenkarte und Neuigkeiten erscheinen auf Instagram (@ilpomodorosud).
 * Daneben ein Raster aus eigenen Fotos im Stil eines Instagram-Profils.
 */
export function instagram(ctx) {
  const fotos = [
    ['pizza-herz', 'Pizza in Herzform'],
    ['tiramisu', 'Tiramisù'],
    ['team-pasta', 'Das Küchenteam mit Pasta'],
    ['calamari', 'Calamari fritti'],
    ['pizzaiolo', 'Pizzaiolo am Holzofen'],
    ['dessert-pistazie', 'Dessert mit Pistazien'],
  ];
  return `<section class="section" id="instagram" aria-labelledby="ig-title">
  <div class="wrap">
    <div class="ig reveal">
      <div class="ig-text">
        <span class="ig-badge">${icon('instagram-logo')}Instagram</span>
        <h2 id="ig-title">Wochenkarte und Neuigkeiten auf <span class="ig-name">@${SITE.instagramName}</span></h2>
        <p class="lead">Jede Woche posten wir dort unsere neue Wochenkarte mit dem Mittagstisch. Und alles, was sonst los ist: Feiertage, Aktionen, Feiern und neue Gerichte.</p>
        <ul class="ig-punkte">
          <li>${icon('calendar-check')}Die Wochenkarte, jeden Montag neu</li>
          <li>${icon('star')}Aktionen und neue Gerichte zuerst</li>
          <li>${icon('clock')}Geänderte Öffnungszeiten und Ruhetage</li>
        </ul>
        <a class="btn btn-ig btn-lg" href="${SITE.social.instagram}" rel="noopener" target="_blank" data-track="instagram">${icon('instagram-logo')}@${SITE.instagramName} folgen</a>
      </div>
      <a class="ig-feed" href="${SITE.social.instagram}" rel="noopener" target="_blank" aria-label="Il Pomodoro auf Instagram öffnen" data-track="instagram">
        ${fotos.map(([n, alt]) => `<img src="${ctx.root}assets/img/fotos/${n}-800.jpg" alt="${alt}" width="400" height="400" loading="lazy" decoding="async">`).join('')}
      </a>
    </div>
  </div>
</section>`;
}

/** Bestellen über Lieferando und Wolt, als großer Bereich (Startseite, Speisekarte) oder kompakt. */
export function lieferung(ctx, { titel = 'Lieber zu Hause genießen?', h = 'h2' } = {}) {
  return `<section class="section-tight" id="liefern" aria-labelledby="liefern-title">
  <div class="wrap">
    <div class="liefern reveal">
      <div>
        <span class="eyebrow">A casa</span>
        <${h} id="liefern-title">${titel}</${h}>
        <p class="lead">Unsere Pizza aus dem Holzofen, Pasta und Dolci gibt es auch zum Liefern und Abholen. Bestellen Sie ganz bequem über Lieferando oder Wolt.</p>
      </div>
      <div class="liefern-buttons">
        <a class="btn-dienst btn-lieferando" href="${SITE.lieferando}" rel="noopener" target="_blank" data-track="lieferando">
          <span class="dienst-name">Lieferando</span><span class="dienst-text">Jetzt bestellen${icon('arrow-up-right')}</span>
        </a>
        <a class="btn-dienst btn-wolt" href="${SITE.wolt}" rel="noopener" target="_blank" data-track="wolt">
          <span class="dienst-name">Wolt</span><span class="dienst-text">Jetzt bestellen${icon('arrow-up-right')}</span>
        </a>
      </div>
    </div>
  </div>
</section>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
