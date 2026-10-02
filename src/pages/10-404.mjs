import { icon } from '../../tools/build.mjs';

export default {
  id: 'notfound',
  slug: '404.html',
  file: '404.html',
  absolute: true,
  noindex: true,
  title: 'Seite nicht gefunden',
  description: 'Diese Seite gibt es nicht (mehr). Hier geht es zur Speisekarte, zur Reservierung und zur Startseite des Il Pomodoro.',
  body: () => `
<section class="wrap notfound">
  <p class="big" aria-hidden="true">404</p>
  <h1>Dieser Tisch ist leider nicht gedeckt.</h1>
  <p class="lead">Die Seite gibt es nicht oder nicht mehr. Vielleicht suchen Sie eine davon:</p>
  <div class="cta-actions">
    <a class="btn btn-accent btn-lg" href="/reservierung/">${icon('calendar-check')}Tisch reservieren</a>
    <a class="btn btn-ghost btn-lg" href="/speisekarte/">Speisekarte</a>
    <a class="btn btn-ghost btn-lg" href="/">Zur Startseite</a>
  </div>
</section>
`,
};
