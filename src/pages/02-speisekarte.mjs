import { icon, esc } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';
import { GRUPPEN, LEGENDE, KARTE_PDF } from '../speisekarte.mjs';
import { lieferung, social } from '../teile.mjs';

// Preis „6,90“ → „6,90 €“; „Glas 7,90“ → Menge klein, Preis fett.
function preisText(p) {
  const m = String(p).match(/^(.*?)\s*(\d+,\d{2})$/);
  if (!m) return esc(p);
  return `${m[1] ? `<span class="menge">${esc(m[1])}</span> ` : ''}${m[2]}&nbsp;€`;
}

function preise(p) {
  if (!Array.isArray(p)) return `<span class="price">${preisText(p)}</span>`;
  return `<dl class="preise">${p
    .map(([label, wert]) => `<div><dt>${esc(label)}</dt><dd>${wert}&nbsp;€</dd></div>`)
    .join('')}</dl>`;
}

const kennz = (a) => (a ? ` <sup class="kz" title="Allergene und Zusatzstoffe, siehe unten">${esc(a.replace(/,/g, ', '))}</sup>` : '');

function eintragKarte(e) {
  const mehrere = Array.isArray(e.preis);
  return `<li class="dish">
    <div class="dish-kopf"><h4>${esc(e.name)}${kennz(e.a)}</h4>${mehrere ? '' : preise(e.preis)}</div>
    ${e.text ? `<p>${esc(e.text)}</p>` : ''}
    ${mehrere ? preise(e.preis) : ''}
  </li>`;
}

function eintragZeile(e) {
  return `<li class="drink">
    <div><span class="drink-name">${esc(e.name)}${kennz(e.a)}</span>${e.text ? `<span class="drink-text">${esc(e.text)}</span>` : ''}</div>
    ${preise(e.preis)}
  </li>`;
}

function kategorie(k) {
  const liste = k.art === 'liste';
  return `<section class="menu-section${k.spezial ? ' menu-spezial' : ''}" id="${k.id}" aria-labelledby="h-${k.id}">
    <h3 id="h-${k.id}">${esc(k.titel)}${k.untertitel ? ` <span class="menu-sub">${esc(k.untertitel)}</span>` : ''}</h3>
    ${k.intro ? `<p class="menu-intro">${esc(k.intro)}</p>` : ''}
    <ul class="${liste ? 'drinks' : 'dishes'}">${k.eintraege.map(liste ? eintragZeile : eintragKarte).join('')}</ul>
    ${k.hinweis ? `<p class="menu-hinweis">${icon('check')}${esc(k.hinweis)}</p>` : ''}
  </section>`;
}

function menuJsonLd() {
  const zahl = (p) => {
    const w = Array.isArray(p) ? p[p.length - 1][1] : String(p).match(/(\d+,\d{2})$/)?.[1];
    return w ? w.replace(',', '.') : undefined;
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Speisekarte Il Pomodoro',
    inLanguage: 'de',
    hasMenuSection: GRUPPEN[0].kategorien.map((k) => ({
      '@type': 'MenuSection',
      name: k.titel,
      hasMenuItem: k.eintraege.map((e) => ({
        '@type': 'MenuItem',
        name: e.name,
        ...(e.text ? { description: e.text } : {}),
        offers: { '@type': 'Offer', price: zahl(e.preis), priceCurrency: 'EUR' },
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
    'Speisekarte des Il Pomodoro in Stuttgart-Süd mit Preisen: Pizza aus dem Holzofen, Pinsa, Pasta, Fisch, Steaks, Dolci, Getränke und italienische Weine.',
  jsonld: menuJsonLd(),
  body: (ctx) => `
<section class="wrap page-hero">
  <div>
    <span class="eyebrow">Menu</span>
    <h1>Speisekarte</h1>
    <p class="lead">Unsere ganze Karte mit Preisen. Was es zusätzlich heute und diese Woche gibt, steht auf der <a href="${ctx.root}tageskarte/">Tageskarte</a> und der <a href="${ctx.root}wochenkarte/">Wochenkarte</a>.</p>
    <div class="menu-tabs" role="navigation" aria-label="Bereiche der Speisekarte">
      ${GRUPPEN.map((g) => `<a href="#gruppe-${g.id}">${g.titel}</a>`).join('')}
    </div>
    ${KARTE_PDF ? `<p class="mt-12"><a class="btn btn-ghost" href="${KARTE_PDF}" download>Karte als PDF</a></p>` : ''}
  </div>
</section>

<div class="wrap menu-layout">
  <nav class="menu-nav" aria-label="Kategorien der Speisekarte" data-menu-nav>
    ${GRUPPEN.map(
      (g) => `<span class="menu-nav-gruppe">${g.titel}</span>${g.kategorien.map((k) => `<a href="#${k.id}">${esc(k.titel)}</a>`).join('')}`,
    ).join('')}
  </nav>
  <div class="menu-inhalt">
    <div class="menu-note">
      ${icon('warning')}
      <p>Jede Pizza und Pinsa gibt es auch mit glutenfreiem Boden, unsere Küche ist allerdings nicht glutenfrei. Die kleinen Buchstaben und Zahlen hinter den Gerichten verweisen auf <a href="#allergene">Allergene und Zusatzstoffe</a>. Alle Speisen gibt es auch zum Mitnehmen.</p>
    </div>
    ${GRUPPEN.map(
      (g) => `<div class="menu-gruppe" id="gruppe-${g.id}">
      <h2 class="menu-gruppe-titel">${g.titel}</h2>
      ${g.kategorien.map(kategorie).join('')}
    </div>`,
    ).join('')}

    <section class="menu-legende" id="allergene" aria-labelledby="h-allergene">
      <h2 id="h-allergene">Allergene und Zusatzstoffe</h2>
      <div class="legende-spalten">
        <div>
          <h3>Allergene</h3>
          <ul>${LEGENDE.allergene.map(([k, t]) => `<li><b>${k}</b> ${esc(t)}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>Zusatzstoffe</h3>
          <ul>${LEGENDE.zusatzstoffe.map(([k, t]) => `<li><b>${k}</b> ${esc(t)}</li>`).join('')}</ul>
        </div>
      </div>
      <p class="fine">Alle Preise in Euro inklusive Bedienung und Mehrwertsteuer. Fragen zu Allergenen beantwortet gern unser Service.</p>
    </section>
  </div>
</div>

${lieferung(ctx, { titel: 'Die Karte gibt es auch zum Liefern' })}

${social(ctx)}
`,
  scripts: ['speisekarte.js'],
};
