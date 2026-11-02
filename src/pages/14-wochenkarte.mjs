import { karteSeite } from '../teile.mjs';

// Bild kommt aus dem Google-Drive-Ordner „Wochenkarte“ (apps-script/Karten.gs, assets/js/karten.js).
export default {
  id: 'wochenkarte',
  slug: 'wochenkarte/',
  priority: 0.8,
  title: 'Wochenkarte',
  description: 'Die Wochenkarte des Il Pomodoro in Stuttgart-Süd: wechselnde Gerichte der Woche und Mittagstisch. Immer aktuell, auch auf Instagram und Facebook.',
  body: (ctx) =>
    karteSeite(ctx, {
      bereich: 'wochenkarte',
      titel: 'Wochenkarte',
      eyebrow: 'La settimana',
      lead: 'Unsere wechselnden Gerichte dieser Woche, mittags von Montag bis Freitag und abends.',
      leer: 'Die Wochenkarte für diese Woche folgt in Kürze.',
    }),
  scripts: ['karten.js'],
};
