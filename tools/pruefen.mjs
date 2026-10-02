// Prüft die gebauten Seiten in public/ vor dem Veröffentlichen. Aufruf: npm run pruefen
// - interne Links und Dateien (CSS, JS, Bilder, Schriften) existieren
// - jede Seite hat Titel (≤ 60 Zeichen) und Beschreibung (≤ 160 Zeichen), beide eindeutig
// - jedes <img> hat ein alt-Attribut, jedes Formularfeld ein Label
// - Kontraste der Farbwerte aus style.css erfüllen WCAG AA
// - keine Geheimnisse (API-Schlüssel, Tokens) im Frontend
// Fehlende Fotos in assets/img/fotos werden nur gemeldet, nicht als Fehler gezählt.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
let fehler = 0;
const fehlendeFotos = new Set();
const bad = (msg) => {
  fehler++;
  console.log('✗', msg);
};

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(PUB);
const html = files.filter((f) => f.endsWith('.html'));
const titles = new Map();
const descs = new Map();

for (const file of html) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(PUB, file);
  const title = src.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = src.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!title) bad(`${rel}: Titel fehlt`);
  if (title.replace(/&amp;/g, '&').length > 65) bad(`${rel}: Titel zu lang (${title.length})`);
  if (!desc) bad(`${rel}: Beschreibung fehlt`);
  if (desc.length > 160) bad(`${rel}: Beschreibung zu lang (${desc.length})`);
  if (titles.has(title)) bad(`${rel}: gleicher Titel wie ${titles.get(title)}`);
  if (descs.has(desc)) bad(`${rel}: gleiche Beschreibung wie ${descs.get(desc)}`);
  titles.set(title, rel);
  descs.set(desc, rel);
  if (!/<h1[\s>]/.test(src)) bad(`${rel}: keine H1`);
  if ((src.match(/<h1[\s>]/g) || []).length > 1) bad(`${rel}: mehr als eine H1`);

  for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) bad(`${rel}: Bild ohne alt: ${m[0].slice(0, 80)}`);

  // Felder brauchen ein Label (per for/id oder umschließend).
  for (const m of src.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const tag = m[0];
    if (/type="(hidden|radio|checkbox)"/.test(tag) || /name="bot-field"/.test(tag)) continue;
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (!id || !src.includes(`for="${id}"`)) bad(`${rel}: Feld ohne Label: ${tag.slice(0, 80)}`);
  }

  // Gedankenstriche gehören nicht in sichtbaren Text (Stilregel der Seite).
  const sichtbar = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  if (/[—]/.test(sichtbar)) bad(`${rel}: Geviertstrich im Text`);

  // Links und eingebundene Dateien
  for (const m of src.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (!url || /^(https?:|mailto:|tel:|#|data:)/.test(url)) continue;
      const clean = url.split('#')[0].split('?')[0];
      if (!clean) continue;
      const base = clean.startsWith('/') ? PUB : dirname(file);
      let target = resolve(base, clean.replace(/^\//, ''));
      if (clean.endsWith('/')) target = join(target, 'index.html');
      if (existsSync(target)) continue;
      if (target.includes(join('assets', 'img', 'fotos'))) fehlendeFotos.add(relative(PUB, target));
      else bad(`${rel}: Link/Datei fehlt: ${url}`);
    }
  }
  // Anker auf derselben oder anderen Seiten
  for (const m of src.matchAll(/href="([^"]*)#([\w-]+)"/g)) {
    const [, pfad, anker] = m;
    if (/^https?:/.test(pfad)) continue;
    let target = pfad ? resolve(dirname(file), pfad) : file;
    if (pfad.endsWith('/') || pfad === '') target = pfad ? join(target, 'index.html') : file;
    if (existsSync(target) && !readFileSync(target, 'utf8').includes(`id="${anker}"`)) bad(`${rel}: Anker #${anker} fehlt in ${relative(PUB, target)}`);
  }
}

// Geheimnisse im Frontend
for (const f of files.filter((f) => /\.(js|html|json|webmanifest)$/.test(f))) {
  const src = readFileSync(f, 'utf8');
  if (/AIza[0-9A-Za-z_-]{30,}/.test(src)) bad(`${relative(PUB, f)}: Google-API-Schlüssel im Frontend`);
  if (/(secret|token|apikey|api_key)\s*[:=]\s*['"][^'"]{12,}['"]/i.test(src)) bad(`${relative(PUB, f)}: sieht nach Geheimnis aus`);
}

// Kontraste
const css = readFileSync(join(PUB, 'assets', 'css', 'style.css'), 'utf8');
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2];
  return out;
}
const light = tokens(css.match(/:root \{[\s\S]*?\n\}/)[0]);
const dark = { ...light, ...tokens(css.match(/:root\[data-theme='dark'\] \{[\s\S]*?\n\}/)[0]) };
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const paare = [
  ['ink', 'bg', 4.5], ['ink', 'surface', 4.5], ['ink', 'tint', 4.5], ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'tint', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['on-accent', 'accent', 4.5], ['danger', 'surface', 4.5], ['ok', 'bg', 3],
];
for (const [name, t] of [['hell', light], ['dunkel', dark]]) {
  for (const [fg, bg, min] of paare) {
    const r = ratio(t[fg], t[bg]);
    if (r < min) bad(`Kontrast ${name}: ${fg} auf ${bg} = ${r.toFixed(2)} (mind. ${min})`);
    else console.log(`✓ Kontrast ${name}: ${fg} auf ${bg} = ${r.toFixed(2)}`);
  }
}

if (fehlendeFotos.size) {
  console.log(`\nHinweis: ${fehlendeFotos.size} Fotodateien fehlen noch (npm run bilder nach dem Ablegen der Originale):`);
  [...new Set([...fehlendeFotos].map((f) => f.replace(/^assets\/img\/fotos\//, '').replace(/-(800|1600)\.(webp|jpg)$/, '')))].sort().forEach((n) => console.log('  ·', n));
}
console.log(fehler ? `\n${fehler} Problem(e) gefunden.` : `\nAlles in Ordnung: ${html.length} Seiten geprüft.`);
process.exit(fehler ? 1 : 0);
