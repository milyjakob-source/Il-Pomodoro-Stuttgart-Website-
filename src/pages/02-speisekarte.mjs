import { icon, esc } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';
import { KARTE, KARTE_PDF } from '../speisekarte.mjs';
import { wochenkarte } from '../teile.mjs';

const TAGS = {
  veg: [icon('leaf'), 'Vegetarisch'],
  gf: [icon('check'), 'Glutenfrei möglich'],
  haus: [icon('star'), 'Empfehlung'],
  scharf: [icon('warning'), 'Scharf'],
};

function menuJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Speisekarte Il Pomodoro',
    inLanguage: 'de',
    hasMenuSection: KARTE.map((k) => ({
      '@type': 'MenuSection',
      name: k.titel,
      hasMenuItem: k.gerichte.map((g) => ({
        '@type': 'MenuItem',
        name: g.name,
        description: g.text,
        ...(g.tags?.includes('veg') ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
      })),
    })),
  };
}

export default {
  id: 'speisekarte',
  slug: 'speisekarte/',
  priority: 0.9,
  title: 'Speisekarte',
  description:
    'Speisekarte und Wochenkarte des Il Pomodoro in Stuttgart-Süd: Pizza aus dem Holzofen, Pinsa, Pasta, Antipasti und Fisch. Jede Pizza auch glutenfrei.',
  jsonld: menuJsonLd(),
  body: (ctx) => `
<section class="wrap page-hero">
  <span class="eyebrow">Menu</span>
  <h1>Speisekarte</h1>
  <p class="lead">Oben die Wochenkarte mit den Gerichten dieser Woche, darunter ein Auszug aus unserer festen Karte.</p>
  ${KARTE_PDF ? `<p><a class="btn btn-ghost" href="${KARTE_PDF}" download>Karte als PDF</a></p>` : ''}
</section>

${wochenkarte(ctx)}

<div class="wrap menu-layout">
  <nav class="menu-nav" aria-label="Kategorien der Speisekarte" data-menu-nav>
    <a href="#wochenkarte">Wochenkarte</a>
    ${KARTE.map((k) => `<a href="#${k.id}">${k.titel}</a>`).join('')}
  </nav>
  <div>
    <div class="menu-note reveal">
      ${icon('warning')}
      <p>Informationen zu Allergenen und Zusatzstoffen erhalten Sie bei unserem Service. Jede Pizza gibt es auch mit glutenfreiem Boden; unsere Küche ist allerdings nicht glutenfrei. Die vollständige Karte mit Preisen bekommen Sie bei uns im Restaurant.</p>
    </div>
    ${KARTE.map(
      (k) => `<section class="menu-section" id="${k.id}" aria-labelledby="h-${k.id}">
      <h2 id="h-${k.id}">${k.titel}</h2>
      <p>${esc(k.intro)}</p>
      <ul class="dishes reveal-stagger">
        ${k.gerichte
          .map(
            (g) => `<li class="dish">
          <h3>${esc(g.name)}</h3>
          <p>${esc(g.text)}</p>
          ${g.tags?.length ? `<div class="tags">${g.tags.map((t) => `<span class="tag">${TAGS[t][0]}${TAGS[t][1]}</span>`).join('')}</div>` : ''}
        </li>`,
          )
          .join('')}
      </ul>
    </section>`,
    ).join('')}
    <div class="cta-band reveal">
      <div>
        <h2>Lust bekommen?</h2>
        <p>Reservieren Sie Ihren Tisch online oder bestellen Sie telefonisch zum Abholen.</p>
      </div>
      <div class="cta-actions">
        <a class="btn btn-lg" href="${ctx.root}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
        <a class="btn btn-ghost btn-lg" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}Zum Abholen bestellen</a>
      </div>
    </div>
  </div>
</div>
`,
  scripts: ['speisekarte.js', 'wochenkarte.js'],
};
