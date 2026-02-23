/**
 * Overpass API helpers for Stanford campus.
 * Fetches buildings, amenities (bike racks, etc.), and POIs to give Boogie bot real campus context.
 * Overpass is public; no API key required.
 */

const STANFORD_BBOX = {
  south: 37.42,
  west: -122.18,
  north: 37.44,
  east: -122.14,
};

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/**
 * Build Overpass QL for Stanford campus: named buildings and key amenities.
 */
function buildStanfordQuery() {
  const { south, west, north, east } = STANFORD_BBOX;
  const bbox = `${south},${west},${north},${east}`;
  return `
[out:json][timeout:20];
(
  way["building"]["name"](${bbox});
  node["amenity"](${bbox});
);
out body;
`.trim();
}

/**
 * Fetch Overpass data for Stanford and return a short text summary for LLM context.
 * Caches in memory for the session to avoid repeated requests.
 */
let cachedSummary = null;

export async function getStanfordOverpassContext() {
  if (cachedSummary) return cachedSummary;

  try {
    const query = buildStanfordQuery();
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.warn('Overpass request failed:', res.status);
      return '';
    }

    const json = await res.json();
    const elements = json.elements || [];
    const buildings = [];
    const amenities = new Set();
    const bikeParking = [];

    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name;
      if (el.type === 'way' && tags.building && name) {
        buildings.push(name);
      }
      if (el.type === 'node') {
        if (tags.amenity) amenities.add(tags.amenity);
        if (tags.amenity === 'bicycle_parking') bikeParking.push(name || 'bicycle parking');
      }
    }

    const summary = [
      buildings.length ? `Buildings (sample): ${[...new Set(buildings)].slice(0, 40).join(', ')}` : '',
      amenities.size ? `Amenities in area: ${[...amenities].join(', ')}` : '',
      bikeParking.length ? `Bicycle parking noted in area.` : '',
    ]
      .filter(Boolean)
      .join('\n');

    cachedSummary = summary || 'Stanford campus area (no Overpass details extracted).';
    return cachedSummary;
  } catch (e) {
    console.warn('Overpass error:', e);
    return '';
  }
}

export function clearOverpassCache() {
  cachedSummary = null;
}
