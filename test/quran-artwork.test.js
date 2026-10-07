import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { PDFDocument, PDFName } from 'pdf-lib';
import artwork from '../src/interactive/quran-artwork.json' with { type: 'json' };
import source from '../scripts/quran-text.json' with { type: 'json' };
import { makeWillBlocks } from '../src/interactive/model.js';
import { makeSampleAnswers } from '../src/interactive/sample.js';
import { makePdf } from '../src/interactive/export-pdf.js';
import { makeDocx } from '../src/interactive/export-docx.js';

const asset = name => readFile(new URL(`../public/assets/${name}`, import.meta.url));

test('Arabic artwork contains the complete Bismillah and Quran 2:180 with print-quality fallbacks', async () => {
  const blocks = makeWillBlocks(makeSampleAnswers()).filter(block => block.kind === 'image');
  assert.equal(blocks.length, 3);
  const entries = blocks.map(block => artwork[block.asset]);
  assert.equal(entries[0].text, source.bismillah.words.join(' '));
  assert.equal(entries.slice(1).map(entry => entry.text).join(' '), source.verse.words.join(' '));
  assert.equal(source.verse.words.length, 16);
  for (const block of blocks) {
    const entry = artwork[block.asset];
    const png = await asset(entry.fallback);
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.ok(width / (block.width / 72) >= 600);
    assert.ok(Math.abs(height / width - entry.height / entry.width) < .001);
    assert.match((await asset(block.asset)).toString(), /<path fill="#000000" d="M/);
  }
  assert.ok(Math.abs(entries[1].displayWidth / entries[1].width - entries[2].displayWidth / entries[2].width) < .000001);
});

test('PDF exports vector Arabic and DOCX includes SVG artwork with PNG compatibility fallbacks', async () => {
  const answers = makeSampleAnswers();
  const names = Object.entries(artwork).flatMap(([name, info]) => [name, info.fallback]);
  const assets = Object.fromEntries(await Promise.all(names.map(async name => [name, await asset(name)])));
  const pdfBlob = await makePdf(answers, await asset('NotoSans.ttf'), await asset('NotoSans-Bold.ttf'), assets);
  const pdf = await PDFDocument.load(await pdfBlob.arrayBuffer());
  assert.ok(pdf.getPageCount() > 5);
  for (const page of pdf.getPages()) {
    const images = page.node.Resources().lookup(PDFName.of('XObject'));
    assert.ok(!images || images.keys().length === 0, 'Arabic must remain vector paths, not embedded raster images');
  }
  const zip = await JSZip.loadAsync(await (await makeDocx(answers, assets)).arrayBuffer());
  const xml = await zip.file('word/document.xml').async('string');
  assert.equal((xml.match(/<asvg:svgBlip /g) || []).length, 3);
  const media = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));
  assert.equal(media.filter(name => name.endsWith('.svg')).length, 3);
  assert.equal(media.filter(name => name.endsWith('.png')).length, 3);
  for (const [name, info] of Object.entries(artwork)) {
    assert.ok((await Promise.all(media.filter(file => file.endsWith('.svg')).map(file => zip.file(file).async('nodebuffer')))).some(data => data.equals(assets[name])));
    assert.ok((await Promise.all(media.filter(file => file.endsWith('.png')).map(file => zip.file(file).async('nodebuffer')))).some(data => data.equals(assets[info.fallback])));
  }
});
