export const inkHex = '263730';
export const mutedHex = '52645A';
export const filledHex = '165A7B';
export const ruleHex = 'D2DBD4';
export const blank = 'Not supplied in this draft';
export const imageDimensions = {
  'windsor-bismillah.png': [128, 50],
  'windsor-verse-1.png': [464, 49],
  'windsor-verse-2.png': [332, 46]
};
export const cellValue = (text, source = false) => source ? String(text ?? '') : String(text || blank);
export function columnFractions(block) {
  if (block.headers.length === 2) return block.source ? [0.42, 0.58] : [0.57, 0.43];
  if (block.headers.length === 3) return [0.43, 0.27, 0.30];
  if (block.headers.length === 4) return [0.31, 0.17, 0.19, 0.33];
  if (block.headers.length === 5) return [0.24, 0.15, 0.18, 0.18, 0.25];
  return block.headers.map(() => 1 / block.headers.length);
}
export function textParts(text, highlighted = []) {
  const terms = [...new Set(highlighted.filter(Boolean).map(String))].sort((a, b) => b.length - a.length);
  if (!terms.length) return [{ text: String(text), filled: false }];
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const expression = new RegExp(`(${escaped.join('|')})`, 'g');
  return String(text).split(expression).filter(Boolean).map(piece => ({ text: piece, filled: terms.includes(piece) }));
}
