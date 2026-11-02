// Kopf- und Fußbilder der Instagram-Vorlagen (Format 1080 × 1350, gerendert in doppelter Auflösung).
// Die Vorlagen bestehen aus einer farbigen Tabelle: oben ein Kopfbild (Logo, Überschrift), in der Mitte
// bearbeitbarer Text, unten ein Fußbild. Keine Bilder hinter dem Text: das stellen iPhone-Vorschau,
// Pages und Word zuverlässig gleich dar.
// Aufruf aus dem Repo-Ordner: node vorlagen-instagram/quelle/hintergruende.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HIER = dirname(fileURLToPath(import.meta.url));
const IMG = join(HIER, '..', '..', 'public', 'assets', 'img');
const logoInnen = (farbeRot, farbeGruen) =>
  readFileSync(join(IMG, 'logo.svg'), 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', '')
    .replace(/#a82f3e/g, farbeRot).replace(/#38653f/g, farbeGruen);
const tomate = readFileSync(join(IMG, 'favicon.svg'), 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', '').replace(/<rect[^>]*\/>/, ''); // nur die Tomate
const logo = (x, y, h, rot, gruen) => `<svg x="${x}" y="${y}" width="${(h * 1205) / 320}" height="${h}" viewBox="10 9 1205 320">${logoInnen(rot, gruen)}</svg>`;
const T = { bg: '#f2f3ef', surface: '#fafbf8', ink: '#151a17', muted: '#4a524d', line: 'rgba(21,26,23,0.12)', accent: '#a82f3e' };
const D = 'font-family="Bricolage Grotesque" font-weight="700"';
const G = 'font-family="Geist"';
const svg = (w, h, inhalt) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inhalt}</svg>`;

// Höhen in Design-Pixeln; vorlagen.cjs verwendet dieselben Werte.
const KOPF_KARTE = 400;
const KOPF_NEWS = 360;
const FUSS = 170;

const kopfKarte = (eyebrow, titel) =>
  svg(1080, KOPF_KARTE, `
  <rect width="1080" height="${KOPF_KARTE}" fill="${T.bg}"/>
  <circle cx="1010" cy="70" r="230" fill="${T.accent}" opacity="0.07"/>
  <circle cx="1010" cy="70" r="150" fill="${T.accent}" opacity="0.07"/>
  ${logo(64, 64, 64, T.accent, '#38653f')}
  <text x="1016" y="108" text-anchor="end" ${G} font-size="22" font-weight="600" fill="${T.muted}" letter-spacing="1">STUTTGART-SÜD</text>
  <text x="64" y="232" ${G} font-size="22" font-weight="600" fill="${T.accent}" letter-spacing="4.5">${eyebrow}</text>
  <text x="58" y="340" ${D} font-size="124" fill="${T.ink}" letter-spacing="-4">${titel}</text>`);

const fussKarte = (links) =>
  svg(1080, FUSS, `
  <rect width="1080" height="${FUSS}" fill="${T.bg}"/>
  <line x1="64" y1="46" x2="1016" y2="46" stroke="${T.line}" stroke-width="2"/>
  <text x="64" y="100" ${G} font-size="24" font-weight="600" fill="${T.ink}">${links}</text>
  <text x="1016" y="100" text-anchor="end" ${G} font-size="24" fill="${T.muted}">Filderstraße 25 · 0711 51 87 66 50</text>`);

const kopfNews = (grund, hellSchrift, label, tomatenFarbe, deckkraft) =>
  svg(1080, KOPF_NEWS, `
  <rect width="1080" height="${KOPF_NEWS}" fill="${grund}"/>
  <svg x="810" y="125" width="215" height="215" viewBox="0 0 64 64"><g opacity="${deckkraft}">${tomate.replace(/fill="#[0-9a-f]{6}"/g, `fill="${tomatenFarbe}"`)}</g></svg>
  ${hellSchrift ? logo(64, 64, 64, '#fafbf8', '#fafbf8') : logo(64, 64, 64, T.accent, '#38653f')}
  <text x="1016" y="108" text-anchor="end" ${G} font-size="22" font-weight="600" fill="${hellSchrift ? '#fafbf8' : T.muted}" opacity="0.85" letter-spacing="1">STUTTGART-SÜD</text>
  <text x="64" y="300" ${G} font-size="22" font-weight="600" fill="${label}" letter-spacing="4.5">NOTIZIE · NEUIGKEITEN</text>
  <rect x="64" y="322" width="72" height="5" rx="2.5" fill="${label}"/>`);

const fussNews = (grund, schrift, linie) =>
  svg(1080, FUSS, `
  <rect width="1080" height="${FUSS}" fill="${grund}"/>
  <line x1="64" y1="46" x2="1016" y2="46" stroke="${linie}" stroke-width="2"/>
  <text x="64" y="100" ${G} font-size="24" font-weight="600" fill="${schrift}">Il Pomodoro · Filderstraße 25</text>
  <text x="1016" y="100" text-anchor="end" ${G} font-size="24" fill="${schrift}" opacity="0.85">0711 51 87 66 50</text>`);

const BILDER = {
  'kopf-tageskarte': kopfKarte('OGGI · HEUTE', 'Tageskarte'),
  'fuss-tageskarte': fussKarte('Frisch für heute, solange der Vorrat reicht'),
  'kopf-wochenkarte': kopfKarte('LA SETTIMANA', 'Wochenkarte'),
  'fuss-wochenkarte': fussKarte('Mittagstisch Mo–Fr 11:30–14:00'),
  'kopf-news-rot': kopfNews(T.accent, true, '#fafbf8', '#fafbf8', 0.14),
  'fuss-news-rot': fussNews(T.accent, '#fafbf8', 'rgba(250,251,248,0.3)'),
  'kopf-news-hell': kopfNews(T.bg, false, T.accent, T.accent, 0.09),
  'fuss-news-hell': fussNews(T.bg, T.ink, T.line),
};

for (const [name, s] of Object.entries(BILDER)) {
  const h = Number(s.match(/height="(\d+)"/)[1]);
  await sharp(Buffer.from(s), { density: 144 }).resize(2160, h * 2).png({ compressionLevel: 9 }).toFile(join(HIER, `${name}.png`));
  console.log('✓', name);
}
