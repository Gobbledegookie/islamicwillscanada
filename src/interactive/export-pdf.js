import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { makeWillBlocks } from './model.js';
import { cellValue, columnFractions, filledHex, imageDimensions, inkHex, mutedHex, ruleHex, textParts } from './document-style.js';

const colour = hex => rgb(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
const ink = colour(inkHex), muted = colour(mutedHex), filled = colour(filledHex), rule = colour(ruleHex);

function wrap(text, font, size, width) {
  const lines = [];
  for (const source of String(text ?? '').split(/\r?\n/)) {
    let line = '';
    for (const word of source.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
      if (line) { lines.push(line); line = ''; }
      if (font.widthOfTextAtSize(word, size) <= width) { line = word; continue; }
      let fragment = '';
      for (const character of word) {
        if (fragment && font.widthOfTextAtSize(fragment + character, size) > width) { lines.push(fragment); fragment = ''; }
        fragment += character;
      }
      line = fragment;
    }
    lines.push(line);
  }
  return lines;
}

export async function makePdf(answers, regularBytes, boldBytes, assets = {}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const pictures = {};
  for (const [name, data] of Object.entries(assets)) pictures[name] = await pdf.embedPng(data);
  const pageWidth = 612, pageHeight = 792, left = 53, right = 53, top = 69, bottom = 83;
  const contentWidth = pageWidth - left - right;
  const pages = [];
  let page, y;
  function nextPage() { page = pdf.addPage([pageWidth, pageHeight]); pages.push(page); y = pageHeight - top; }
  function ensure(height) { if (y - height < bottom) nextPage(); }
  function richText(block, { size = 10.2, lineHeight = 15.2, gap = 9, indent = 0, center = false, mainColor = ink, baseFont = regular } = {}) {
    const available = contentWidth - indent;
    if (center) {
      const lines = wrap(block.text, baseFont, size, available);
      for (const line of lines) {
        ensure(lineHeight);
        page.drawText(line, { x: left + (contentWidth - baseFont.widthOfTextAtSize(line, size)) / 2, y, size, font: baseFont, color: mainColor });
        y -= lineHeight;
      }
      y -= gap; return;
    }
    if (!block.highlight?.length) {
      for (const line of wrap(block.text, baseFont, size, available)) {
        ensure(lineHeight);
        if (line) page.drawText(line, { x: left + indent, y, size, font: baseFont, color: mainColor });
        y -= lineHeight;
      }
      y -= gap; return;
    }
    const tokens = textParts(block.text, block.highlight).flatMap(part => part.filled ? [{ text: part.text, filled: true }] : (part.text.match(/\S+|\s+/g) || []).map(text => ({ text, filled: false })));
    let x = left + indent, lineHasText = false;
    ensure(lineHeight);
    for (const token of tokens) {
      if (/^\s+$/.test(token.text)) { if (lineHasText) x += regular.widthOfTextAtSize(' ', size); continue; }
      const font = token.filled ? bold : baseFont;
      const width = font.widthOfTextAtSize(token.text, size);
      if (lineHasText && x + width > left + indent + available) { y -= lineHeight; ensure(lineHeight); x = left + indent; lineHasText = false; }
      if (width > available) {
        for (const fragment of wrap(token.text, font, size, available)) {
          if (lineHasText) { y -= lineHeight; ensure(lineHeight); x = left + indent; }
          page.drawText(fragment, { x, y, size, font, color: token.filled ? filled : mainColor });
          x += font.widthOfTextAtSize(fragment, size); lineHasText = true;
        }
      } else {
        page.drawText(token.text, { x, y, size, font, color: token.filled ? filled : mainColor });
        if (token.filled) page.drawLine({ start: { x, y: y - 2 }, end: { x: x + width, y: y - 2 }, thickness: .55, color: filled });
        x += width; lineHasText = true;
      }
    }
    y -= lineHeight + gap;
  }
  function heading(block) {
    if (block.breakBefore && y < pageHeight - top - 10) nextPage();
    const section = block.kind === 'section';
    const size = section ? 17 : block.kind === 'article' ? 12.5 : block.kind === 'schedule' ? 11.5 : 14;
    ensure(section ? 70 : 50);
    if (section) { page.drawLine({ start: { x: left, y: y + 12 }, end: { x: left + 65, y: y + 12 }, thickness: 2, color: filled }); y -= 10; }
    richText(block, { size, lineHeight: size * 1.42, gap: section ? 17 : 11, baseFont: bold });
  }
  function image(block) {
    const picture = pictures[block.asset];
    if (!picture) throw new Error(`Missing Windsor image: ${block.asset}`);
    const [naturalWidth, naturalHeight] = imageDimensions[block.asset];
    const height = block.width * naturalHeight / naturalWidth;
    ensure(height + 15);
    page.drawImage(picture, { x: left + (contentWidth - block.width) / 2, y: y - height, width: block.width, height });
    y -= height + 14;
  }
  function table(block) {
    const widths = columnFractions(block).map(f => f * contentWidth);
    const size = block.source ? 8.3 : 9.0, headerSize = 8.8, lineHeight = size * 1.43, padX = 8, padY = 7;
    const empty = !block.rows.length;
    const rows = empty ? [block.headers.map((_, i) => i ? '' : 'Not supplied in this draft')] : block.rows;
    function rowLines(cells, header) { return block.headers.map((_, i) => wrap(empty && !header ? cells[i] : cellValue(cells[i], block.source), header ? bold : regular, header ? headerSize : size, widths[i] - 2 * padX)); }
    function rowHeight(lines, header) { return Math.max(30, Math.max(...lines.map(cell => cell.length)) * (header ? headerSize * 1.43 : lineHeight) + 2 * padY); }
    function drawRow(cells, header, index) {
      const lines = rowLines(cells, header), height = rowHeight(lines, header);
      let x = left;
      for (let i = 0; i < widths.length; i++) {
        page.drawRectangle({ x, y: y - height, width: widths[i], height, color: header ? colour('E8EFEB') : index % 2 ? colour('F7FAF7') : rgb(1, 1, 1), borderColor: rule, borderWidth: .55 });
        const font = header ? bold : regular, textColor = header || block.source || empty || (block.headers[0] === 'Obligation' && i === 0) ? ink : filled;
        let textY = y - padY - (header ? headerSize : size);
        for (const line of lines[i]) { if (line) page.drawText(line, { x: x + padX, y: textY, size: header ? headerSize : size, font, color: textColor }); textY -= header ? headerSize * 1.43 : lineHeight; }
        x += widths[i];
      }
      y -= height;
    }
    const headerHeight = rowHeight(rowLines(block.headers, true), true);
    ensure(headerHeight + 36);
    drawRow(block.headers, true, 0);
    rows.forEach((cells, index) => {
      const height = rowHeight(rowLines(cells, false), false);
      if (y - height < bottom) { nextPage(); drawRow(block.headers, true, 0); }
      drawRow(cells, false, index);
    });
    y -= 18;
  }
  function signature(block) {
    ensure(112);
    richText({ text: `${block.role}: ${cellValue(block.name)}`, highlight: [block.name] }, { size: 11, lineHeight: 16, gap: 17 });
    page.drawText('Signature', { x: left, y, size: 9.5, font: regular, color: muted });
    page.drawLine({ start: { x: left + 65, y: y - 2 }, end: { x: left + 310, y: y - 2 }, thickness: .65, color: ink });
    page.drawText('Date', { x: left + 330, y, size: 9.5, font: regular, color: muted });
    page.drawLine({ start: { x: left + 365, y: y - 2 }, end: { x: left + contentWidth, y: y - 2 }, thickness: .65, color: ink });
    y -= 22;
    if (block.address) richText({ text: `Address: ${block.address}`, highlight: [block.address] }, { size: 9.8, lineHeight: 14, gap: 8 });
    y -= 27;
  }
  nextPage();
  for (const block of makeWillBlocks(answers)) {
    if (block.kind === 'title') { y -= 38; richText(block, { size: 26, lineHeight: 34, gap: 12, baseFont: bold }); }
    else if (block.kind === 'subtitle') richText(block, { size: 13, lineHeight: 18, gap: 22, mainColor: muted });
    else if (block.kind === 'notice') richText(block, { size: 10.5, lineHeight: 16, gap: 36, baseFont: bold });
    else if (block.kind === 'contents') {
      richText({ text: 'Contents' }, { size: 15, lineHeight: 20, gap: 16, baseFont: bold });
      for (const entry of block.entries) richText({ text: entry }, { size: 10.5, lineHeight: 16, gap: 10 });
    } else if (['section', 'heading', 'article', 'schedule'].includes(block.kind)) heading(block);
    else if (block.kind === 'image') image(block);
    else if (block.kind === 'quote') richText(block, { size: 10.8, lineHeight: 16, gap: 20, indent: 20, center: true, mainColor: filled });
    else if (block.kind === 'table') table(block);
    else if (block.kind === 'signature') signature(block);
    else richText(block);
  }
  pages.forEach((target, index) => {
    target.drawText('ISLAMIC WILL CANADA  ·  DRAFT', { x: left, y: pageHeight - 37, size: 8.5, font: bold, color: muted });
    const number = `Page ${index + 1} of ${pages.length}`;
    target.drawText(number, { x: pageWidth - right - regular.widthOfTextAtSize(number, 8.5), y: pageHeight - 37, size: 8.5, font: regular, color: muted });
    target.drawLine({ start: { x: left, y: pageHeight - 45 }, end: { x: pageWidth - right, y: pageHeight - 45 }, thickness: .5, color: rule });
    target.drawLine({ start: { x: left, y: 57 }, end: { x: pageWidth - right, y: 57 }, thickness: .5, color: rule });
    target.drawText('Testator __________     Witness 1 __________     Witness 2 __________', { x: left, y: 39, size: 8.3, font: regular, color: ink });
  });
  return new Blob([await pdf.save()], { type: 'application/pdf' });
}
