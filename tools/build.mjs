// Baut die statischen Seiten nach public/. Aufruf: node tools/build.mjs
// Jede Seite unter src/pages/ liefert Titel, Beschreibung und Inhalt; Kopf, Navigation, Footer,
// Cookie-Banner, Sitemap und strukturierte Daten kommen von hier. Keine Abhängigkeiten.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, NAV, LEGAL, ZEITEN, KUECHE_BIS, zeitText } from '../src/site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const ICONS = join(ROOT, 'src', 'icons');
// Cache-Buster für CSS und JS: ändert sich mit jedem Build, damit Browser nach einem Update nichts Altes zeigen.
const VERSION = Date.now().toString(36);

/** Phosphor-Icon inline, damit es die Textfarbe erbt und keinen eigenen Request kostet. */
export function icon(name, cls = 'icon') {
  const svg = readFileSync(join(ICONS, `${name}.svg`), 'utf8').trim();
  return svg.replace('<svg ', `<svg class="${cls}" aria-hidden="true" focusable="false" `);
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Bildrahmen mit responsiven Quellen. Die Fotos liegen als name-800.webp / name-1600.webp / name-800.jpg in
 * assets/img/fotos (erzeugt von tools/bilder.mjs). Fehlt ein Foto noch, zeigt der Rahmen eine ruhige Fläche.
 */
export function foto(ctx, name, alt, { cls = '', sizes = '(min-width: 1024px) 50vw, 100vw', eager = false, ratio = '' } = {}) {
  const base = `${ctx.root}assets/img/fotos/${name}`;
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<figure class="media ${cls}"${ratio ? ` data-ratio="${ratio}"` : ''} data-foto="${name}">
    <picture>
      <source type="image/webp" srcset="${base}-800.webp 800w, ${base}-1600.webp 1600w" sizes="${sizes}">
      <img src="${base}-800.jpg" alt="${esc(alt)}" width="1600" height="1067" ${load} decoding="async">
    </picture>
  </figure>`;
}

function head(page, ctx) {
  const url = SITE.url + '/' + page.slug;
  const title = page.slug === '' ? `${SITE.name} | Pizzeria & Ristorante in Stuttgart-Süd` : `${page.title} | ${SITE.name} Stuttgart`;
  const ogImage = `${SITE.url}/assets/img/og.jpg`;
  const r = ctx.root;
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(page.description)}">
  ${page.noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${url}">`}
  <meta name="theme-color" content="#f2f3ef" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0f1311" media="(prefers-color-scheme: dark)">
  <meta name="color-scheme" content="light dark">
  <meta property="og:type" content="${page.slug === '' ? 'restaurant' : 'website'}">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:locale" content="de_DE">
  <meta property="og:title" content="${esc(page.ogTitle || title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Il Pomodoro, Pizzeria und Ristorante in Stuttgart-Süd">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.ogTitle || title)}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="icon" href="${r}favicon.ico" sizes="32x32">
  <link rel="icon" href="${r}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${r}assets/img/apple-touch-icon.png">
  <link rel="manifest" href="${r}site.webmanifest">
  <link rel="preload" href="${r}assets/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${r}assets/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${r}assets/css/style.css?v=${VERSION}">
  <script src="${r}assets/js/theme.js?v=${VERSION}"></script>
  ${page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld)}</script>` : ''}
</head>`;
}

