import { karteSeite } from '../teile.mjs';

// Bilder kommen aus dem Google-Drive-Ordner „Neuigkeiten“ (apps-script/Karten.gs, assets/js/karten.js).
export default {
  id: 'neuigkeiten',
  slug: 'neuigkeiten/',
  priority: 0.7,
  title: 'Neuigkeiten',
  description: 'Neuigkeiten aus dem Il Pomodoro in Stuttgart-Süd: Feiertage, Betriebsferien, Aktionen und Feiern. Auch auf Instagram und Facebook.',
  body: (ctx) =>
    karteSeite(ctx, {
      bereich: 'neuigkeiten',
      titel: 'Neuigkeiten',
      eyebrow: 'Notizie',
      lead: 'Feiertage, Aktionen, Feiern und alles, was bei uns gerade los ist.',
      leer: 'Gerade gibt es keine neuen Neuigkeiten.',
    }),
  scripts: ['karten.js'],
};
