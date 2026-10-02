// Bausteine, die auf mehreren Seiten vorkommen.
import { icon } from '../tools/build.mjs';
import { SITE, ZEITEN, KUECHE_BIS, zeitText } from './site.mjs';
import { WOCHENKARTE } from './wochenkarte.mjs';

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
 * Wochenkarte: wird beim Bauen aus src/wochenkarte.mjs gefüllt und im Browser aus dem Google Sheet
 * aktualisiert (assets/js/wochenkarte.js). kompakt: nur die ersten Gerichte, mit Link zur ganzen Karte.
 */
export function wochenkarte(ctx, { kompakt = false } = {}) {
  const liste = WOCHENKARTE.gerichte;
  const gruppen = [];
  for (const g of kompakt ? liste.slice(0, 6) : liste) {
    let gr = gruppen.find((x) => x.titel === (g.kategorie || ''));
    if (!gr) gruppen.push((gr = { titel: g.kategorie || '', gerichte: [] }));
    gr.gerichte.push(g);
  }
  const inhalt = gruppen.length
    ? gruppen
        .map(
          (gr) => `<div class="wk-gruppe">${gr.titel ? `<h3 class="wk-titel">${esc(gr.titel)}</h3>` : ''}<ul class="wk-liste">${gr.gerichte
            .map(
              (g) => `<li><div><strong>${esc(g.gericht)}</strong>${g.beschreibung ? `<span>${esc(g.beschreibung)}</span>` : ''}</div>${g.preis ? `<em>${esc(g.preis)}</em>` : ''}</li>`,
            )
            .join('')}</ul></div>`,
        )
        .join('')
    : `<p class="wk-leer">Die Wochenkarte wird gerade aktualisiert. Fragen Sie gern telefonisch nach den Gerichten der Woche: <a href="tel:${SITE.telefon.replace(/\s/g, '')}">${SITE.telefonAnzeige}</a></p>`;
  return `<section class="section${kompakt ? '-tight' : ''}" id="wochenkarte" aria-labelledby="wk-title">
  <div class="wrap">
    <div class="wk-karte reveal" data-wochenkarte data-kompakt="${kompakt ? '1' : ''}">
      <div class="wk-kopf">
        <div>
          <h2 id="wk-title">Wochenkarte</h2>
          <p class="muted" data-wk-hinweis>${esc(WOCHENKARTE.hinweis || 'Frisch für diese Woche, mittags und abends.')}</p>
        </div>
        ${kompakt ? `<a class="btn btn-ghost" href="${ctx.root}speisekarte/#wochenkarte">Ganze Karte${icon('arrow-right', 'icon icon-move')}</a>` : ''}
      </div>
      <div class="wk-inhalt" data-wk-inhalt>${inhalt}</div>
    </div>
  </div>
</section>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
