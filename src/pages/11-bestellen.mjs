import { icon, foto } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';
import { instagram } from '../teile.mjs';

// Bestellen geht ausschließlich über Lieferando und Wolt. Diese Seite führt dorthin.
export default {
  id: 'bestellen',
  slug: 'bestellen/',
  priority: 0.8,
  title: 'Bestellen: Lieferando und Wolt',
  ogTitle: 'Il Pomodoro bestellen über Lieferando und Wolt',
  description:
    'Pizza aus dem Holzofen, Pasta und Dolci vom Il Pomodoro nach Hause bestellen: über Lieferando oder Wolt, geliefert in Stuttgart-Süd und Umgebung.',
  body: (ctx) => `
<section class="wrap page-hero">
  <span class="eyebrow">A casa</span>
  <h1>Il Pomodoro für zu Hause</h1>
  <p class="lead">Pizza aus dem Holzofen, Pasta und Dolci, frisch zubereitet und zu Ihnen geliefert. Bestellen Sie über den Lieferdienst, den Sie am liebsten nutzen.</p>
</section>

<section class="wrap">
  <div class="dienste reveal-stagger">
    <a class="dienst-karte dienst-lieferando" href="${SITE.lieferando}" rel="noopener" target="_blank" data-track="lieferando">
      <span class="dienst-name">Lieferando</span>
      <span class="dienst-info">Bequem online bestellen und direkt bei Lieferando bezahlen.</span>
      <span class="dienst-cta">Bei Lieferando bestellen${icon('arrow-up-right')}</span>
    </a>
    <a class="dienst-karte dienst-wolt" href="${SITE.wolt}" rel="noopener" target="_blank" data-track="wolt">
      <span class="dienst-name">Wolt</span>
      <span class="dienst-info">Bestellung in der App verfolgen und direkt bei Wolt bezahlen.</span>
      <span class="dienst-cta">Bei Wolt bestellen${icon('arrow-up-right')}</span>
    </a>
  </div>
  <p class="fine mt-12">Sie verlassen dabei unsere Website. Für Bestellung, Bezahlung und Lieferung gelten die Bedingungen von Lieferando bzw. Wolt.</p>
</section>

<section class="section-tight">
  <div class="wrap split">
    <div class="prose reveal">
      <h2>So schmeckt es auch zu Hause</h2>
      <p class="muted">Wir backen jede Pizza erst, wenn Ihre Bestellung bei uns ankommt, bei hoher Hitze im Holzofen. Dazu Pasta, Antipasti und unsere Dolci wie Tiramisù.</p>
      <ul class="ig-punkte">
        <li>${icon('fork-knife')}Pizza und Pinsa aus dem Holzofen</li>
        <li>${icon('leaf')}Jede Pizza auch mit glutenfreiem Boden</li>
        <li>${icon('phone')}Fragen zu Allergenen? <a href="tel:${SITE.telefon.replace(/\s/g, '')}">${SITE.telefonAnzeige}</a></li>
      </ul>
    </div>
    ${foto(ctx, 'pizza-herz', 'Pizza in Herzform mit Kirschtomaten, Rucola und Mozzarella', { ratio: 'portrait', sizes: '(min-width: 1024px) 45vw, 100vw' })}
  </div>
</section>

${instagram(ctx)}
`,
};
