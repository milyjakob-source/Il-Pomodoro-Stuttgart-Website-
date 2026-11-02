// Erzeugt die Instagram-Vorlagen als Word-Dateien (.docx), bearbeitbar in Pages und Word, auch auf dem iPhone.
// Aufruf aus dem Repo-Ordner: node vorlagen-instagram/quelle/vorlagen.cjs
//
// Seite 1080 × 1350 Design-Pixel (Instagram 4:5) = 7,5 × 9,375 Zoll, ohne Ränder.
// 1 Design-Pixel = 10 Twips; Schriftgröße in Halbpunkten = Pixel.
// Aufbau: eine Tabelle über die ganze Seite mit drei Zeilen fester Höhe:
//   Kopfbild (Logo, Überschrift) · bearbeitbarer Inhalt auf Farbfläche · Fußbild.
// Bewusst keine Bilder hinter dem Text und keine Textrahmen: das zeigen iPhone-Vorschau,
// Pages und Word sonst unterschiedlich (blass, verschoben).
const fs = require('fs');
const path = require('path');
const d = require('docx');
const HIER = __dirname;
const OUT = path.join(HIER, '..');

const C = { bg: 'F2F3EF', surface: 'FAFBF8', ink: '151A17', muted: '4A524D', accent: 'A82F3E', light: 'FAFBF8', onRed: 'F6E3E5', line: 'DCDDD8' };
// Avenir Next ist auf jedem iPhone, iPad und Mac vorhanden: nichts zu installieren.
const F = 'Avenir Next';
const BREITE = 10800;
const HOEHE = 13500;
const KOPF = { karte: 400, news: 360 };
const FUSS = 170;

const ohne = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const keineRaender = { top: ohne, bottom: ohne, left: ohne, right: ohne, insideHorizontal: ohne, insideVertical: ohne };
const zellRand = { top: ohne, bottom: ohne, left: ohne, right: ohne };
const zeile = (px, vor = 0, nach = 0) => ({ line: px * 10, lineRule: d.LineRuleType.EXACT, before: vor * 10, after: nach * 10 });
const lauf = (text, o) => new d.TextRun({ text, font: F, size: o.size, bold: !!o.bold, color: o.color });

function bild(datei, hoehePx) {
  return new d.Paragraph({
    spacing: { line: 240, lineRule: d.LineRuleType.AUTO, before: 0, after: 0 },
    children: [
      new d.ImageRun({
        type: 'png',
        data: fs.readFileSync(path.join(HIER, datei)),
        // docx rechnet mit 96 dpi: 7,5 Zoll = 720 px Breite.
        transformation: { width: 720, height: (hoehePx * 720) / 1080 },
        altText: { title: 'Il Pomodoro', description: 'Gestaltung im Stil der Website', name: datei },
      }),
    ],
  });
}

/** Seite als Tabelle: Kopfbild, Inhalt (Farbfläche), Fußbild. */
function seite({ kopf, kopfHoehe, fuss, farbe, inhalt }) {
  const inhaltHoehe = HOEHE - kopfHoehe * 10 - FUSS * 10 - 40; // kleiner Puffer, damit keine leere zweite Seite entsteht
  const z = (hoehe, kinder, rand = 0, oben = 0) =>
    new d.TableRow({
      height: { value: hoehe, rule: d.HeightRule.EXACT },
      cantSplit: true,
      children: [
        new d.TableCell({
          width: { size: BREITE, type: d.WidthType.DXA },
          borders: zellRand,
          shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: farbe },
          margins: { top: oben, bottom: 0, left: rand, right: rand },
          children: kinder,
        }),
      ],
    });
  return new d.Table({
    width: { size: BREITE, type: d.WidthType.DXA },
    columnWidths: [BREITE],
    layout: d.TableLayoutType.FIXED,
    borders: keineRaender,
    rows: [z(kopfHoehe * 10, [bild(kopf, kopfHoehe)]), z(inhaltHoehe, inhalt, 640, 60), z(FUSS * 10, [bild(fuss, FUSS)])],
  });
}

function dokument(titel, tabelle, farbe) {
  return new d.Document({
    creator: 'Il Pomodoro',
    title: 'Instagram-Vorlage ' + titel,
    background: { color: farbe },
    styles: { default: { document: { run: { font: F, size: 24, color: C.ink } } } },
    sections: [
      {
        properties: { page: { size: { width: BREITE, height: HOEHE }, margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0, gutter: 0 } } },
        // Nach einer Tabelle verlangt Word einen Absatz; winzig, damit er auf der Seite bleibt.
        children: [tabelle, new d.Paragraph({ spacing: { line: 20, lineRule: d.LineRuleType.EXACT, before: 0, after: 0 }, children: [new d.TextRun({ text: '', size: 2 })] })],
      },
    ],
  });
}

