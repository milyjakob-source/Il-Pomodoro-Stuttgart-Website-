import { icon } from '../../tools/build.mjs';

// Inhaber-App: Bestellungen annehmen, Reservierungen eintragen, Plätze, Karte, Texte und Bilder pflegen.
// Läuft im Browser (auch als App auf dem Startbildschirm), spricht nur mit dem Apps Script. Logik: assets/js/app.js

const SPRITE = ['plus', 'minus', 'check', 'x', 'phone', 'map-pin', 'moped', 'storefront', 'trash', 'arrow-up', 'arrow-down', 'pencil-simple', 'clock', 'users-three', 'chef-hat', 'calendar-plus', 'caret-left', 'caret-right', 'bell', 'warning', 'image'];

function sprite() {
  return `<svg width="0" height="0" class="sprite" aria-hidden="true">${SPRITE.map((n) =>
    icon(n)
      .replace(/<svg[^>]*>/, `<symbol id="i-${n}" viewBox="0 0 256 256">`)
      .replace('</svg>', '</symbol>'),
  ).join('')}</svg>`;
}

const TABS = [
  ['heute', 'house', 'Heute'],
  ['bestellungen', 'shopping-bag', 'Bestellungen'],
  ['reservierungen', 'calendar-check', 'Tische'],
  ['karte', 'note-pencil', 'Karte'],
  ['einstellungen', 'gear', 'Mehr'],
];

const toggle = (name, titel, text) => `<label class="switch-row">
  <span><strong>${titel}</strong>${text ? `<span class="fine">${text}</span>` : ''}</span>
  <input type="checkbox" class="switch" name="${name}" data-setting>
</label>`;

