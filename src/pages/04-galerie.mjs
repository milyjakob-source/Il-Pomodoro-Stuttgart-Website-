import { icon, foto } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';

// Reihenfolge der Galerie. Dateinamen entsprechen den Fotos in bilder-original/ (siehe README).
// Weitere Fotos: Datei nach bilder-original/, npm run bilder, hier eintragen.
const BILDER = [
  ['pizzaiolo', 'Unser Pizzaiolo am Holzofen'],
  ['pizza-herz', 'Pizza in Herzform mit Kirschtomaten, Rucola und Mozzarella'],
  ['team-pasta', 'Das Küchenteam mit frisch gekochter Pasta'],
  ['tafel-antipasti', 'Gedeckte Tafel mit Antipasti für eine Feier'],
  ['holzofen-feuer', 'Holzscheite brennen im Pizzaofen'],
  ['tiramisu', 'Tiramisù vor der Dessertkarte'],
  ['calamari', 'Calamari fritti mit Zitrone und Salat'],
  ['gastraum-eckbank', 'Gedeckte Tische an der Eckbank im Gastraum'],
  ['team-fisch', 'Das Team mit einem frischen Fisch'],
  ['dessert-pistazie', 'Dessert mit Pistazien und Physalis'],
  ['laterne', 'Laterne und Schild an der Sandsteinfassade an der Filderstraße'],
  ['pizza-burrata', 'Pizza mit Burrata, Pistazie und Basilikum'],
  ['holzofen', 'Glut im Holzofen'],
  ['eingang', 'Der Eingang an der Filderstraße mit Tomaten-Laterne und Tafel'],
  ['terrasse', 'Gäste an den Tischen vor dem Restaurant'],
];

export default {
  id: 'galerie',
  slug: 'galerie/',
  priority: 0.6,
  title: 'Galerie',
  description:
    'Bilder aus dem Il Pomodoro in Stuttgart-Süd: Team, Holzofen, Pizza, Pasta, Dolci und Gastraum. Ein Eindruck, bevor Sie uns besuchen.',
  body: (ctx) => `
<section class="wrap page-hero">
  <h1>Einblicke</h1>
  <p class="lead">Team, Holzofen, Pizza und Dolci. So sieht es bei uns in Küche und Gastraum aus.</p>
</section>

<section class="wrap">
  <div class="gallery reveal-stagger">
    ${BILDER.map(([name, alt]) =>
      foto(ctx, name, alt, { sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' }).replace(
        '</picture>',
        `</picture><figcaption>${alt}</figcaption>`,
      ),
    ).join('')}
  </div>
  <div class="cta-actions mt-28">
    ${SITE.social.instagram ? `<a class="btn btn-ghost" href="${SITE.social.instagram}" rel="noopener" target="_blank">${icon('instagram-logo')}Mehr auf Instagram</a>` : ''}
    <a class="btn btn-accent" href="${ctx.root}bestellen/">${icon('shopping-bag')}Online bestellen</a>
    <a class="btn btn-ghost" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}Tisch reservieren</a>
  </div>
</section>
`,
};
