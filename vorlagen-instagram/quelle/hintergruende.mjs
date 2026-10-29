// Hintergrundgrafiken der Instagram-Vorlagen (1080 × 1350, gerendert in doppelter Auflösung).
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
const tomate = readFileSync(join(IMG, 'favicon.svg'), 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', '').replace(/<rect[^>]*\/>/, ''); // nur die Tomate, ohne Kachel
const logo = (x, y, h, rot, gruen) => `<svg x="${x}" y="${y}" width="${(h * 1205) / 320}" height="${h}" viewBox="10 9 1205 320">${logoInnen(rot, gruen)}</svg>`;
const T = { bg: '#f2f3ef', surface: '#fafbf8', ink: '#151a17', muted: '#4a524d', line: 'rgba(21,26,23,0.12)', accent: '#a82f3e', tint: '#e2e8df' };
const D = 'font-family="Bricolage Grotesque" font-weight="700"';
const G = 'font-family="Geist"';

const wochenkarte = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${T.bg}"/>
  <circle cx="1010" cy="70" r="230" fill="${T.accent}" opacity="0.07"/>
  <circle cx="1010" cy="70" r="150" fill="${T.accent}" opacity="0.07"/>
  ${logo(64, 64, 64, T.accent, '#38653f')}
  <text x="1016" y="108" text-anchor="end" ${G} font-size="22" font-weight="600" fill="${T.muted}" letter-spacing="1">STUTTGART-SÜD</text>
  <text x="64" y="232" ${G} font-size="22" font-weight="600" fill="${T.accent}" letter-spacing="4.5">LA SETTIMANA</text>
  <text x="58" y="340" ${D} font-size="124" fill="${T.ink}" letter-spacing="-4">Wochenkarte</text>
  <rect x="56" y="470" width="968" height="690" rx="40" fill="${T.surface}" stroke="${T.line}" stroke-width="2"/>
  <line x1="64" y1="1216" x2="1016" y2="1216" stroke="${T.line}" stroke-width="2"/>
  <text x="64" y="1270" ${G} font-size="24" font-weight="600" fill="${T.ink}">Mittagstisch Mo–Fr 11:30–14:00</text>
  <text x="1016" y="1270" text-anchor="end" ${G} font-size="24" fill="${T.muted}">Filderstraße 25 · 0711 51 87 66 50</text>
</svg>`;

const newsRot = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${T.accent}"/>
  <svg x="640" y="640" width="560" height="560" viewBox="0 0 64 64"><g opacity="0.12">${tomate.replace(/fill="#[0-9a-f]{6}"/g, 'fill="#fafbf8"')}</g></svg>
  ${logo(64, 64, 64, '#fafbf8', '#fafbf8')}
  <text x="1016" y="108" text-anchor="end" ${G} font-size="22" font-weight="600" fill="#fafbf8" opacity="0.8" letter-spacing="1">STUTTGART-SÜD</text>
  <text x="64" y="300" ${G} font-size="22" font-weight="600" fill="#fafbf8" letter-spacing="4.5">NOTIZIE · NEUIGKEITEN</text>
  <rect x="64" y="322" width="72" height="5" rx="2.5" fill="#fafbf8"/>
  <line x1="64" y1="1216" x2="1016" y2="1216" stroke="#fafbf8" stroke-opacity="0.3" stroke-width="2"/>
  <text x="64" y="1270" ${G} font-size="24" font-weight="600" fill="#fafbf8">Il Pomodoro · Filderstraße 25</text>
  <text x="1016" y="1270" text-anchor="end" ${G} font-size="24" fill="#fafbf8" opacity="0.85">0711 51 87 66 50</text>
</svg>`;

const newsHell = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${T.bg}"/>
  <svg x="640" y="640" width="560" height="560" viewBox="0 0 64 64"><g opacity="0.08">${tomate.replace(/fill="#[0-9a-f]{6}"/g, 'fill="#a82f3e"')}</g></svg>
  ${logo(64, 64, 64, T.accent, '#38653f')}
  <text x="1016" y="108" text-anchor="end" ${G} font-size="22" font-weight="600" fill="${T.muted}" letter-spacing="1">STUTTGART-SÜD</text>
  <text x="64" y="300" ${G} font-size="22" font-weight="600" fill="${T.accent}" letter-spacing="4.5">NOTIZIE · NEUIGKEITEN</text>
  <rect x="64" y="322" width="72" height="5" rx="2.5" fill="${T.accent}"/>
  <line x1="64" y1="1216" x2="1016" y2="1216" stroke="${T.line}" stroke-width="2"/>
  <text x="64" y="1270" ${G} font-size="24" font-weight="600" fill="${T.ink}">Il Pomodoro · Filderstraße 25</text>
  <text x="1016" y="1270" text-anchor="end" ${G} font-size="24" fill="${T.muted}">0711 51 87 66 50</text>
</svg>`;

for (const [name, svg] of [['wochenkarte', wochenkarte], ['news-rot', newsRot], ['news-hell', newsHell]]) {
  await sharp(Buffer.from(svg), { density: 144 }).resize(2160, 2700).png({ compressionLevel: 9 }).toFile(join(HIER, `bg-${name}.png`));
  console.log('✓', name);
}