export default {
  id: 'app',
  slug: 'app/',
  layout: 'app',
  noindex: true,
  title: 'Inhaber-App',
  description: 'Interne App für das Il Pomodoro: Bestellungen, Reservierungen, Plätze, Speisekarte und Bilder verwalten. Nur mit PIN.',
  body: (ctx) => `
${sprite()}

<!-- Anmeldung -->
<section class="login" data-login>
  <div class="login-card">
    <img class="login-logo logo-light" src="${ctx.root}assets/img/logo.svg" alt="Il Pomodoro" width="173" height="46">
    <img class="login-logo logo-dark" src="${ctx.root}assets/img/logo-dark.svg" alt="Il Pomodoro" width="173" height="46">
    <h1>Inhaber-App</h1>
    <p class="muted">Bestellungen, Reservierungen und Ihre Website an einem Ort.</p>
    <form class="form" data-login-form novalidate>
      <div class="field">
        <label for="pin">PIN</label>
        <input class="input pin-input" id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" required>
      </div>
      <div class="form-status is-error" data-login-error role="alert">${icon('warning')}<span></span></div>
      <button class="btn btn-accent btn-lg" type="submit">${icon('lock-key')}Anmelden</button>
    </form>
    <p class="fine" data-login-setup hidden>Die App ist noch nicht verbunden: In <code>assets/js/config.js</code> fehlt die Adresse des Apps Scripts (<code>endpoint</code>). Anleitung im README.</p>
  </div>
</section>

<!-- App -->
<div class="shell" data-shell hidden>
  <header class="app-top">
    <img class="app-logo logo-light" src="${ctx.root}assets/img/logo.svg" alt="Il Pomodoro" width="120" height="32">
    <img class="app-logo logo-dark" src="${ctx.root}assets/img/logo-dark.svg" alt="Il Pomodoro" width="120" height="32">
    <span class="live" data-live title="Verbindung">Live</span>
    <button class="icon-btn" type="button" data-sound aria-pressed="true" aria-label="Ton bei neuen Bestellungen">${icon('bell')}</button>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Farbmodus wechseln">
      <span class="theme-icon theme-icon-sun">${icon('sun')}</span><span class="theme-icon theme-icon-moon">${icon('moon')}</span>
    </button>
  </header>

  <nav class="app-tabs" aria-label="Bereiche">
    ${TABS.map(([id, ic, label]) => `<button type="button" data-tab="${id}">${icon(ic)}<span>${label}</span><b class="badge" data-badge="${id}" hidden></b></button>`).join('')}
  </nav>

  <main class="app-main" id="inhalt">
    <!-- Heute -->
    <section class="view" data-view="heute">
      <div class="view-head">
        <div><h2 data-gruss>Buongiorno</h2><p class="muted" data-heute-datum></p></div>
        <button class="btn btn-accent" type="button" data-neue-res>${icon('phone')}Telefon-Reservierung</button>
      </div>
      <div class="kpis">
        <button type="button" class="kpi" data-goto="bestellungen"><strong data-kpi="bestellungen">0</strong><span>neue Bestellungen</span></button>
        <button type="button" class="kpi" data-goto="reservierungen"><strong data-kpi="gaeste">0</strong><span>Gäste heute</span></button>
        <button type="button" class="kpi" data-goto="reservierungen"><strong data-kpi="anfragen">0</strong><span>Anfragen offen</span></button>
        <button type="button" class="kpi" data-goto="einstellungen"><strong data-kpi="plaetze">0</strong><span>Plätze online</span></button>
      </div>
      <div class="card quick">
        ${toggle('reservierungOnline', 'Online-Reservierung', 'Aus: Gäste sehen „bitte anrufen“')}
        ${toggle('bestellungAktiv', 'Online-Bestellung', 'Aus: Bestellseite ist pausiert')}
      </div>
      <h3 class="list-title" data-titel-neu hidden>Neue Bestellungen</h3>
      <div class="stack" data-heute-bestellungen></div>
      <h3 class="list-title" data-titel-anfragen hidden>Reservierungen bestätigen</h3>
      <div class="stack" data-heute-anfragen></div>
      <h3 class="list-title">Heute im Haus</h3>
      <div class="stack" data-heute-res></div>
    </section>

    <!-- Bestellungen -->
    <section class="view" data-view="bestellungen" hidden>
      <div class="view-head">
        <h2>Bestellungen</h2>
        <div class="segmented" role="group" aria-label="Filter">
          <button type="button" aria-pressed="true" data-best-filter="aktiv">Offen</button>
          <button type="button" aria-pressed="false" data-best-filter="alle">Alle</button>
        </div>
      </div>
      <div class="stack" data-best-liste></div>
    </section>

    <!-- Reservierungen -->
    <section class="view" data-view="reservierungen" hidden>
      <div class="view-head">
        <h2>Tische</h2>
        <button class="btn btn-accent" type="button" data-neue-res>${icon('plus')}Reservierung</button>
      </div>
      <div class="datebar">
        <button class="icon-btn" type="button" data-tag-schritt="-1" aria-label="Vorheriger Tag">${icon('caret-left')}</button>
        <label class="sr-only" for="res-datum">Datum</label>
        <input class="input" type="date" id="res-datum" data-res-datum>
        <button class="icon-btn" type="button" data-tag-schritt="1" aria-label="Nächster Tag">${icon('caret-right')}</button>
        <button class="btn btn-ghost" type="button" data-tag-heute>Heute</button>
      </div>
      <div class="card">
        <div class="card-head"><h3>Auslastung</h3><span class="fine" data-auslastung-info></span></div>
        <div class="auslastung" data-auslastung></div>
      </div>
      <div class="stack" data-res-liste></div>
    </section>

    <!-- Karte -->
    <section class="view" data-view="karte" hidden>
      <div class="view-head">
        <h2>Karte</h2>
        <div class="segmented" role="group" aria-label="Karte wählen">
          <button type="button" aria-pressed="true" data-karte-tab="speise">Speisekarte</button>
          <button type="button" aria-pressed="false" data-karte-tab="woche">Wochenkarte</button>
        </div>
      </div>
      <div data-karte-speise>
        <p class="fine">Preis eintippen, fertig. Der Schalter bestimmt, ob ein Gericht online bestellbar ist (z. B. aus, wenn etwas ausverkauft ist).</p>
        <div data-karte-liste></div>
        <button class="btn btn-ghost" type="button" data-gericht-neu>${icon('plus')}Neues Gericht</button>
      </div>
      <div data-karte-woche hidden>
        <div class="field">
          <label for="wk-hinweis">Hinweis über der Wochenkarte</label>
          <input class="input" id="wk-hinweis" maxlength="200" placeholder="z. B. Gültig vom 6. bis 10. Oktober" data-wk-hinweis>
        </div>
        <div class="stack" data-wk-liste></div>
        <div class="row-gap">
          <button class="btn btn-ghost" type="button" data-wk-neu>${icon('plus')}Gericht hinzufügen</button>
          <button class="btn btn-ghost" type="button" data-wk-leeren>${icon('trash')}Alle entfernen</button>
        </div>
      </div>
      <div class="savebar" data-savebar hidden>
        <span>Ungespeicherte Änderungen</span>
        <button class="btn btn-accent" type="button" data-karte-speichern>${icon('check')}Speichern</button>
      </div>
    </section>

    <!-- Einstellungen -->
    <section class="view" data-view="einstellungen" hidden>
      <div class="view-head"><h2>Einstellungen</h2><span class="fine" data-gespeichert></span></div>
      <form class="settings" data-settings novalidate>
        <div class="card">
          <div class="card-head"><h3>${icon('users-three')}Plätze für Online-Reservierungen</h3></div>
          <p class="fine">So viele Gäste dürfen gleichzeitig online reserviert sein. Telefonische Reservierungen zählen mit.</p>
          <div class="big-stepper">
            <button class="icon-btn" type="button" data-schritt="-2" aria-label="Weniger Plätze">${icon('minus')}</button>
            <label class="sr-only" for="s-kapazitaet">Plätze</label>
            <input class="input" id="s-kapazitaet" name="kapazitaet" type="number" min="0" max="400" inputmode="numeric" data-setting>
            <button class="icon-btn" type="button" data-schritt="2" aria-label="Mehr Plätze">${icon('plus')}</button>
          </div>
          <div class="presets">
            <button class="btn btn-ghost" type="button" data-preset="presetSommer">${icon('sun')}Sommer <b data-preset-wert="presetSommer"></b></button>
            <button class="btn btn-ghost" type="button" data-preset="presetWinter">${icon('snowflake')}Winter <b data-preset-wert="presetWinter"></b></button>
          </div>
          <details class="more">
            <summary>Saisonwerte und Dauer anpassen</summary>
            <div class="form-row">
              <div class="field"><label for="s-sommer">Plätze im Sommer (mit Terrasse)</label><input class="input" id="s-sommer" name="presetSommer" type="number" min="0" max="400" data-setting></div>
              <div class="field"><label for="s-winter">Plätze im Winter</label><input class="input" id="s-winter" name="presetWinter" type="number" min="0" max="400" data-setting></div>
            </div>
            <div class="field">
              <label for="s-dauer">So lange bleibt ein Tisch belegt</label>
              <select class="input" id="s-dauer" name="dauerMinuten" data-setting>
                <option value="90">1,5 Stunden</option><option value="120">2 Stunden</option><option value="150">2,5 Stunden</option><option value="180">3 Stunden</option>
              </select>
            </div>
          </details>
          ${toggle('sofortBestaetigen', 'Online-Reservierungen sofort bestätigen', 'Aus: Sie bestätigen jede Anfrage in der App')}
          ${toggle('reservierungOnline', 'Online-Reservierung aktiv', '')}
        </div>

        <div class="card">
          <div class="card-head"><h3>${icon('calendar-plus')}Geschlossene Tage</h3></div>
          <p class="fine">Betriebsferien oder Feiertage: An diesen Tagen gibt es keine Online-Reservierung und keine Bestellung.</p>
          <div class="row-gap">
            <label class="sr-only" for="s-zu">Tag</label>
            <input class="input input-auto" type="date" id="s-zu" data-zu-datum>
            <button class="btn btn-ghost" type="button" data-zu-neu>${icon('plus')}Hinzufügen</button>
          </div>
          <div class="chips" data-zu-liste></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>${icon('moped')}Bestellung und Lieferung</h3></div>
          ${toggle('bestellungAktiv', 'Online-Bestellung aktiv', '')}
          ${toggle('abholungAktiv', 'Abholung anbieten', '')}
          ${toggle('lieferungAktiv', 'Lieferung anbieten', '')}
          <div class="form-row">
            <div class="field"><label for="s-mbw">Mindestbestellwert Lieferung (€)</label><input class="input" id="s-mbw" name="mindestbestellwert" type="number" step="0.5" min="0" inputmode="decimal" data-setting></div>
            <div class="field"><label for="s-gebuehr">Liefergebühr (€)</label><input class="input" id="s-gebuehr" name="liefergebuehr" type="number" step="0.5" min="0" inputmode="decimal" data-setting></div>
          </div>
          <div class="form-row">
            <div class="field"><label for="s-vorlauf">Frühestens fertig nach (Minuten)</label><input class="input" id="s-vorlauf" name="vorlaufMinuten" type="number" step="5" min="10" max="180" data-setting></div>
            <div class="field"><label for="s-plz">Liefergebiet (PLZ, mit Komma)</label><input class="input" id="s-plz" name="liefergebietPlz" data-setting></div>
          </div>
        </div>
      </form>

      <div class="card">
        <div class="card-head"><h3>${icon('note-pencil')}Texte auf der Website</h3></div>
        <form class="form" data-texte novalidate>
          <div class="field">
            <label for="t-ank">Hinweis oben auf allen Seiten <span class="opt">(leer = kein Hinweis)</span></label>
            <input class="input" id="t-ank" name="ankuendigung" maxlength="160" placeholder="z. B. Betriebsferien vom 1. bis 15. August">
          </div>
          <div class="field">
            <label for="t-start">Startseite: Text unter der Überschrift</label>
            <textarea class="input" id="t-start" name="start_text" maxlength="300"></textarea>
          </div>
          <div class="field">
            <label for="t-ueber">Über uns: erster Absatz</label>
            <textarea class="input" id="t-ueber" name="ueber_text" maxlength="800"></textarea>
          </div>
          <button class="btn btn-accent" type="submit">${icon('check')}Texte speichern</button>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>${icon('image')}Bilder auf der Website</h3></div>
        <p class="fine">Foto antippen und ein neues auswählen. Es wird automatisch verkleinert und erscheint nach etwa einer Minute auf der Website.</p>
        <div class="bilder" data-bilder></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>${icon('lock-key')}PIN und Abmelden</h3></div>
        <form class="row-gap" data-pin-form novalidate>
          <label class="sr-only" for="neue-pin">Neue PIN</label>
          <input class="input input-auto" id="neue-pin" type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN (4 bis 8 Ziffern)" autocomplete="new-password">
          <button class="btn btn-ghost" type="submit">PIN ändern</button>
        </form>
        <button class="btn btn-ghost mt-12" type="button" data-logout>${icon('sign-out')}Abmelden</button>
      </div>
    </section>
  </main>
</div>

<!-- Telefonische Reservierung -->
<dialog class="sheet" data-res-dialog aria-labelledby="res-dialog-title">
  <form class="form" method="dialog" data-res-form novalidate>
    <div class="sheet-head"><h2 id="res-dialog-title">Reservierung eintragen</h2><button class="icon-btn" type="button" data-close aria-label="Schließen">${icon('x')}</button></div>
    <div class="form-row">
      <div class="field"><label for="n-datum">Datum</label><input class="input" id="n-datum" name="datum" type="date" required></div>
      <div class="field"><label for="n-zeit">Uhrzeit</label><select class="input" id="n-zeit" name="uhrzeit" required></select></div>
    </div>
    <div class="field">
      <label for="n-personen">Personen</label>
      <div class="big-stepper">
        <button class="icon-btn" type="button" data-personen="-1" aria-label="Eine Person weniger">${icon('minus')}</button>
        <input class="input" id="n-personen" name="personen" type="number" min="1" max="200" value="2" inputmode="numeric" required>
        <button class="icon-btn" type="button" data-personen="1" aria-label="Eine Person mehr">${icon('plus')}</button>
      </div>
    </div>
    <div class="form-row">
      <div class="field"><label for="n-name">Name</label><input class="input" id="n-name" name="name" maxlength="80" required autocomplete="off"></div>
      <div class="field"><label for="n-tel">Telefon <span class="opt">(optional)</span></label><input class="input" id="n-tel" name="telefon" type="tel" maxlength="30" autocomplete="off"></div>
    </div>
    <div class="field"><label for="n-mail">E-Mail <span class="opt">(optional, dann bekommt der Gast eine Bestätigung)</span></label><input class="input" id="n-mail" name="email" type="email" maxlength="120" autocomplete="off"></div>
    <div class="field"><label for="n-notiz">Notiz <span class="opt">(optional)</span></label><input class="input" id="n-notiz" name="anmerkung" maxlength="500" placeholder="z. B. Kinderstuhl, Terrasse"></div>
    <div class="form-status is-error" data-res-error role="alert">${icon('warning')}<span></span></div>
    <button class="btn btn-accent btn-lg" type="submit">${icon('check')}Eintragen</button>
  </form>
</dialog>

<!-- Bestellung annehmen -->
<dialog class="sheet" data-annehmen-dialog aria-labelledby="annehmen-title">
  <div class="sheet-head"><h2 id="annehmen-title">Wann ist es fertig?</h2><button class="icon-btn" type="button" data-close aria-label="Schließen">${icon('x')}</button></div>
  <p class="muted" data-annehmen-info></p>
  <div class="minuten">${[15, 20, 30, 45, 60, 90].map((m) => `<button class="btn btn-ghost btn-lg" type="button" data-minuten="${m}">${m} Min.</button>`).join('')}</div>
  <p class="fine">Der Gast bekommt sofort eine E-Mail mit der Uhrzeit.</p>
</dialog>

<!-- Gericht bearbeiten -->
<dialog class="sheet" data-gericht-dialog aria-labelledby="gericht-title">
  <form class="form" method="dialog" data-gericht-form novalidate>
    <div class="sheet-head"><h2 id="gericht-title">Gericht</h2><button class="icon-btn" type="button" data-close aria-label="Schließen">${icon('x')}</button></div>
    <div class="form-row">
      <div class="field"><label for="g-name">Name</label><input class="input" id="g-name" name="name" maxlength="80" required></div>
      <div class="field"><label for="g-preis">Preis (€)</label><input class="input" id="g-preis" name="preis" type="number" step="0.1" min="0" inputmode="decimal"></div>
    </div>
    <div class="field"><label for="g-kat">Kategorie</label><input class="input" id="g-kat" name="kategorie" list="kategorien" maxlength="40" required><datalist id="kategorien" data-kategorien></datalist></div>
    <div class="field"><label for="g-text">Beschreibung</label><textarea class="input" id="g-text" name="beschreibung" maxlength="300"></textarea></div>
    <fieldset class="field tag-wahl">
      <legend>Kennzeichen</legend>
      <label class="check"><input type="checkbox" name="tag" value="veg"> <span>Vegetarisch</span></label>
      <label class="check"><input type="checkbox" name="tag" value="gf"> <span>Glutenfrei möglich</span></label>
      <label class="check"><input type="checkbox" name="tag" value="haus"> <span>Empfehlung</span></label>
      <label class="check"><input type="checkbox" name="tag" value="scharf"> <span>Scharf</span></label>
    </fieldset>
    <label class="switch-row"><span><strong>Auf der Website zeigen</strong></span><input type="checkbox" class="switch" name="aktiv"></label>
    <label class="switch-row"><span><strong>Online bestellbar</strong></span><input type="checkbox" class="switch" name="bestellbar"></label>
    <div class="row-gap sheet-actions">
      <button class="btn btn-accent" type="submit">${icon('check')}Übernehmen</button>
      <button class="btn btn-ghost" type="button" data-gericht-loeschen>${icon('trash')}Löschen</button>
    </div>
  </form>
</dialog>

<div class="toast" data-toast role="status" aria-live="polite" hidden></div>
`,
};
