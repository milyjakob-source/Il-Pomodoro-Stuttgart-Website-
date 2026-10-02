import { icon, foto, restaurantJsonLd } from '../../tools/build.mjs';
import { SITE, ZEITEN, KUECHE_BIS, zeitText } from '../site.mjs';
import { besuch, wochenkarte } from '../teile.mjs';

const GERICHTE = [
  'Pizza Gialla',
  'Pinsa Burrata',
  'Fettuccine al Salmone',
  'Salmone al Forno',
  'Penne all\'Arrabbiata',
  'Carpaccio di Manzo',
  'Paglia e Fieno',
  'Pizza Margherita',
];

// Was Gäste in ihren Bewertungen am häufigsten loben (zusammengefasst, keine Zitate). Echte Rezensionen
// ersetzen diese Karten automatisch, sobald das Apps Script mit Places-API-Schlüssel läuft.
const LOB = [
  ['Pizza und Pasta', 'Super lecker und zu richtig fairen Preisen: das Essen ist der meistgenannte Grund für fünf Sterne.', 'cooking-pot'],
  ['Herzlicher Service', 'Freundlich, aufmerksam und entgegenkommend, auch wenn das Lokal voll ist.', 'users-three'],
  ['Pizza-Show am Ofen', 'Gäste sehen zu, wie der Teig durch die Luft fliegt, bevor er in den Holzofen kommt.', 'fork-knife'],
];

function sterne(n) {
  const voll = icon('star-fill');
  const leer = voll.replace('class="icon"', 'class="icon is-empty"');
  return Array.from({ length: 5 }, (_, i) => (i < Math.round(n) ? voll : leer)).join('');
}

