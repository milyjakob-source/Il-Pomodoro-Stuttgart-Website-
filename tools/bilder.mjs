// Bilder für das Web aufbereiten. Aufruf: npm run bilder
//
// 1. Fotos: Originale (JPG, PNG, WebP, AVIF, TIFF) nach bilder-original/ legen, Dateiname = Name des
//    Bildplatzes (z. B. hero.jpg, kueche-pasta.jpg; Liste in README.md). Heraus kommen je
//    name-800.webp, name-1600.webp und name-800.jpg in public/assets/img/fotos, gedreht nach EXIF,
//    ohne Metadaten (auch ohne GPS-Daten des Handys).
// 2. Icons: aus assets/img/favicon.svg entstehen favicon.ico, apple-touch-icon.png und die App-Icons.
// 3. Social-Vorschau: aus src/og.svg entsteht assets/img/og.jpg (1200 × 630).
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IN = join(ROOT, 'bilder-original');
const IMG = join(ROOT, 'public', 'assets', 'img');
const OUT = join(IMG, 'fotos');
mkdirSync(OUT, { recursive: true });

const fotos = existsSync(IN) ? readdirSync(IN).filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f)) : [];
for (const f of fotos) {
  const name = parse(f).name.toLowerCase();
  const src = sharp(join(IN, f)).rotate();
  await src.clone().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 72 }).toFile(join(OUT, `${name}-800.webp`));
  await src.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 70 }).toFile(join(OUT, `${name}-1600.webp`));
  await src.clone().resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true }).toFile(join(OUT, `${name}-800.jpg`));
  console.log('✓ Foto', name);
}
if (!fotos.length) console.log('Keine Fotos in bilder-original/ gefunden, nur Icons und Vorschau.');

const fav = join(IMG, 'favicon.svg');
const png = (size) => sharp(fav, { density: 512 }).resize(size, size).png({ compressionLevel: 9 });
await png(180).toFile(join(IMG, 'apple-touch-icon.png'));
await png(192).toFile(join(IMG, 'icon-192.png'));
await png(512).toFile(join(IMG, 'icon-512.png'));
// favicon.ico mit einem 32-px-PNG darin: reicht allen aktuellen Browsern.
const p32 = await png(32).toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6);
ico.writeUInt8(32, 7);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(p32.length, 14);
ico.writeUInt32LE(22, 18);
writeFileSync(join(ROOT, 'public', 'favicon.ico'), Buffer.concat([ico, p32]));
console.log('✓ Icons');

// Platzhalter FOTO in og.svg wird durch das Laternen-Foto ersetzt (eingebettet), falls vorhanden.
let og = readFileSync(join(ROOT, 'src', 'og.svg'), 'utf8');
const ogFoto = join(IN, 'laterne.jpg');
if (existsSync(ogFoto)) og = og.replace('FOTO', 'data:image/jpeg;base64,' + readFileSync(ogFoto).toString('base64'));
else og = og.replace(/<image[^>]*\/>/, '');
await sharp(Buffer.from(og), { density: 144 })
  .resize(1200, 630)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(join(IMG, 'og.jpg'));
console.log('✓ og.jpg');
