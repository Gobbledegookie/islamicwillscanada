import { AlignmentType, Document, Footer, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { makeWillBlocks } from './model.js';

const blank = 'Not supplied in this draft';
const printable = text => String(text || blank).replace(/\s+/g, ' ').trim();

function docxTable(block) {
  const rows = block.rows.length ? block.rows : [block.headers.map(() => blank)];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [block.headers, ...rows].map((cells, index) => new TableRow({
      children: cells.map(cell => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: printable(cell), bold: index === 0, color: '25362F', font: 'Aptos', size: 20 })], spacing: { after: 60 } })],
        margins: { top: 80, bottom: 80, left: 100, right: 100 }
      }))
    }))
  });
}

export async function makeDocx(answers) {
  const children = makeWillBlocks(answers).map(block => {
    if (block.kind === 'table') return docxTable(block);
    if (block.kind === 'title') return new Paragraph({ children: [new TextRun({ text: block.text, font: 'Aptos Display', size: 35, bold: true, color: '25362F' })], heading: HeadingLevel.TITLE, spacing: { after: 280 } });
    if (block.kind === 'heading') return new Paragraph({ children: [new TextRun({ text: block.text, font: 'Aptos Display', size: 28, bold: true, color: '25362F' })], heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 140 }, keepNext: true });
    return new Paragraph({ children: [new TextRun({ text: block.text, font: 'Aptos', size: 21, color: '25362F' })], spacing: { after: 160 }, lineSpacingMultiple: 1.15 });
  });
  const footer = new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Testator __________    Witness 1 __________    Witness 2 __________', size: 17 })]
  })] });
  const doc = new Document({
    creator: 'Islamic Will Canada',
    title: 'Windsor Islamic Will Draft',
    description: 'Guided draft based on the Windsor Islamic Association template',
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 980, right: 1000, bottom: 1150, left: 1000 } } },
      footers: { default: footer },
      children
    }]
  });
  return Packer.toBlob(doc);
}

function wrap(text, font, size, maxWidth) {
  const lines = [];
  for (const sourceLine of String(text || '').split(/\r?\n/)) {
    let line = '';
    for (const word of sourceLine.split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      if (font.widthOfTextAtSize(word, size) <= maxWidth) { line = word; continue; }
      let piece = '';
      for (const character of word) {
        if (font.widthOfTextAtSize(piece + character, size) > maxWidth && piece) { lines.push(piece); piece = ''; }
        piece += character;
      }
      line = piece;
    }
    lines.push(line);
  }
  return lines;
}

export async function makePdf(answers, fontBytes) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const pageWidth = 612, pageHeight = 792, left = 52, right = 52, top = 56, bottom = 76;
  const ink = rgb(0.13, 0.18, 0.16), muted = rgb(0.31, 0.37, 0.34), line = rgb(0.74, 0.78, 0.73);
  const pages = [];
  let page, y;
  function nextPage() { page = pdf.addPage([pageWidth, pageHeight]); pages.push(page); y = pageHeight - top; }
  function ensure(need) { if (y - need < bottom) nextPage(); }
  function text(value, size = 10.5, gap = 8, color = ink, indent = 0) {
    const lines = wrap(value, font, size, pageWidth - left - right - indent);
    const lineHeight = size * 1.46;
    for (const part of lines) {
      ensure(lineHeight);
      if (part) page.drawText(part, { x: left + indent, y, size, font, color });
      y -= lineHeight;
    }
    y -= gap;
  }
  nextPage();
  for (const block of makeWillBlocks(answers)) {
    if (block.kind === 'title') {
      ensure(70); text(block.text, 22, 14);
    } else if (block.kind === 'heading') {
      ensure(54); y -= 10; text(block.text, 14, 8);
    } else if (block.kind === 'table') {
      ensure(30);
      const rows = block.rows.length ? block.rows : [block.headers.map(() => blank)];
      for (const row of rows) {
        const description = block.headers.map((header, i) => `${header}: ${printable(row[i])}`).join('   |   ');
        ensure(28);
        text(description, 9.4, 10, muted, 8);
      }
      y -= 8;
    } else text(block.text);
  }
  for (let i = 0; i < pages.length; i++) {
    const target = pages[i];
    target.drawLine({ start: { x: left, y: 58 }, end: { x: pageWidth - right, y: 58 }, thickness: .5, color: line });
    target.drawText('Testator ________    Witness 1 ________    Witness 2 ________', { x: left, y: 40, size: 8.2, font, color: muted });
    target.drawText(`${i + 1} / ${pages.length}`, { x: pageWidth - right - 38, y: 40, size: 8.2, font, color: muted });
  }
  return new Blob([await pdf.save()], { type: 'application/pdf' });
}