function header(page, ctx) {
  const r = ctx.root;
  const links = NAV.filter((n) => !n.cta)
    .map((n) => {
      const aktiv = n.slug === page.slug ? ' aria-current="page"' : '';
      return `<li><a href="${r}${n.slug}"${aktiv}>${n.label}</a></li>`;
    })
    .join('');
  return `<a class="skip" href="#inhalt">Zum Inhalt springen</a>
<header class="site-header" data-header>
  <div class="wrap header-row">
    <a class="brand" href="${r}" aria-label="${esc(SITE.name)}, zur Startseite">
      <img class="brand-logo logo-light" src="${r}assets/img/logo.svg" alt="" width="173" height="46">
      <img class="brand-logo logo-dark" src="${r}assets/img/logo-dark.svg" alt="" width="173" height="46">
    </a>
    <nav class="nav" aria-label="Hauptnavigation" id="hauptnavigation" data-nav>
      <ul>${links}</ul>
      <a class="btn btn-accent nav-cta" href="${r}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
    </nav>
    <div class="header-tools">
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Farbmodus wechseln">
        <span class="theme-icon theme-icon-sun">${icon('sun')}</span>
        <span class="theme-icon theme-icon-moon">${icon('moon')}</span>
      </button>
      <button class="icon-btn menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="hauptnavigation" aria-label="Menü öffnen">
        <span class="menu-open">${icon('list')}</span><span class="menu-close">${icon('x')}</span>
      </button>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const r = ctx.root;
  const zeiten = ZEITEN.map((z) => `<div><dt>${z.tage}</dt><dd>${zeitText(z.slots)}</dd></div>`).join('');
  const social = [
    SITE.social.instagram && `<a href="${SITE.social.instagram}" rel="noopener" target="_blank" aria-label="Instagram">${icon('instagram-logo')}</a>`,
    SITE.social.facebook && `<a href="${SITE.social.facebook}" rel="noopener" target="_blank" aria-label="Facebook">${icon('facebook-logo')}</a>`,
  ]
    .filter(Boolean)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <span class="brand">
        <img class="brand-logo logo-light" src="${r}assets/img/logo.svg" alt="${esc(SITE.name)}" width="173" height="46" loading="lazy">
        <img class="brand-logo logo-dark" src="${r}assets/img/logo-dark.svg" alt="${esc(SITE.name)}" width="173" height="46" loading="lazy">
      </span>
      <p>${SITE.claim}.</p>
      ${social ? `<div class="social">${social}</div>` : ''}
    </div>
    <div>
      <h2 class="footer-title">Besuch</h2>
      <address>${SITE.strasse}<br>${SITE.plz} ${SITE.ort}</address>
      <a class="text-link" href="${SITE.mapsLink}" rel="noopener" target="_blank">Route planen${icon('arrow-up-right')}</a>
    </div>
    <div>
      <h2 class="footer-title">Öffnungszeiten</h2>
      <dl class="hours-mini">${zeiten}</dl>
      ${KUECHE_BIS ? `<p class="fine">Küche bis ${KUECHE_BIS} Uhr</p>` : ''}
    </div>
    <div>
      <h2 class="footer-title">Kontakt</h2>
      <p><a href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${SITE.telefonAnzeige}</a><br>
      <a href="mailto:${SITE.email}">${SITE.email}</a></p>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>&copy; <span data-year>${new Date().getFullYear()}</span> ${esc(SITE.name)}</p>
    <ul class="legal">
      ${LEGAL.map((l) => `<li><a href="${r}${l.slug}">${l.label}</a></li>`).join('')}
      <li><button type="button" class="link-btn" data-consent-open>Cookie-Einstellungen</button></li>
    </ul>
  </div>
</footer>
<div class="mobile-bar" data-mobile-bar>
  <a class="btn btn-ghost" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}Anrufen</a>
  <a class="btn btn-accent" href="${r}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
</div>
${consentBanner(ctx)}`;
}

