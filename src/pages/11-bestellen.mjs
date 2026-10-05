import { icon } from '../../tools/build.mjs';
import { SITE } from '../site.mjs';

// Bestellseite: Karte, Preise und Liefergebiet kommen live aus der Inhaber-App (assets/js/bestellen.js).
export default {
  id: 'bestellen',
  slug: 'bestellen/',
  priority: 0.8,
  title: 'Online bestellen',
  ogTitle: 'Pizza und Pasta bestellen beim Il Pomodoro',
  description:
    'Pizza, Pinsa und Pasta vom Il Pomodoro online bestellen: zur Abholung an der Filderstraße oder mit Lieferung in Stuttgart-Süd. Bezahlung bei Übergabe.',
  body: (ctx) => `
<section class="wrap page-hero">
  <h1>Online bestellen</h1>
  <p class="lead">Frisch aus dem Holzofen, zum Abholen oder geliefert. Bezahlt wird bar oder mit Karte bei Übergabe.</p>
</section>

<section class="wrap order-layout" data-order>
  <div>
    <nav class="order-cats" aria-label="Kategorien" data-order-cats></nav>
    <div data-order-menu>
      <div class="slots-empty" data-order-status>Die Bestellkarte wird geladen …</div>
    </div>
  </div>

  <aside class="cart form-card" id="warenkorb" aria-labelledby="cart-title" data-cart>
    <h2 id="cart-title" class="cart-title">${icon('shopping-bag')}Ihre Bestellung</h2>
    <ul class="cart-list" data-cart-list></ul>
    <p class="slots-empty" data-cart-empty>Noch nichts ausgewählt. Tippen Sie bei einem Gericht auf Plus.</p>
    <dl class="cart-sum" data-cart-sum hidden>
      <div><dt>Zwischensumme</dt><dd data-sum-zwischen></dd></div>
      <div data-sum-liefer-row><dt>Liefergebühr</dt><dd data-sum-liefer></dd></div>
      <div class="cart-total"><dt>Summe</dt><dd data-sum-gesamt></dd></div>
    </dl>
    <p class="field-hint" data-cart-hinweis></p>

    <form class="form" name="bestellung" method="POST" data-guard data-order-form novalidate hidden>
      <input type="hidden" name="t0" value="">
      <p class="hp" aria-hidden="true"><label>Bitte leer lassen <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>

      <div class="field">
        <fieldset class="persons" data-order-typ>
          <legend>Wie möchten Sie Ihr Essen?</legend>
          <label class="chip"><input type="radio" name="typ" value="abholung" checked><span>${icon('storefront')}Abholen</span></label>
          <label class="chip"><input type="radio" name="typ" value="lieferung"><span>${icon('moped')}Liefern</span></label>
        </fieldset>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="b-name">Name</label>
          <input class="input" id="b-name" name="name" autocomplete="name" required maxlength="80" data-msg-required="Auf welchen Namen dürfen wir die Bestellung schreiben?">
          <p class="field-error" role="alert"></p>
        </div>
        <div class="field">
          <label for="b-tel">Telefon</label>
          <input class="input" id="b-tel" name="telefon" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30" data-validate="phone" data-msg-required="Für Rückfragen brauchen wir Ihre Nummer.">
          <p class="field-error" role="alert"></p>
        </div>
      </div>

      <div class="field">
        <label for="b-mail">E-Mail</label>
        <input class="input" id="b-mail" name="email" type="email" autocomplete="email" required maxlength="120" data-msg-required="An diese Adresse schicken wir die Bestätigung mit Uhrzeit.">
        <p class="field-error" role="alert"></p>
      </div>

      <div class="form-grid-adresse" data-adresse hidden>
        <div class="field">
          <label for="b-strasse">Straße und Hausnummer</label>
          <input class="input" id="b-strasse" name="strasse" autocomplete="street-address" maxlength="120" data-msg-required="Wohin dürfen wir liefern?">
          <p class="field-error" role="alert"></p>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="b-plz">PLZ</label>
            <input class="input" id="b-plz" name="plz" autocomplete="postal-code" inputmode="numeric" maxlength="5" data-msg-required="Bitte die Postleitzahl angeben.">
            <p class="field-error" role="alert"></p>
          </div>
          <div class="field">
            <label for="b-ort">Ort</label>
            <input class="input" id="b-ort" name="ort" autocomplete="address-level2" maxlength="60" value="Stuttgart">
            <p class="field-error" role="alert"></p>
          </div>
        </div>
      </div>

      <div class="field">
        <label for="b-zeit">Wann?</label>
        <select class="input" id="b-zeit" name="wunschzeit" data-order-zeit></select>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <label for="b-notiz">Anmerkungen <span class="opt">(optional)</span></label>
        <textarea class="input" id="b-notiz" name="bemerkung" maxlength="500" placeholder="z. B. Klingel, Allergien, ohne Zwiebeln"></textarea>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="field">
        <label class="check"><input type="checkbox" name="datenschutz" required data-msg-required="Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu."> <span>Ich bin einverstanden, dass meine Angaben zur Abwicklung der Bestellung gespeichert werden. Mehr in der <a href="${ctx.root}datenschutz/#bestellung">Datenschutzerklärung</a>. Es gelten die <a href="${ctx.root}agb/#bestellung">Bestellbedingungen</a>.</span></label>
        <p class="field-error" role="alert"></p>
      </div>

      <div class="form-status is-error" data-form-error role="alert">${icon('warning')}<span></span></div>

      <button class="btn btn-accent btn-lg" type="submit">${icon('check')}Zahlungspflichtig bestellen</button>
    </form>
  </aside>
</section>

<a class="cart-bar" href="#warenkorb" data-cart-bar hidden>${icon('shopping-bag')}<span data-cart-bar-text>Warenkorb</span></a>

<template id="order-success">
  <div class="success" tabindex="-1">
    <span class="success-icon">${icon('check')}</span>
    <h2>Danke, Ihre Bestellung ist bei uns.</h2>
    <p class="lead">Wir prüfen sie sofort und schicken Ihnen eine E-Mail mit der Uhrzeit, zu der Ihr Essen fertig ist.</p>
    <p class="muted">Fragen zur Bestellung? Rufen Sie uns an: <a href="tel:${SITE.telefon.replace(/\s/g, '')}">${SITE.telefonAnzeige}</a></p>
  </div>
</template>

<template id="order-offline">
  <div class="slots-empty">
    <p><strong>Online-Bestellung ist gerade nicht verfügbar.</strong></p>
    <p>Bestellen Sie gern telefonisch zum Abholen: <a href="tel:${SITE.telefon.replace(/\s/g, '')}" data-track="anruf">${SITE.telefonAnzeige}</a></p>
  </div>
</template>
`,
  scripts: ['bestellen.js'],
};
