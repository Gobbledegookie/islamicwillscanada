// Regenerate checked-in artwork from Quran.com's QPC Hafs text and matching font.
// Usage: node scripts/generate-quran-artwork.mjs <sharp-package-path> [font-file]
// sharp is only an authoring tool; the website never loads it or the source font.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fontkit from '@pdf-lib/fontkit';

const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const source = JSON.parse(await fs.readFile('scripts/quran-text.json', 'utf8'));
const fontBytes = process.argv[3]
  ? await fs.readFile(process.argv[3])
  : Buffer.from(await (await fetch(source.font.url)).arrayBuffer());
if (createHash('sha256').update(fontBytes).digest('hex') !== source.font.sha256) {
  throw new Error('Quran font differs from the reviewed source. Verify it before regenerating artwork.');
}
const font = fontkit.create(fontBytes);
const definitions = [
  ['quran-bismillah', source.bismillah.words.join(' '), 180, 'Bismillah: In the name of Allah, the Most Beneficent, the Most Merciful', source.bismillah.url],
  ['quran-2-180-line-1', source.verse.words.slice(0, 11).join(' '), 420, 'Surah Al-Baqarah 2:180, first line in Arabic', source.verse.url],
  ['quran-2-180-line-2', source.verse.words.slice(11).join(' '), null, 'Surah Al-Baqarah 2:180, second line in Arabic', source.verse.url],
];
const metadata = {};
let verseScale;
for (const [name, text, displayWidth, alt, url] of definitions) {
  const run = font.layout(text);
  if (run.glyphs.some(glyph => glyph.id === 0)) throw new Error(`Missing Quran glyph in ${name}`);
  const outlines = [];
  let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  run.glyphs.forEach((glyph, i) => {
    const position = run.positions[i], gx = x + position.xOffset, gy = y + position.yOffset;
    if (glyph.path.commands.length) {
      minX = Math.min(minX, gx + glyph.bbox.minX); minY = Math.min(minY, gy + glyph.bbox.minY);
      maxX = Math.max(maxX, gx + glyph.bbox.maxX); maxY = Math.max(maxY, gy + glyph.bbox.maxY);
      outlines.push({ commands: glyph.path.commands, x: gx, y: gy });
    }
    x += position.xAdvance; y += position.yAdvance;
  });
  // Leave clear space around all diacritics and Quranic pause marks.
  const pad = Math.ceil(font.unitsPerEm * .06);
  const width = Math.ceil(maxX - minX + pad * 2), height = Math.ceil(maxY - minY + pad * 2);
  const names = { moveTo: 'M', lineTo: 'L', quadraticCurveTo: 'Q', bezierCurveTo: 'C', closePath: 'Z' };
  const svgPath = outlines.map(outline => outline.commands.map(({ command, args }) => {
    if (!names[command]) throw new Error(`Unsupported outline command: ${command}`);
    const points = args.map((n, i) => Number((i % 2 ? maxY + pad - outline.y - n : outline.x + n - minX + pad).toFixed(2)));
    return names[command] + points.join(' ');
  }).join('')).join('');
  const actualWidth = displayWidth ?? Number((width * verseScale).toFixed(2));
  if (name.endsWith('line-1')) verseScale = actualWidth / width;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${alt}</title><path fill="#000000" d="${svgPath}"/></svg>\n`;
  await fs.writeFile(`public/assets/${name}.svg`, svg);
  // At least 600 DPI at the PDF's printed width; Word uses the SVG when supported.
  const pngWidth = Math.ceil(actualWidth / 72 * 600);
  const png = await sharp(Buffer.from(svg)).resize({ width: pngWidth }).png().toBuffer();
  await fs.writeFile(`public/assets/${name}.png`, png);
  const pngInfo = await sharp(png).metadata();
  metadata[`${name}.svg`] = { width, height, displayWidth: actualWidth, fallback: `${name}.png`, fallbackWidth: pngInfo.width, fallbackHeight: pngInfo.height, alt, text, source: url };
}
await fs.writeFile('src/interactive/quran-artwork.json', JSON.stringify(metadata, null, 2) + '\n');
await fs.writeFile('licenses/UthmanicHafs-LICENSE.txt', font.name.records.license.en + '\n');
console.log(Object.entries(metadata).map(([name, info]) => `${name}: vector + ${info.fallbackWidth}x${info.fallbackHeight} PNG`).join('\n'));