function consentBanner(ctx) {
  return `<div class="consent" data-consent hidden role="dialog" aria-modal="false" aria-labelledby="consent-title" aria-describedby="consent-text">
  <div class="consent-inner">
    <h2 id="consent-title" class="consent-title">Cookies und externe Inhalte</h2>
    <p id="consent-text">Wir verwenden technisch notwendige Speicher, damit die Seite funktioniert. Mit Ihrer Zustimmung laden wir außerdem Google Maps und messen anonymisiert, wie die Seite genutzt wird (Google Analytics). Ihre Wahl können Sie jederzeit im Footer ändern. Mehr in der <a href="${ctx.root}datenschutz/">Datenschutzerklärung</a>.</p>
    <form class="consent-options" data-consent-form hidden>
      <label class="check"><input type="checkbox" checked disabled> <span><strong>Notwendig</strong> Farbmodus, Ihre Cookie-Wahl, Formularschutz</span></label>
      <label class="check"><input type="checkbox" name="media"> <span><strong>Externe Medien</strong> Google Maps auf der Kontaktseite</span></label>
      <label class="check"><input type="checkbox" name="stats"> <span><strong>Statistik</strong> Google Analytics 4, IP gekürzt</span></label>
    </form>
    <div class="consent-actions">
      <button type="button" class="btn btn-ghost" data-consent-settings>Einstellungen</button>
      <button type="button" class="btn btn-ghost" data-consent-save hidden>Auswahl speichern</button>
      <button type="button" class="btn btn-ghost" data-consent-necessary>Nur notwendige</button>
      <button type="button" class="btn btn-accent" data-consent-all>Alle akzeptieren</button>
    </div>
  </div>
</div>`;
}

function layout(page) {
  const depth = page.slug === '' ? 0 : page.slug.split('/').filter(Boolean).length;
  // 404 kann unter jeder Adresse ausgeliefert werden, deshalb dort absolute Pfade.
  const ctx = { root: page.absolute ? '/' : depth === 0 ? './' : '../'.repeat(depth), slug: page.slug };
  const scripts = ['config.js', 'main.js', ...(page.scripts || [])]
    .map((s) => `<script src="${ctx.root}assets/js/${s}?v=${VERSION}" defer></script>`)
    .join('\n');
  return `${head(page, ctx)}
<body class="page-${page.id}">
${header(page, ctx)}
<main id="inhalt" tabindex="-1">
${page.body(ctx)}
</main>
${footer(ctx)}
${scripts}
</body>
</html>
`;
}

// Strukturierte Daten für Google: Restaurant mit Adresse, Zeiten, Küche und Reservierung.
export function restaurantJsonLd() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const spec = ZEITEN.flatMap((z) =>
    z.slots.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: z.days.map((d) => days[d]),
      opens,
      closes: closes.replace('25:', '01:'),
    })),
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': SITE.url + '/#restaurant',
    name: SITE.name,
    url: SITE.url + '/',
    telephone: SITE.telefon,
    email: SITE.email,
    image: [SITE.url + '/assets/img/og.jpg'],
    logo: SITE.url + '/assets/img/logo.svg',
    servesCuisine: ['Italienisch', 'Pasta', 'Pizza', 'Fisch'],
    priceRange: '€€',
    acceptsReservations: SITE.url + '/reservierung/',
    hasMenu: SITE.url + '/speisekarte/',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.strasse,
      postalCode: SITE.plz,
      addressLocality: SITE.ort,
      addressRegion: 'Baden-Württemberg',
      addressCountry: 'DE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    openingHoursSpecification: spec,
    sameAs: Object.values(SITE.social).filter(Boolean),
  };
}

async function main() {
  const dir = join(ROOT, 'src', 'pages');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const sitemap = [];
  for (const f of files) {
    const page = (await import(pathToFileURL(join(dir, f)).href)).default;
    const target = page.file ? join(OUT, page.file) : join(OUT, page.slug, 'index.html');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, layout(page));
    if (!page.noindex) sitemap.push({ loc: SITE.url + '/' + page.slug, prio: page.priority ?? 0.5 });
    console.log('✓', target.replace(ROOT + '/', ''));
  }
  const heute = new Date().toISOString().slice(0, 10);
  writeFileSync(
    join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .sort((a, b) => b.prio - a.prio)
  .map((s) => `  <url><loc>${s.loc}</loc><lastmod>${heute}</lastmod><priority>${s.prio.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`,
  );
  writeFileSync(
    join(OUT, 'robots.txt'),
    `User-agent: *
Allow: /
Disallow: /404.html

Sitemap: ${SITE.url}/sitemap.xml
`,
  );
  console.log('✓ public/sitemap.xml, public/robots.txt');
}

main();
