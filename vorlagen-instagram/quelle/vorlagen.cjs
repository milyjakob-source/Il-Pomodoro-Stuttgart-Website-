// Erzeugt die Instagram-Vorlagen als Word-Dateien (öffnen in Apple Pages). Aufruf: node vorlagen.cjs
// Seite 1080 × 1350 Pixel (4:5) = 7,5 × 9,375 Zoll. 1 Design-Pixel = 10 Twips, Schriftgröße in Halbpunkten = Pixel.
const fs = require('fs');
const path = require('path');
const d = require('docx');
const HIER = __dirname;
const OUT = path.join(HIER, '..');
const C = { ink: '151A17', muted: '4A524D', accent: 'A82F3E', light: 'FAFBF8', onRed: 'F6E3E5', line: 'DCDDD8' };
const SEITE = { size: { width: 10800, height: 13500 } };

function hintergrund(datei) {
  return new d.ImageRun({
    type: 'png',
    data: fs.readFileSync(path.join(HIER, datei)),
    transformation: { width: 720, height: 900 },
    floating: {
      horizontalPosition: { relative: d.HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: d.VerticalPositionRelativeFrom.PAGE, offset: 0 },
      behindDocument: true,
      allowOverlap: true,
      wrap: { type: d.TextWrappingType.NONE },
    },
    altText: { title: 'Hintergrund', description: 'Gestaltung im Stil der Website', name: 'Hintergrund' },
  });
}
const zeile = (px) => ({ line: px * 10, lineRule: d.LineRuleType.EXACT, before: 0, after: 0 });
const lauf = (text, o) => new d.TextRun({ text, font: o.font, size: o.size, bold: !!o.bold, color: o.color });
const leer = (px, kinder = []) => new d.Paragraph({ spacing: zeile(px), children: kinder });

/* Wochenkarte ------------------------------------------------------------ */
const GERICHTE = [
  ['Pici al Ragù', 'Handgerollte Pasta mit Wildschweinragout', '15,90 €'],
  ['Risotto ai Funghi', 'Cremiges Risotto mit Steinpilzen', '14,50 €'],
  ['Saltimbocca alla Romana', 'Kalbsschnitzel mit Salbei und Parmaschinken', '21,50 €'],
  ['Orata al Forno', 'Dorade aus dem Holzofen mit Ofengemüse', '22,90 €'],
  ['Pizza Autunno', 'Kürbiscreme, Salsiccia und Rosmarin', '13,90 €'],
  ['Panna Cotta', 'Mit Waldbeeren', '6,50 €'],
];
const ohne = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const tabelle = new d.Table({
  width: { size: 8720, type: d.WidthType.DXA },
  columnWidths: [6720, 2000],
  indent: { size: 400, type: d.WidthType.DXA },
  layout: d.TableLayoutType.FIXED,
  borders: { top: ohne, bottom: ohne, left: ohne, right: ohne, insideHorizontal: ohne, insideVertical: ohne },
  rows: GERICHTE.map(([name, text, preis], i) => {
    const unten = i < GERICHTE.length - 1 ? { style: d.BorderStyle.SINGLE, size: 6, color: C.line } : ohne;
    const rand = { top: ohne, left: ohne, right: ohne, bottom: unten };
    const m = { top: 130, bottom: 90, left: 0, right: 0 };
    return new d.TableRow({
      height: { value: 1000, rule: d.HeightRule.EXACT },
      cantSplit: true,
      children: [
        new d.TableCell({
          width: { size: 6720, type: d.WidthType.DXA }, borders: rand, margins: m,
          children: [
            new d.Paragraph({ spacing: zeile(44), children: [lauf(name, { font: 'Bricolage Grotesque', size: 34, bold: true, color: C.ink })] }),
            new d.Paragraph({ spacing: zeile(34), children: [lauf(text, { font: 'Geist', size: 22, color: C.muted })] }),
          ],
        }),
        new d.TableCell({
          width: { size: 2000, type: d.WidthType.DXA }, borders: rand, margins: m, verticalAlign: d.VerticalAlign.CENTER,
          children: [new d.Paragraph({ alignment: d.AlignmentType.RIGHT, spacing: zeile(44), children: [lauf(preis, { font: 'Geist SemiBold', size: 32, color: C.ink })] })],
        }),
      ],
    });
  }),
});
const wochenkarte = new d.Document({
  creator: 'Il Pomodoro',
  title: 'Instagram-Vorlage Wochenkarte',
  styles: { default: { document: { run: { font: 'Geist', size: 24, color: C.ink } } } },
  sections: [{
    properties: { page: { ...SEITE, margin: { top: 3800, bottom: 200, left: 640, right: 1040, header: 0, footer: 0 } } },
    children: [
      new d.Paragraph({ spacing: zeile(60), children: [hintergrund('bg-wochenkarte.png'), lauf('6. bis 10. Oktober 2026', { font: 'Geist SemiBold', size: 32, color: C.accent })] }),
      leer(80),
      tabelle,
    ],
  }],
});