/* Tages- und Wochenkarte ---------------------------------------------------- */
function gerichte(anzahl) {
  const innen = BREITE - 2 * 640;
  const preisBreite = 2600;
  const zeilenHoehe = anzahl > 5 ? 1000 : 1140;
  return new d.Table({
    width: { size: innen, type: d.WidthType.DXA },
    columnWidths: [innen - preisBreite, preisBreite],
    layout: d.TableLayoutType.FIXED,
    borders: keineRaender,
    rows: Array.from({ length: anzahl }, (_, i) => {
      const unten = i < anzahl - 1 ? { style: d.BorderStyle.SINGLE, size: 6, color: C.line } : ohne;
      const rand = { top: ohne, left: ohne, right: ohne, bottom: unten };
      const m = { top: anzahl > 5 ? 150 : 210, bottom: 0, left: 380, right: 380 };
      const zelle = (breite, kinder, mitte) =>
        new d.TableCell({
          width: { size: breite, type: d.WidthType.DXA },
          borders: rand,
          margins: m,
          verticalAlign: mitte ? d.VerticalAlign.CENTER : d.VerticalAlign.TOP,
          shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: C.surface },
          children: kinder,
        });
      return new d.TableRow({
        height: { value: zeilenHoehe, rule: d.HeightRule.EXACT },
        cantSplit: true,
        children: [
          zelle(innen - preisBreite, [
            new d.Paragraph({ spacing: zeile(44), children: [lauf('Gericht ' + (i + 1), { size: 34, bold: true, color: C.ink })] }),
            new d.Paragraph({ spacing: zeile(34), children: [lauf('Kurze Beschreibung', { size: 22, color: C.muted })] }),
          ]),
          zelle(preisBreite, [new d.Paragraph({ alignment: d.AlignmentType.RIGHT, spacing: zeile(44), children: [lauf('00,00\u00A0€', { size: 32, bold: true, color: C.ink })] })], true),
        ],
      });
    }),
  });
}

function karte(titel, name, datum, anzahl) {
  return dokument(
    titel,
    seite({
      kopf: `kopf-${name}.png`,
      kopfHoehe: KOPF.karte,
      fuss: `fuss-${name}.png`,
      farbe: C.bg,
      inhalt: [
        new d.Paragraph({ spacing: zeile(50, 0, 34), children: [lauf(datum, { size: 32, bold: true, color: C.accent })] }),
        gerichte(anzahl),
        new d.Paragraph({ spacing: zeile(10), children: [] }),
      ],
    }),
    C.bg,
  );
}

/* Neuigkeiten --------------------------------------------------------------- */
function neuigkeit(name, farbe, f) {
  return dokument(
    'Neuigkeiten',
    seite({
      kopf: `kopf-${name}.png`,
      kopfHoehe: KOPF.news,
      fuss: `fuss-${name}.png`,
      farbe,
      inhalt: [
        new d.Paragraph({ spacing: zeile(110, 20, 30), children: [lauf('Überschrift', { size: 104, bold: true, color: f.titel })] }),
        new d.Paragraph({ spacing: zeile(52, 0, 46), indent: { right: 1400 }, children: [lauf('Hier steht Ihr Text. Zwei bis drei Sätze passen gut, zum Beispiel wann und warum.', { size: 34, color: f.text })] }),
        new d.Paragraph({
          spacing: zeile(48),
          indent: { left: 300 },
          border: { left: { style: d.BorderStyle.SINGLE, size: 36, color: f.info, space: 14 } },
          children: [lauf('Datum oder Hinweis', { size: 32, bold: true, color: f.info })],
        }),
      ],
    }),
    farbe,
  );
}

(async () => {
  const dateien = {
    'Il-Pomodoro-Tageskarte-Instagram.docx': karte('Tageskarte', 'tageskarte', 'Wochentag, Datum', 5),
    'Il-Pomodoro-Wochenkarte-Instagram.docx': karte('Wochenkarte', 'wochenkarte', 'Datum der Woche', 6),
    'Il-Pomodoro-Neuigkeiten-rot-Instagram.docx': neuigkeit('news-rot', C.accent, { titel: C.light, text: C.onRed, info: C.light }),
    'Il-Pomodoro-Neuigkeiten-hell-Instagram.docx': neuigkeit('news-hell', C.bg, { titel: C.ink, text: C.muted, info: C.accent }),
  };
  for (const [name, doc] of Object.entries(dateien)) fs.writeFileSync(path.join(OUT, name), await d.Packer.toBuffer(doc));
  console.log('✓ Vorlagen geschrieben:', Object.keys(dateien).join(', '));
})();
