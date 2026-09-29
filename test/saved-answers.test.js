import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAnswers } from '../src/interactive/model.js';
import { makeSampleAnswers } from '../src/interactive/sample.js';
import { createSavedAnswers, parseSavedAnswers } from '../src/interactive/saved-answers.js';

test('restores partial answers, repeated rows, and progress', () => {
  const answers = initialAnswers();
  answers.testatorName = 'Amina Example';
  answers.family = [{ name: 'Samir Example', relationship: 'Son', birthDate: '2015-01-02' }];
  answers.obligations.zakah = 'To review';
  const restored = parseSavedAnswers(createSavedAnswers(answers, 2, 4));
  assert.deepEqual(restored, { answers, current: 2, furthest: 4 });
});

test('restores every section of a completed sample draft', () => {
  const answers = makeSampleAnswers();
  assert.deepEqual(parseSavedAnswers(createSavedAnswers(answers, 8, 8)).answers, answers);
});

test('rejects invalid and unsupported files before replacing answers', () => {
  assert.throws(() => parseSavedAnswers('{'), /not valid JSON/);
  const file = JSON.parse(createSavedAnswers(initialAnswers(), 0, 0));
  file.version = 2;
  assert.throws(() => parseSavedAnswers(JSON.stringify(file)), /not a supported/);
  file.version = 1;
  file.answers.family = [{ name: 'Incomplete' }];
  assert.throws(() => parseSavedAnswers(JSON.stringify(file)), /family list is invalid/);
});

test('ignores unrecognized properties in a saved file', () => {
  const file = JSON.parse(createSavedAnswers(initialAnswers(), 0, 0));
  file.answers.unrecognized = 'not restored';
  file.answers.obligations.unrecognized = 'not restored';
  const restored = parseSavedAnswers(JSON.stringify(file));
  assert.equal('unrecognized' in restored.answers, false);
  assert.equal('unrecognized' in restored.answers.obligations, false);
});
