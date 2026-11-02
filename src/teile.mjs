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

/** Knöpfe zu Instagram und Facebook, gleich groß. */
export function socialKnoepfe(extraKlasse = '') {
  return `<div class="social-knoepfe ${extraKlasse}">
    <a class="btn-social btn-instagram" href="${SITE.social.instagram}" rel="noopener" target="_blank" data-track="instagram">${icon('instagram-logo')}<span><b>Instagram</b><small>@${SITE.instagramName}</small></span></a>
    <a class="btn-social btn-facebook" href="${SITE.social.facebook}" rel="noopener" target="_blank" data-track="facebook">${icon('facebook-logo')}<span><b>Facebook</b><small>Il Pomodoro Filderstraße</small></span></a>
  </div>`;
}

/**
 * Bereich „Instagram und Facebook“: Tages-, Wochenkarte und Neuigkeiten erscheinen auch dort.
 * Daneben ein Raster aus eigenen Fotos im Stil eines Social-Media-Profils.
 */
export function social(ctx) {
  const fotos = [
    ['pizza-herz', 'Pizza in Herzform'],
    ['pasta-gamberi', 'Pasta mit Garnelen'],
    ['pizzen-ofen', 'Pizzen im Holzofen'],
    ['calamari', 'Calamari fritti'],
    ['pizzaiolo-herz', 'Pizzaiolo mit Herz-Pizza'],
    ['tiramisu', 'Tiramisù'],
  ];
  return `<section class="section" id="social" aria-labelledby="ig-title">
  <div class="wrap">
    <div class="ig reveal">
      <div class="ig-text">
        <span class="ig-badge">${icon('instagram-logo')}${icon('facebook-logo', 'icon fb')}Instagram &amp; Facebook</span>
        <h2 id="ig-title">Folgen Sie uns auf <span class="ig-name">Instagram</span> und <span class="ig-name">Facebook</span></h2>
        <p class="lead">Dort posten wir die Tageskarte, die Wochenkarte und alles, was sonst los ist: Feiertage, Aktionen, Feiern und neue Gerichte.</p>
        <ul class="ig-punkte">
          <li>${icon('calendar-check')}Tages- und Wochenkarte, immer aktuell</li>
          <li>${icon('star')}Aktionen und neue Gerichte zuerst</li>
          <li>${icon('clock')}Geänderte Öffnungszeiten und Ruhetage</li>
        </ul>
        ${socialKnoepfe()}
      </div>
      <a class="ig-feed" href="${SITE.social.instagram}" rel="noopener" target="_blank" aria-label="Il Pomodoro auf Instagram öffnen" data-track="instagram">
        ${fotos.map(([n, alt]) => `<img src="${ctx.root}assets/img/fotos/${n}-800.jpg" alt="${alt}" width="400" height="400" loading="lazy" decoding="async">`).join('')}
      </a>
    </div>
  </div>
</section>`;
}

/**
 * Seiten Tageskarte, Wochenkarte und Neuigkeiten: Das aktuelle Bild kommt aus dem Google-Drive-Ordner
 * (über das Google-Skript, siehe apps-script/Karten.gs) und erscheint groß. Ohne Bild: Hinweis auf
 * Instagram und Facebook. Logik in assets/js/karten.js.
 */
export function karteSeite(ctx, { bereich, titel, eyebrow, lead, leer }) {
  return `<section class="wrap page-hero karten-hero">
  <span class="eyebrow">${eyebrow}</span>
  <h1>${titel}</h1>
  <p class="lead">${lead}</p>
</section>

<section class="wrap karten" data-karten="${bereich}" aria-live="polite">
  <div class="karten-laden" data-karten-laden>
    <div class="karten-skelett"></div>
    <p class="fine">${titel} wird geladen …</p>
  </div>
  <div class="karten-inhalt" data-karten-inhalt hidden></div>
  <div class="karten-leer" data-karten-leer hidden>
    <span class="karten-leer-icon">${icon('calendar-check')}</span>
    <h2>${leer}</h2>
    <p class="lead">Auf Instagram und Facebook posten wir alles Aktuelle, schauen Sie dort vorbei.</p>
    ${socialKnoepfe('social-knoepfe-gross')}
    <p class="fine">Oder rufen Sie uns an: <a href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${SITE.telefonAnzeige}</a></p>
  </div>
</section>

<section class="section-tight">
  <div class="wrap karten-social">
    <div>
      <h2>Auch auf Instagram und Facebook</h2>
      <p class="muted">Tageskarte, Wochenkarte und Neuigkeiten erscheinen auch auf unseren Kanälen. Folgen Sie uns, dann verpassen Sie nichts.</p>
    </div>
    ${socialKnoepfe()}
  </div>
</section>

<div class="lightbox" data-lightbox hidden role="dialog" aria-modal="true" aria-label="Bild vergrößert">
  <button class="lightbox-zu" type="button" data-lightbox-zu aria-label="Schließen">${icon('x')}</button>
  <img data-lightbox-bild alt="">
</div>`;
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
