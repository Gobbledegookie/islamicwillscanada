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

  const candidates = (Array.isArray(features) ? features : []).flatMap(feature => {
    const place = feature?.properties || {};
    if (String(place.countrycode || '').toUpperCase() !== 'CA') return [];
    const isHouse = Boolean(place.housenumber && place.street);
    const isStreet = place.type === 'street' && Boolean(place.name);
    if (!isHouse && !isStreet) return [];
    if (isHouse && houseNumber && String(place.housenumber).toLowerCase() !== houseNumber) return [];

    const streetName = isHouse ? place.street : place.name;
    const street = words(streetName);
    const cityName = place.city || place.locality || place.county || '';
    const city = words(cityName);
    const comparisonLength = Math.min(streetQuery.length, street.length);
    if (!comparisonLength || !streetQuery.slice(0, comparisonLength).every((word, index) => street[index]?.startsWith(word))) return [];
    const trailingCity = streetQuery.slice(street.length);
    if (trailingCity.length && !trailingCity.every((word, index) => city[index]?.startsWith(word))) return [];
    if (cityQuery.length && !cityQuery.every((word, index) => city[index]?.startsWith(word))) return [];

    const completeStreet = streetQuery.length >= street.length && street.every((word, index) => word === streetQuery[index]);
    const value = isHouse
      ? [`${place.housenumber} ${streetName}`, cityName, [place.state, place.postcode].filter(Boolean).join(' '), 'Canada'].filter(Boolean).join(', ')
      : [`${houseNumber ? `${houseNumber} ` : ''}${streetName}`, cityName, place.state, 'Canada'].filter(Boolean).join(', ');
    return [{ value, label: isHouse ? value : `${value} — street match; house number not verified`,
      kind: isHouse ? 'house' : 'street', rank: completeStreet ? (isHouse ? 3 : 2) : (isHouse ? 1 : 0) }];
  });
  const bestRank = Math.max(...candidates.map(candidate => candidate.rank));
  const seen = new Set();
  return candidates.filter(candidate => {
    if (candidate.rank !== bestRank || seen.has(candidate.value)) return false;
    seen.add(candidate.value);
    return true;
  }).slice(0, 6).map(({ value, label, kind, rank }) => ({ value, label, kind, exactStreet: rank >= 2 }));
}
