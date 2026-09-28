import { AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, PageNumber, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { makeWillBlocks } from './model.js';
import { cellValue, columnFractions, filledHex, imageDimensions, inkHex, mutedHex, ruleHex, textParts } from './document-style.js';

function runs(block, { size = 21, bold = false, italic = false, color = inkHex } = {}) {
  return textParts(block.text, block.highlight).map(part => new TextRun({
    text: part.text, font: 'Aptos', size, bold: bold || part.filled, italic,
    color: part.filled ? filledHex : color,
    underline: part.filled ? { color: filledHex } : undefined
  }));
}

function table(block) {
  const widths = columnFractions(block).map(fraction => Math.round(10140 * fraction));
  const border = { style: BorderStyle.SINGLE, color: ruleHex, size: 5 };
  const empty = !block.rows.length;
  const rows = empty ? [block.headers.map((_, i) => i ? '' : 'Not supplied in this draft')] : block.rows;
  return new Table({
    width: { size: 10140, type: WidthType.DXA }, columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [block.headers, ...rows].map((cells, rowIndex) => new TableRow({
      tableHeader: rowIndex === 0, cantSplit: true,
      children: block.headers.map((_, columnIndex) => new TableCell({
        width: { size: widths[columnIndex], type: WidthType.DXA },
        shading: { fill: rowIndex === 0 ? 'E8EFEB' : rowIndex % 2 ? 'FFFFFF' : 'F7FAF7' },
        margins: { top: 95, bottom: 95, left: 115, right: 115 },
        children: [new Paragraph({ spacing: { after: 0, line: 250 }, children: [new TextRun({
          text: empty && rowIndex > 0 ? cells[columnIndex] : cellValue(cells[columnIndex], block.source), font: 'Aptos',
          size: block.source ? 18 : 19, bold: rowIndex === 0 || (!block.source && rowIndex > 0 && !(block.headers[0] === 'Obligation' && columnIndex === 0)),
          color: rowIndex === 0 || block.source || (block.headers[0] === 'Obligation' && columnIndex === 0) || empty ? inkHex : filledHex
        })] })]
      }))
    }))
  });
}

function signature(block) {
  const lines = [
    new Paragraph({ spacing: { before: 360, after: 180 }, keepNext: true, children: [
      new TextRun({ text: `${block.role}:  `, font: 'Aptos', size: 21, bold: true, color: inkHex }),
      new TextRun({ text: cellValue(block.name), font: 'Aptos', size: 21, bold: true, color: filledHex, underline: { color: filledHex } })
    ] }),
    new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: 'Signature: _______________________________________      Date: __________________', font: 'Aptos', size: 20, color: inkHex })] })
  ];
  if (block.address) lines.push(new Paragraph({ spacing: { after: 260 }, children: [
    new TextRun({ text: 'Address:  ', font: 'Aptos', size: 20, color: inkHex }),
    new TextRun({ text: block.address, font: 'Aptos', size: 20, bold: true, color: filledHex, underline: { color: filledHex } })
  ] }));
  return lines;
}

function renderBlock(block, assets) {
  if (block.kind === 'table') return [table(block)];
  if (block.kind === 'signature') return signature(block);
  if (block.kind === 'image') {
    const data = assets[block.asset];
    if (!data) throw new Error(`Missing Windsor image: ${block.asset}`);
    const [naturalWidth, naturalHeight] = imageDimensions[block.asset];
    return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 110 }, children: [new ImageRun({
      type: 'png', data, transformation: { width: block.width, height: Math.round(block.width * naturalHeight / naturalWidth) },
      altText: { title: block.alt, description: block.alt, name: block.alt }
    })] })];
  }
  if (block.kind === 'title') return [new Paragraph({ heading: HeadingLevel.TITLE, spacing: { before: 950, after: 250 }, children: runs(block, { size: 38, bold: true }) })];
  if (block.kind === 'subtitle') return [new Paragraph({ spacing: { after: 350 }, children: runs(block, { size: 24, color: mutedHex }) })];
  if (block.kind === 'notice') return [new Paragraph({ spacing: { after: 700, line: 320 }, children: runs(block, { size: 21, bold: true }) })];
  if (block.kind === 'contents') return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 180 }, children: runs({ text: 'Contents' }, { size: 27, bold: true }) }),
    ...block.entries.map(entry => new Paragraph({ spacing: { after: 135 }, children: runs({ text: entry }, { size: 21 }) }))
  ];
  if (['section', 'heading', 'article', 'schedule'].includes(block.kind)) {
    const size = block.kind === 'section' ? 30 : block.kind === 'article' ? 24 : block.kind === 'schedule' ? 22 : 25;
    return [new Paragraph({
      heading: block.kind === 'schedule' ? HeadingLevel.HEADING_3 : block.kind === 'article' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1,
      pageBreakBefore: Boolean(block.breakBefore), keepNext: true,
      spacing: { before: block.breakBefore ? 0 : 300, after: block.kind === 'article' ? 150 : 230 },
      children: runs(block, { size, bold: true })
    })];
  }
  if (block.kind === 'quote') return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 150, after: 260, line: 310 }, children: runs(block, { size: 21, italic: true, color: mutedHex }) })];
  return [new Paragraph({ spacing: { after: 175, line: 290 }, children: runs(block) })];
}

export async function makeDocx(answers, assets = {}) {
  const children = makeWillBlocks(answers).flatMap(block => renderBlock(block, assets));
  const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 100 }, children: [
    new TextRun({ text: 'ISLAMIC WILL CANADA  ·  DRAFT     ', font: 'Aptos', size: 16, bold: true, color: mutedHex }),
    new TextRun({ text: 'Page ', font: 'Aptos', size: 16, color: mutedHex }),
    new TextRun({ children: [PageNumber.CURRENT], font: 'Aptos', size: 16, color: mutedHex }),
    new TextRun({ text: ' of ', font: 'Aptos', size: 16, color: mutedHex }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Aptos', size: 16, color: mutedHex })
  ] })] });
  const footerRule = { style: BorderStyle.SINGLE, color: inkHex, size: 6 };
  const noRule = { style: BorderStyle.NONE };
  const footer = new Footer({ children: [new Table({
    width: { size: 10140, type: WidthType.DXA },
    columnWidths: [3380, 3380, 3380],
    borders: { top: noRule, bottom: footerRule, left: noRule, right: noRule, insideHorizontal: noRule, insideVertical: noRule },
    rows: [new TableRow({ children: ['Testator:', 'Witness 1:', 'Witness 2:'].map(label => new TableCell({
      width: { size: 3380, type: WidthType.DXA },
      margins: { top: 0, bottom: 125, left: 0, right: 0 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [
        new TextRun({ text: label, font: 'Aptos', size: 19, italic: true, color: inkHex })
      ] })]
    })) })]
  })] });
  const doc = new Document({
    creator: 'Islamic Will Canada', title: 'Last Will and Testament - Windsor Draft',
    description: 'Guided draft based on the Windsor Islamic Association template',
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1050, right: 1050, bottom: 1200, left: 1050, header: 420, footer: 520 } } }, headers: { default: header }, footers: { default: footer }, children }]
  });
  return Packer.toBlob(doc);
}
