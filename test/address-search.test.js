import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingAddresses } from '../src/interactive/address-search.js';

const place = (housenumber, street, city = 'Toronto') => ({ properties: {
  housenumber, street, city, state: 'Ontario', postcode: 'M4B 0E3', countrycode: 'CA'
} });
const street = (name, city) => ({ properties: { type: 'street', name, city, state: 'Ontario', countrycode: 'CA' } });

test('does not present a different street or house number as an address match', () => {
  const results = matchingAddresses([
    place('127', 'Broadway Avenue'), place('129', 'Laurendale Avenue'), place('127', 'Laurendale Avenue')
  ], '127 Laurendale Ave');
  assert.deepEqual(results.map(result => result.value), ['127 Laurendale Avenue, Toronto, Ontario M4B 0E3, Canada']);
  assert.equal(results[0].kind, 'house');
});

test('supports partial street names, abbreviations, and city filtering', () => {
  const features = [place('100', 'King Street West'), place('100', 'King Street West', 'Ottawa')];
  assert.deepEqual(matchingAddresses(features, '100 King St W, Tor').map(result => result.value),
    ['100 King Street West, Toronto, Ontario M4B 0E3, Canada']);
  assert.deepEqual(matchingAddresses(features, '100 Kin').map(result => result.value),
    ['100 King Street West, Toronto, Ontario M4B 0E3, Canada', '100 King Street West, Ottawa, Ontario M4B 0E3, Canada']);
});

test('offers known streets when Photon lacks the specific house number', () => {
  const laurendale = matchingAddresses([
    street('Laurendale Avenue', 'Georgina'), street('Laurendale Avenue', 'Keswick'),
    place('127', 'Broadway Avenue')
  ], '127 Laurendale Ave');
  assert.deepEqual(laurendale.map(result => result.value), [
    '127 Laurendale Avenue, Georgina, Ontario, Canada',
    '127 Laurendale Avenue, Keswick, Ontario, Canada'
  ]);
  assert.ok(laurendale.every(result => result.kind === 'street' && result.label.includes('number not verified')));

  const hitchingPost = matchingAddresses([
    street('Hitching Post', 'Keswick'), place('22', 'Hitching Post Ridge', 'Hamilton')
  ], '22 Hitching Post Keswick');
  assert.deepEqual(hitchingPost.map(result => result.value), ['22 Hitching Post, Keswick, Ontario, Canada']);
});

test('excludes non-Canadian results and accepts missing results', () => {
  const foreign = place('100', 'King Street');
  foreign.properties.countrycode = 'US';
  assert.deepEqual(matchingAddresses([foreign], '100 King St'), []);
  assert.deepEqual(matchingAddresses(undefined, '100 King St'), []);
});
