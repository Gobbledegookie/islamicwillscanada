const streetTypes = {
  ave: 'avenue', av: 'avenue', blvd: 'boulevard', cres: 'crescent', cr: 'crescent', ct: 'court',
  dr: 'drive', hwy: 'highway', ln: 'lane', pkwy: 'parkway', pl: 'place', rd: 'road', st: 'street',
  ter: 'terrace', trl: 'trail', w: 'west', e: 'east', n: 'north', s: 'south'
};

function words(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
    .map(word => streetTypes[word] || word);
}

export function matchingAddresses(features, query) {
  const [streetPart, cityPart = ''] = query.split(',');
  const numberMatch = streetPart.trim().match(/^(\d+[a-z]?)\s+(.+)$/i);
  const houseNumber = numberMatch?.[1].toLowerCase();
  const streetQuery = words(numberMatch ? numberMatch[2] : streetPart);
  const cityQuery = words(cityPart);
  if (!streetQuery.length) return [];

  const addresses = (Array.isArray(features) ? features : []).filter(feature => {
    const place = feature?.properties || {};
    if (String(place.countrycode || '').toUpperCase() !== 'CA' || !place.housenumber || !place.street) return false;
    if (houseNumber && String(place.housenumber).toLowerCase() !== houseNumber) return false;
    const street = words(place.street);
    if (!streetQuery.every((word, index) => street[index]?.startsWith(word))) return false;
    if (cityQuery.length) {
      const city = words(place.city || place.locality || place.county);
      if (!cityQuery.every((word, index) => city[index]?.startsWith(word))) return false;
    }
    return true;
  }).map(feature => {
    const place = feature.properties;
    return [`${place.housenumber} ${place.street}`, place.city || place.locality || place.county,
      [place.state, place.postcode].filter(Boolean).join(' '), 'Canada'].filter(Boolean).join(', ');
  });
  return [...new Set(addresses)].slice(0, 6);
}
