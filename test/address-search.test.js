import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingAddresses } from '../src/interactive/address-search.js';

const place = (housenumber, street, city = 'Toronto') => ({ properties: {
  housenumber, street, city, state: 'Ontario', postcode: 'M4B 0E3', countrycode: 'CA'
} });

test('does not present a different street or house number as an address match', () => {
  const results = matchingAddresses([
    place('127', 'Broadway Avenue'), place('129', 'Laurendale Avenue'), place('127', 'Laurendale Avenue')
  ], '127 Laurendale Ave');
  assert.deepEqual(results, ['127 Laurendale Avenue, Toronto, Ontario M4B 0E3, Canada']);
});

test('supports partial street names, abbreviations, and city filtering', () => {
  const features = [place('100', 'King Street West'), place('100', 'King Street West', 'Ottawa')];
  assert.deepEqual(matchingAddresses(features, '100 King St W, Tor'),
    ['100 King Street West, Toronto, Ontario M4B 0E3, Canada']);
  assert.deepEqual(matchingAddresses(features, '100 Kin'),
    ['100 King Street West, Toronto, Ontario M4B 0E3, Canada', '100 King Street West, Ottawa, Ontario M4B 0E3, Canada']);
});

test('excludes non-Canadian results and accepts missing results', () => {
  const foreign = place('100', 'King Street');
  foreign.properties.countrycode = 'US';
  assert.deepEqual(matchingAddresses([foreign], '100 King St'), []);
  assert.deepEqual(matchingAddresses(undefined, '100 King St'), []);
});
