import { icon, foto } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';

export default {
  id: 'ueber-uns',
  slug: 'ueber-uns/',
  priority: 0.7,
  title: 'Über uns',
  description: `Das Il Pomodoro an der Filderstraße in Stuttgart-Süd: Pizzeria und Ristorante seit ${SITE.seit}, mit Holzofen, Pasta, Fisch und Fleisch zu fairen Preisen.`,
  body: (ctx) => `
<section class="wrap page-hero">
  <h1>Unser Il Pomodoro</h1>
  <p class="lead">Seit ${SITE.seit} an der Filderstraße: eine Pizzeria, in der der Holzofen den Ton angibt und man sich schnell wie Stammgast fühlt.</p>
</section>

<section class="wrap">
  ${foto(ctx, 'laterne', 'Laterne mit Tomaten-Logo und Schild „il pomodoro, Pizzeria, Ristorante“ an der Sandsteinfassade', { ratio: 'wide', cls: 'reveal-clip', sizes: '100vw', eager: true })}
</section>

<section class="section">
  <div class="wrap split">
    <div class="prose reveal">
      <h2>Italienisch, ehrlich, mitten im Süden</h2>
      <p class="muted" data-text="ueber_text">Im Il Pomodoro gibt es Pizza aus dem Holzofen, feine Pasta sowie Fleisch- und Fischgerichte, manche davon ebenfalls aus dem Ofen. Dazu vegetarische Spezialitäten und eine Wochenkarte, die sich nach Saison und Markt richtet.</p>
      <p class="muted">Wer an der Bar sitzt, sieht zu, wie der Teig durch die Luft fliegt, bevor er in den Ofen kommt. Mittags geht es schnell, abends darf es länger dauern, und die Preise bleiben fair.</p>
    </div>
    ${foto(ctx, 'holzofen', 'Brennendes Holz im Pizzaofen des Il Pomodoro', { ratio: 'portrait', sizes: '(min-width: 1024px) 45vw, 100vw' })}
  </div>
</section>

<section class="section-tight">
  <div class="wrap">
    <div class="section-head reveal"><h2>Worauf Sie sich verlassen können</h2></div>
    <div class="values reveal-stagger">
      <div class="value value-feature">
        ${icon('fork-knife')}
        <h3>Pizza aus dem Holzofen</h3>
        <p class="muted">Bei hoher Hitze gebacken, mit knusprigem Rand. Dazu Pinsa, Pasta, Fisch und Fleisch, mittags von Montag bis Freitag und abends von Montag bis Samstag.</p>
      </div>
      <div class="value">${icon('leaf')}<h3>Glutenfrei möglich</h3><p class="muted">Jede Pizza und Pinsa auch mit glutenfreiem Boden. Unsere Küche ist allerdings nicht glutenfrei.</p></div>
      <div class="value">${icon('calendar-check')}<h3>Jede Woche neu</h3><p class="muted">Wechselnde Gerichte auf der Wochenkarte, frisch nach Saison.</p></div>
      <div class="value">${icon('users-three')}<h3>Feiern und Gruppen</h3><p class="muted">Geburtstag, Team-Essen oder Familienfeier: wir planen mit Ihnen.</p></div>
      <div class="value">${icon('storefront')}<h3>Abholen und Liefern</h3><p class="muted"><a href="${ctx.root}bestellen/">Online bestellen</a> oder anrufen, dann abholen oder liefern lassen.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="cta-band reveal">
      <div>
        <h2>Lernen Sie uns kennen</h2>
        <p>Am besten bei einer Pizza direkt aus dem Ofen. Wir freuen uns auf Ihren Besuch.</p>
      </div>
      <div class="cta-actions">
        <a class="btn btn-lg" href="${ctx.root}reservierung/">${icon('calendar-check')}Tisch reservieren</a>
        <a class="btn btn-ghost btn-lg" href="${ctx.root}kontakt/#anfrage">Feier anfragen</a>
      </div>
    </div>
  </div>
</section>
`,
};
