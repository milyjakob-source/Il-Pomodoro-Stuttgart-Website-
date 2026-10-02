// Auszug aus der festen Karte. Gerichte stammen aus öffentlichen Quellen (alte Website, Speisekarten-Portale)
// und sind vor dem Livegang mit dem Restaurant abzugleichen. PRÜFEN
// Preise werden bewusst nicht gezeigt; die aktuelle Karte mit Preisen gibt es im Restaurant.
// Die wechselnden Gerichte stehen auf der Wochenkarte (Google Sheet, siehe README).
// tags: 'veg' (vegetarisch), 'gf' (glutenfrei möglich), 'haus' (Empfehlung des Hauses), 'scharf'

export const KARTE_PDF = ''; // z. B. '../assets/speisekarte.pdf', dann erscheint ein Download-Knopf

export const KARTE = [
  {
    id: 'antipasti',
    titel: 'Antipasti',
    intro: 'Zum Teilen oder als Auftakt.',
    gerichte: [
      { name: 'Antipasto Verdura', text: 'Gegrilltes und eingelegtes Gemüse nach Art des Hauses', tags: ['veg'] },
      { name: 'Insalata di Mare', text: 'Meeresfrüchtesalat' },
      { name: 'Carpaccio di Salmone', text: 'Hauchdünn geschnittener Lachs' },
      { name: 'Carpaccio di Manzo', text: 'Hauchdünn geschnittenes Rindfleisch', tags: ['haus'] },
    ],
  },
  {
    id: 'pizza',
    titel: 'Pizza',
    intro: 'Aus dem Holzofen. Jede Pizza gibt es auch mit glutenfreiem Boden.',
    gerichte: [
      { name: 'Pizza Margherita', text: 'Tomatensauce, Mozzarella und Basilikum', tags: ['veg', 'gf'] },
      { name: 'Pizza Salami', text: 'Tomatensauce, Mozzarella und Salami', tags: ['gf'] },
      { name: 'Pizza Frutti di Mare', text: 'Tomatensauce, Mozzarella und Meeresfrüchte', tags: ['gf'] },
      { name: 'Pizza Gialla', text: 'Sauce aus gelben Tomaten, scharfe Spianata, Rucola und Büffelmozzarella', tags: ['haus', 'scharf', 'gf'] },
    ],
  },
  {
    id: 'pinsa',
    titel: 'Pinsa',
    intro: 'Der luftige, knusprige Teigfladen aus Rom, auch glutenfrei.',
    gerichte: [
      { name: 'Pinsa Gialla', text: 'Gelbe Tomaten, scharfe Spianata, Rucola und Büffelmozzarella', tags: ['scharf', 'gf'] },
      { name: 'Pinsa Burrata', text: 'Tomatensauce, Mozzarella, Kirschtomaten, Basilikum und Burrata', tags: ['veg', 'haus', 'gf'] },
    ],
  },
  {
    id: 'pasta',
    titel: 'Pasta',
    intro: 'Klassiker und Wochengerichte, frisch gekocht.',
    gerichte: [
      { name: "Penne all'Arrabbiata", text: 'Scharfe Tomatensauce mit Knoblauch und Peperoncino', tags: ['veg', 'scharf'] },
      { name: 'Tortellini alla Panna', text: 'Tortellini in Sahnesauce' },
      { name: 'Paglia e Fieno', text: 'Gelbe und grüne Bandnudeln, „Stroh und Heu“' },
      { name: 'Fettuccine al Salmone', text: 'Bandnudeln mit Lachs', tags: ['haus'] },
    ],
  },
  {
    id: 'pesce',
    titel: 'Fisch und Fleisch',
    intro: 'Teilweise im Holzofen zubereitet. Weitere Gerichte auf der Wochenkarte.',
    gerichte: [
      { name: 'Salmone al Forno', text: 'Lachssteak aus dem Holzofen mit frischem Gemüse in Tomatensauce', tags: ['haus'] },
    ],
  },
];
