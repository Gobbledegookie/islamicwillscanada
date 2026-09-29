import { initialAnswers, repeatFields } from './model.js';

const format = 'islamicwillcanada-windsor-answers';
const version = 1;
export const maxSavedFileBytes = 2_000_000;

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validText = value => typeof value === 'string' && value.length <= 20_000;

export function createSavedAnswers(answers, current, furthest) {
  return JSON.stringify({ format, version, savedAt: new Date().toISOString(), current, furthest, answers }, null, 2);
}

export function parseSavedAnswers(text) {
  let file;
  try { file = JSON.parse(text); }
  catch { throw new Error('This file is not valid JSON. Choose an answers file downloaded from this tool.'); }
  if (!isRecord(file) || file.format !== format || file.version !== version || !isRecord(file.answers)) {
    throw new Error('This is not a supported Islamic Will Canada answers file.');
  }
  if (!Number.isInteger(file.current) || !Number.isInteger(file.furthest) || file.current < 0 || file.furthest > 8 || file.current > file.furthest) {
    throw new Error('The saved section information is invalid.');
  }

  const restored = initialAnswers();
  for (const [key, defaultValue] of Object.entries(restored)) {
    const value = file.answers[key];
    if (typeof defaultValue === 'string') {
      if (!validText(value)) throw new Error(`The saved ${key} answer is invalid.`);
      restored[key] = value;
    } else if (typeof defaultValue === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`The saved ${key} answer is invalid.`);
      restored[key] = value;
    } else if (Array.isArray(defaultValue)) {
      if (!Array.isArray(value) || value.length > 100) throw new Error(`The saved ${key} list is invalid.`);
      restored[key] = value.map(row => {
        if (!isRecord(row)) throw new Error(`The saved ${key} list is invalid.`);
        const clean = {};
        for (const field of repeatFields[key]) {
          if (!validText(row[field])) throw new Error(`The saved ${key} list is invalid.`);
          clean[field] = row[field];
        }
        return clean;
      });
    } else {
      if (!isRecord(value) || !Object.keys(defaultValue).every(field => validText(value[field]))) {
        throw new Error('The saved religious obligations are invalid.');
      }
      restored[key] = Object.fromEntries(Object.keys(defaultValue).map(field => [field, value[field]]));
    }
  }
  if (!['', 'yes', 'no'].includes(restored.hasMinorChildren)) throw new Error('The saved minor children answer is invalid.');
  return { answers: restored, current: file.current, furthest: file.furthest };
}