/* Neuigkeiten (rot und hell) ---------------------------------------------- */
function neuigkeit(bild, farben, titel, text, info) {
  return {
    properties: { page: { ...SEITE, margin: { top: 4000, bottom: 200, left: 640, right: 1400, header: 0, footer: 0 } } },
    children: [
      new d.Paragraph({ spacing: zeile(100), children: [hintergrund(bild), lauf(titel[0], { font: 'Bricolage Grotesque', size: 104, bold: true, color: farben.titel })] }),
      ...titel.slice(1).map((t) => new d.Paragraph({ spacing: zeile(100), children: [lauf(t, { font: 'Bricolage Grotesque', size: 104, bold: true, color: farben.titel })] })),
      leer(50),
      new d.Paragraph({ spacing: zeile(52), children: [lauf(text, { font: 'Geist', size: 34, color: farben.text })] }),
      leer(50),
      new d.Paragraph({
        spacing: zeile(48),
        indent: { left: 300 },
        border: { left: { style: d.BorderStyle.SINGLE, size: 36, color: farben.info, space: 14 } },
        children: [lauf(info, { font: 'Geist SemiBold', size: 32, color: farben.info })],
      }),
    ],
  };
}
const neuigkeiten = new d.Document({
  creator: 'Il Pomodoro',
  title: 'Instagram-Vorlage Neuigkeiten',
  styles: { default: { document: { run: { font: 'Geist', size: 24, color: C.ink } } } },
  sections: [
    neuigkeit('bg-news-rot.png', { titel: C.light, text: C.onRed, info: C.light },
      ['Wir machen', 'Weihnachts-', 'ferien'],
      'Vom 24. Dezember bis 6. Januar bleibt unsere Küche kalt. Wir danken Ihnen für ein wunderbares Jahr und wünschen schöne Feiertage!',
      'Ab 7. Januar wieder für Sie da'),
    neuigkeit('bg-news-hell.png', { titel: C.ink, text: C.muted, info: C.accent },
      ['Weihnachtsfeier', 'im Il Pomodoro'],
      'Feiern Sie mit Ihrem Team oder Ihrer Familie bei uns: Antipasti, Pasta, Pizza aus dem Holzofen und Dolci, ganz nach Ihren Wünschen.',
      'Jetzt anfragen: 0711 51 87 66 50'),
  ],
});

(async () => {
  fs.writeFileSync(path.join(OUT, 'Il-Pomodoro-Wochenkarte-Instagram.docx'), await d.Packer.toBuffer(wochenkarte));
  fs.writeFileSync(path.join(OUT, 'Il-Pomodoro-Neuigkeiten-Instagram.docx'), await d.Packer.toBuffer(neuigkeiten));
  console.log('✓ Vorlagen geschrieben');
})();
