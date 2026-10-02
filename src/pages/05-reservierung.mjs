import { icon } from '../../tools/build.mjs';
import { SITE, KUECHE_BIS } from '../site.mjs';

export default {
  id: 'reservierung',
  slug: 'reservierung/',
  priority: 0.9,
  title: 'Tisch reservieren',
  ogTitle: 'Tisch reservieren im Il Pomodoro',
  description:
    'Tisch im Il Pomodoro in Stuttgart-Süd online reservieren: Datum, Uhrzeit und Personen wählen, Bestätigung per E-Mail. Gruppen und Feiern auf Anfrage.',
  body: (ctx) => `
<section class="wrap page-hero">
  <h1>Tisch reservieren</h1>
  <p class="lead">In einer Minute erledigt. Sie bekommen die Bestätigung per E-Mail.</p>
</section>

<section class="wrap form-layout">
  <div class="form-card" data-reservation-card>
    <form class="form" name="reservierung" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-guard data-reservation novalidate>
      <input type="hidden" name="form-name" value="reservierung">
      <input type="hidden" name="t0" value="">
      <!-- Netlify erkennt nur Felder, die schon im HTML stehen; die Uhrzeiten entstehen erst im Browser. -->
      <input type="hidden" name="uhrzeit" value="">
      <p class="hp" aria-hidden="true"><label>Bitte leer lassen <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>

      <div class="field">
        <fieldset class="persons" data-required-group="personen" data-msg-required="Bitte die Anzahl der Personen wählen.">
          <legend>Personen</legend>
          ${[1, 2, 3, 4, 5, 6, 7, 8]
            .map((n) => `<label class="chip"><input type="radio" name="personen" value="${n}"${n === 2 ? ' checked' : ''}><span>${n}</span></label>`)
            .join('')}
        </fieldset>
        <p class="field-hint">Mehr als 8 Personen? <a href="${ctx.root}kontakt/#anfrage">Gruppe anfragen</a> oder anrufen.</p>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <label for="r-datum">Datum</label>
        <input class="input" type="date" id="r-datum" name="datum" required data-msg-required="Bitte ein Datum wählen." data-date>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <fieldset class="slot-group" data-required-group="uhrzeit" data-msg-required="Bitte eine Uhrzeit wählen.">
          <legend>Uhrzeit</legend>
          <div class="slot-group" data-slots><p class="slots-empty">Bitte zuerst ein Datum wählen.</p></div>
        </fieldset>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="r-name">Name</label>
          <input class="input" id="r-name" name="name" autocomplete="name" required maxlength="80" data-msg-required="Auf welchen Namen dürfen wir reservieren?">
          <p class="field-error" role="alert"></p>
        </div>
        <div class="field">
          <label for="r-tel">Telefon</label>
          <input class="input" id="r-tel" name="telefon" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30" data-validate="phone" data-msg-required="Für Rückfragen brauchen wir Ihre Nummer.">
          <p class="field-error" role="alert"></p>
        </div>
      </div>

      <div class="field">
        <label for="r-mail">E-Mail</label>
        <input class="input" id="r-mail" name="email" type="email" autocomplete="email" required maxlength="120" data-msg-required="An diese Adresse schicken wir die Bestätigung.">
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <label for="r-notiz">Anmerkungen <span class="opt">(optional)</span></label>
        <textarea class="input" id="r-notiz" name="anmerkung" maxlength="500" placeholder="z. B. Kinderstuhl, Allergien, Geburtstag"></textarea>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <label class="check"><input type="checkbox" name="datenschutz" required data-msg-required="Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu."> <span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Reservierung gespeichert werden. Mehr in der <a href="${ctx.root}datenschutz/#reservierung">Datenschutzerklärung</a>. Es gelten die <a href="${ctx.root}agb/">Reservierungsbedingungen</a>.</span></label>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="form-status is-error" data-form-error role="alert">${icon('warning')}<span></span></div>

      <button class="btn btn-accent btn-lg" type="submit">${icon('calendar-check')}Verbindlich reservieren</button>
    </form>
  </div>

  <aside class="aside-list" aria-label="Hinweise zur Reservierung">
    <div class="aside-item">${icon('clock')}<div><h2 class="aside-title">Tisch wird 15 Minuten gehalten</h2><p class="muted">Sie verspäten sich? Rufen Sie kurz an, dann halten wir den Tisch gern länger.</p></div></div>
    <div class="aside-item">${icon('users-three')}<div><h2 class="aside-title">Gruppen und Feiern</h2><p class="muted">Ab 9 Personen planen wir individuell mit Ihnen. <a href="${ctx.root}kontakt/#anfrage">Zur Anfrage</a></p></div></div>
    <div class="aside-item">${icon('envelope')}<div><h2 class="aside-title">Stornieren</h2><p class="muted">Über den Link in Ihrer Bestätigung oder telefonisch, bis 24 Stunden vorher bitte.</p></div></div>
    <div class="aside-item">${icon('phone')}<div><h2 class="aside-title">Lieber persönlich?</h2><p class="muted"><a href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${SITE.telefonAnzeige}</a>, während der Öffnungszeiten.</p></div></div>
    <div class="aside-item" data-google-booking hidden>${icon('google-logo')}<div><h2 class="aside-title">Termin über Google buchen</h2><p class="muted"><a data-google-booking-link href="#" rel="noopener" target="_blank">Buchungsseite öffnen</a></p></div></div>
  </aside>
</section>

<template id="reservation-success">
  <div class="success" tabindex="-1">
    <span class="success-icon">${icon('check')}</span>
    <h2 data-success-title>Danke, wir haben Ihre Reservierung.</h2>
    <p class="lead" data-success-text></p>
    <p class="muted">Eine Bestätigung ist unterwegs an <strong data-success-mail></strong>. Keine E-Mail bekommen? Schauen Sie im Spam-Ordner nach oder rufen Sie uns an.</p>
    <div class="cta-actions">
      <a class="btn btn-ghost" href="${ctx.root}speisekarte/">Speisekarte ansehen</a>
      <a class="btn btn-ghost" href="${SITE.mapsLink}" rel="noopener" target="_blank">${icon('map-pin')}Route planen</a>
    </div>
  </div>
</template>
`,
  scripts: ['reservierung.js'],
};
