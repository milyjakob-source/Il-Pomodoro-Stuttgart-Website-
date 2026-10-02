import { icon } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';
import { besuch } from '../teile.mjs';

export default {
  id: 'kontakt',
  slug: 'kontakt/',
  priority: 0.8,
  title: 'Kontakt & Anfahrt',
  description:
    'Il Pomodoro, Filderstraße 25, 70180 Stuttgart. Telefon 0711 51876650. Öffnungszeiten, Anfahrt und Anfragen für Feiern, Gruppen und Gutscheine.',
  body: (ctx) => `
<section class="wrap page-hero">
  <h1>Kontakt & Anfahrt</h1>
  <p class="lead">Am schnellsten erreichen Sie uns telefonisch während der Öffnungszeiten. Für Feiern, Gruppen und Gutscheine schreiben Sie uns gern.</p>
  <div class="cta-actions">
    <a class="btn btn-accent btn-lg" href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${icon('phone')}${SITE.telefonAnzeige}</a>
    <a class="btn btn-ghost btn-lg" href="mailto:${SITE.email}">${icon('envelope')}${SITE.email}</a>
  </div>
</section>

${besuch(ctx, { titel: 'Anfahrt und Öffnungszeiten' })}

<section class="section-tight" id="anfrage">
  <div class="wrap form-layout">
    <div class="form-card">
      <h2 class="mt-12">Anfrage schicken</h2>
      <p class="muted mt-12">Wir antworten in der Regel innerhalb von ein bis zwei Tagen. Für Tischreservierungen nutzen Sie bitte die <a href="${ctx.root}reservierung/">Online-Reservierung</a>.</p>
      <form class="form mt-28" name="anfrage" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-guard data-inquiry novalidate>
        <input type="hidden" name="form-name" value="anfrage">
        <input type="hidden" name="t0" value="">
        <p class="hp" aria-hidden="true"><label>Bitte leer lassen <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>

        <div class="field">
          <label for="a-thema">Worum geht es?</label>
          <select class="input" id="a-thema" name="thema" required data-msg-required="Bitte ein Thema wählen.">
            <option value="Feier oder Gruppe">Feier oder Gruppe (ab 9 Personen)</option>
            <option value="Gutschein">Gutschein</option>
            <option value="Abholung">Bestellung zum Abholen</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
          <p class="field-error" role="alert"></p>
        </div>

        <div class="form-row">
          <div class="field">
            <label for="a-name">Name</label>
            <input class="input" id="a-name" name="name" autocomplete="name" required maxlength="80">
            <p class="field-error" role="alert"></p>
          </div>
          <div class="field">
            <label for="a-mail">E-Mail</label>
            <input class="input" id="a-mail" name="email" type="email" autocomplete="email" required maxlength="120">
            <p class="field-error" role="alert"></p>
          </div>
        </div>

        <div class="form-row-3 form-row">
          <div class="field">
            <label for="a-tel">Telefon <span class="opt">(optional)</span></label>
            <input class="input" id="a-tel" name="telefon" type="tel" autocomplete="tel" maxlength="30" data-validate="phone">
            <p class="field-error" role="alert"></p>
          </div>
          <div class="field">
            <label for="a-datum">Wunschdatum <span class="opt">(optional)</span></label>
            <input class="input" id="a-datum" name="datum" type="date">
            <p class="field-error" role="alert"></p>
          </div>
          <div class="field">
            <label for="a-pers">Personen <span class="opt">(optional)</span></label>
            <input class="input" id="a-pers" name="personen" type="number" min="1" max="120" inputmode="numeric">
            <p class="field-error" role="alert"></p>
          </div>
        </div>

        <div class="field">
          <label for="a-text">Nachricht</label>
          <textarea class="input" id="a-text" name="nachricht" required maxlength="2000" data-msg-required="Was dürfen wir für Sie tun?"></textarea>
          <p class="field-error" role="alert"></p>
        </div>

        <div class="field">
          <label class="check"><input type="checkbox" name="datenschutz" required data-msg-required="Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu."> <span>Ich bin einverstanden, dass meine Angaben zur Beantwortung der Anfrage gespeichert werden. Mehr in der <a href="${ctx.root}datenschutz/#kontakt">Datenschutzerklärung</a>.</span></label>
          <p class="field-error" role="alert"></p>
        </div>

        <div class="form-status is-error" data-form-error role="alert">${icon('warning')}<span></span></div>
        <button class="btn btn-accent btn-lg" type="submit">${icon('envelope')}Anfrage senden</button>
      </form>
    </div>
    <aside class="aside-list" aria-label="Weitere Kontaktwege">
      <div class="aside-item">${icon('gift')}<div><h2 class="aside-title">Gutscheine</h2><p class="muted">Ein Abend im Il Pomodoro zum Verschenken. Gutscheine gibt es im Restaurant oder auf Anfrage.</p></div></div>
      <div class="aside-item">${icon('users-three')}<div><h2 class="aside-title">Feiern und Firmenessen</h2><p class="muted">Sagen Sie uns Anlass, Datum und Personenzahl, wir melden uns mit einem Vorschlag.</p></div></div>
      <div class="aside-item">${icon('train')}<div><h2 class="aside-title">Mit Bus und Bahn</h2><p class="muted">Stadtbahn-Haltestellen Marienplatz und Österreichischer Platz in der Nähe.</p></div></div>
      <div class="aside-item">${icon('car')}<div><h2 class="aside-title">Mit dem Auto</h2><p class="muted">Parkplätze im Stuttgarter Süden sind knapp, am besten mit Bus und Bahn kommen.</p></div></div>
    </aside>
  </div>
</section>
`,
  scripts: ['anfrage.js'],
};