export default {
  id: 'start',
  slug: '',
  priority: 1,
  title: 'Start',
  description:
    'Il Pomodoro in Stuttgart-Süd: Pizza aus dem Holzofen, Pinsa, Pasta, Fisch und Fleisch zu fairen Preisen. Wochenkarte, Mittagstisch, Tisch online reservieren.',
  jsonld: restaurantJsonLd(),
  body: (ctx) => `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1>Pizza aus dem Holzofen im <em>Stuttgarter Süden</em></h1>
      <p class="lead">Pizza, Pinsa und Pasta an der Filderstraße. Seit ${SITE.seit} mittags und abends, zu fairen Preisen.</p>
      <div class="hero-actions">
        <a class="btn btn-accent btn-lg" href="${ctx.root}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
        <a class="btn btn-ghost btn-lg" href="${ctx.root}speisekarte/">Speisekarte${icon('arrow-right', 'icon icon-move')}</a>
      </div>
    </div>
    <div class="hero-media">
      ${foto(ctx, 'holzofen', 'Feuer im Holzofen des Il Pomodoro', { eager: true, ratio: 'portrait', sizes: '(min-width: 1024px) 48vw, 100vw' })}
      ${foto(ctx, 'pizza-burrata', 'Pizza mit Burrata, Pistazie und Basilikum', { cls: 'media-small', ratio: 'square', sizes: '240px' })}
    </div>
  </div>
</section>

<section class="wrap" aria-label="Auf einen Blick">
  <div class="facts reveal-stagger">
    <div class="fact">${icon('clock')}<div><strong class="status" data-open-status>Mo-Fr mittags und abends</strong><span class="muted">Sonntag Ruhetag</span></div></div>
    <div class="fact">${icon('map-pin')}<div><strong><a href="${SITE.mapsLink}" rel="noopener" target="_blank">${SITE.strasse}</a></strong><span class="muted">${SITE.plz} ${SITE.ort}-Süd</span></div></div>
    <div class="fact">${icon('phone')}<div><strong><a href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${SITE.telefonAnzeige}</a></strong><span class="muted">Reservierung und Abholung</span></div></div>
  </div>
</section>

<section class="section" id="kueche">
  <div class="wrap">
    <div class="section-head reveal">
      <span class="eyebrow">La cucina</span>
      <h2>Holzofen, Pasta und Pinsa</h2>
    </div>
    <div class="bento reveal-stagger">
      <a class="tile tile-a" href="${ctx.root}speisekarte/#pizza">
        ${foto(ctx, 'pizza-burrata', 'Pizza aus dem Holzofen mit Burrata und Basilikum', { sizes: '(min-width: 768px) 58vw, 100vw' })}
        <div class="tile-body"><h3>Pizza aus dem Holzofen</h3><p>Von der Margherita bis zur Pizza Gialla mit gelben Tomaten und scharfer Spianata. Jede Pizza gibt es auch glutenfrei.</p></div>
      </a>
      <a class="tile tile-b tile-plain tile-accent" href="${ctx.root}speisekarte/#pinsa">
        ${icon('leaf', 'icon tile-icon')}
        <div class="tile-body"><h3>Pinsa</h3><p>Luftig, knusprig und leicht, zum Beispiel mit Kirschtomaten, Basilikum und Burrata.</p></div>
      </a>
      <a class="tile tile-c tile-plain" href="${ctx.root}speisekarte/#pasta">
        ${icon('cooking-pot', 'icon tile-icon')}
        <div class="tile-body"><h3>Pasta, Fisch und Fleisch</h3><p>Fettuccine al Salmone, Lachs aus dem Holzofen und wechselnde Gerichte auf der Wochenkarte.</p></div>
      </a>
      <div class="tile tile-d">
        <div>
          <h3>Mittagstisch von Montag bis Freitag</h3>
          <p>Von 11:30 bis 14:00 Uhr. Was es diese Woche gibt, steht auf unserer Wochenkarte.</p>
        </div>
        <a class="btn btn-ghost" href="${ctx.root}speisekarte/#wochenkarte">Zur Wochenkarte${icon('arrow-right', 'icon icon-move')}</a>
      </div>
    </div>
  </div>
</section>

<div class="marquee" aria-label="Gerichte aus unserer Karte">
  <div class="marquee-track">
    <div>${GERICHTE.map((g) => `<span>${g}</span>`).join('')}</div>
    <div aria-hidden="true">${GERICHTE.map((g) => `<span>${g}</span>`).join('')}</div>
  </div>
</div>

<section class="section">
  <div class="wrap story">
    ${foto(ctx, 'gastraum', 'Voller Gastraum im Il Pomodoro mit Bar und Pizzaofen im Hintergrund', { cls: 'reveal-clip', sizes: '(min-width: 1024px) 66vw, 100vw' })}
    <div class="story-card reveal">
      <h2>Eine Pizzeria, wie sie sein soll</h2>
      <p class="muted">Lange Bar, Holzstühle, der Ofen mitten im Raum. Seit ${SITE.seit} kommen Nachbarn, Kolleginnen und Familien ins Il Pomodoro, mittags für einen schnellen Teller Pasta, abends für Pizza und ein Glas Wein.</p>
      <a class="text-link" href="${ctx.root}ueber-uns/">Mehr über uns${icon('arrow-right')}</a>
    </div>
  </div>
</section>

<section class="section" id="bewertungen" aria-labelledby="reviews-title">
  <div class="wrap">
    <div class="reviews-head">
      <div>
        <h2 id="reviews-title">Das sagen unsere Gäste</h2>
        <p class="google-note mt-12">${icon('google-logo')}Bewertungen auf Google</p>
      </div>
      <div class="rating" data-rating>
        <span class="rating-score" data-rating-score>${SITE.googleBewertung.toFixed(1).replace('.', ',')}</span>
        <div><span class="stars" data-rating-stars role="img" aria-label="${SITE.googleBewertung.toFixed(1).replace('.', ',')} von 5 Sternen">${sterne(SITE.googleBewertung)}</span><p class="fine" data-rating-count>von 5 Sternen auf Google</p></div>
      </div>
    </div>
    <div class="reviews-track" data-reviews aria-live="polite">
      ${LOB.map(
        ([titel, text, ico]) => `<article class="review review-highlight">
        <span class="review-icon">${icon(ico)}</span>
        <h3>${titel}</h3>
        <p class="muted">${text}</p>
        <span class="stars">${sterne(5)}</span>
      </article>`,
      ).join('')}
    </div>
    <p class="fine mt-12" data-reviews-note>Das loben Gäste in ihren Google-Bewertungen am häufigsten.</p>
    <div class="cta-actions mt-28">
      <a class="btn btn-ghost" href="${SITE.mapsLink}" rel="noopener" target="_blank">Alle Bewertungen auf Google${icon('arrow-up-right')}</a>
      <a class="text-link" href="${SITE.reviewLink}" rel="noopener" target="_blank">Bewertung schreiben</a>
    </div>
  </div>
</section>

<section class="wrap">
  <div class="cta-band reveal">
    <div>
      <h2>Heute Abend schon was vor?</h2>
      <p>Tisch in einer Minute online reservieren. Für Gruppen ab 9 Personen und Feiern melden Sie sich gern direkt bei uns.</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-lg" href="${ctx.root}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
      <a class="btn btn-ghost btn-lg" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}Anrufen</a>
    </div>
  </div>
</section>

${wochenkarte(ctx, { kompakt: true })}

${besuch(ctx)}
`,
  scripts: ['reviews.js', 'wochenkarte.js'],
};

export { GERICHTE, ZEITEN, zeitText };
