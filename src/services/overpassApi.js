/**
 * Overpass API service for Stanford University campus.
 * Fetches buildings, entrances, and landmarks (bike racks, stairs, parking) for location resolution.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// Stanford campus bounding box (south, west, north, east)
const STANFORD_BBOX = [37.418, -122.185, 37.435, -122.155];

/**
 * Build and run an Overpass query for Stanford campus.
 * Returns buildings (with names), entrances, amenity=bicycle_parking, highway=steps, amenity=parking.
 */
export async function fetchStanfordCampusData() {
  const [south, west, north, east] = STANFORD_BBOX;
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${south},${west},${north},${east});
      node["entrance"](${south},${west},${north},${east});
      node["amenity"="bicycle_parking"](${south},${west},${north},${east});
      node["amenity"="parking"](${south},${west},${north},${east});
      way["highway"="steps"](${south},${west},${north},${east});
    );
    out body geom;
  `;

  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
    const json = await res.json();
    return normalizeOverpassResponse(json);
  } catch (e) {
    console.warn('Overpass fetch failed, using fallback data:', e.message);
    return getFallbackCampusData();
  }
}

/**
 * Normalize Overpass elements into a flat list with type, name, tags, center coords.
 */
function normalizeOverpassResponse(json) {
  const elements = json.elements || [];
  const byId = {};
  elements.forEach((el) => {
    byId[el.type + '/' + el.id] = el;
  });

  const buildings = [];
  const entrances = [];
  const bicycleParking = [];
  const parking = [];
  const steps = [];

  elements.forEach((el) => {
    const name = el.tags?.name;
    const center = getCenter(el);

    if (el.type === 'way' && el.tags?.building) {
      buildings.push({
        id: `way/${el.id}`,
        name: name || null,
        type: el.tags.building,
        tags: el.tags,
        lat: center?.lat,
        lon: center?.lon,
      });
    } else if (el.type === 'node' && el.tags?.entrance) {
      entrances.push({
        id: `node/${el.id}`,
        entrance: el.tags.entrance,
        name: name || el.tags.ref || null,
        tags: el.tags,
        lat: el.lat,
        lon: el.lon,
      });
    } else if (el.type === 'node' && el.tags?.amenity === 'bicycle_parking') {
      bicycleParking.push({
        id: `node/${el.id}`,
        name: name || null,
        lat: el.lat,
        lon: el.lon,
      });
    } else if (el.type === 'node' && el.tags?.amenity === 'parking') {
      parking.push({
        id: `node/${el.id}`,
        name: name || null,
        lat: el.lat,
        lon: el.lon,
      });
    } else if (el.type === 'way' && el.tags?.highway === 'steps') {
      steps.push({
        id: `way/${el.id}`,
        name: name || null,
        lat: center?.lat,
        lon: center?.lon,
      });
    }
  });

  return {
    buildings,
    entrances,
    bicycleParking,
    parking,
    steps,
  };
}

function getCenter(el) {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  if (el.geometry && el.geometry.length) {
    const g = el.geometry;
    const lat = g.reduce((s, p) => s + p.lat, 0) / g.length;
    const lon = g.reduce((s, p) => s + p.lon, 0) / g.length;
    return { lat, lon };
  }
  return null;
}

/**
 * Fallback when Overpass is unavailable: known Stanford buildings and landmarks for CoDa and common spots.
 */
function getFallbackCampusData() {
  return {
    buildings: [
      { id: 'coda', name: 'Computing and Data Science', type: 'yes', lat: 37.4275, lon: -122.17 },
      { id: 'wallenberg', name: 'Wallenberg Hall', type: 'yes', lat: 37.428, lon: -122.173 },
      { id: 'memorial', name: 'Memorial Church', type: 'yes', lat: 37.427, lon: -122.17 },
      { id: 'oval', name: 'Stanford Oval', type: 'yes', lat: 37.427, lon: -122.169 },
      { id: 'tresidder', name: 'Tresidder Memorial Union', type: 'yes', lat: 37.4245, lon: -122.1706 },
      { id: 'gilbert', name: 'Gilbert Building', type: 'yes', lat: 37.426, lon: -122.171 },
      { id: 'gates', name: 'Gates Building', type: 'yes', lat: 37.428, lon: -122.172 },
      { id: 'mclatchy', name: 'McLatchy Hall', type: 'yes', lat: 37.428, lon: -122.173 },
      { id: 'bookstore', name: 'Stanford Bookstore', type: 'yes', lat: 37.424, lon: -122.169 },
    ],
    entrances: [],
    bicycleParking: [],
    parking: [],
    steps: [],
  };
}

/**
 * Search campus data for building/place name or landmark keyword (e.g. "coda", "oval", "bike").
 * Uses Overpass result or fallback. Returns best match with optional entrance/landmark hint.
 */
export function searchCampusLocation(campusData, userInput) {
  const lower = (userInput || '').toLowerCase().trim();
  if (!lower) return null;

  const { buildings } = campusData;

  // Normalize building names for matching (e.g. "computing and data science" -> coda)
  const buildingAliases = {
    coda: ['coda', 'computing', 'data science', 'computing and data science', '385 serra'],
    wallenberg: ['wallenberg', 'wallenberg hall'],
    memorial: ['memorial church', 'memorial', 'church'],
    oval: ['oval', 'stanford oval', 'the oval'],
    tresidder: ['tresidder', 'tresidder union', 'union', 'memorial union', 'tmu'],
    gilbert: ['gilbert', 'gilbert building'],
    gates: ['gates', 'gates building', 'bill gates'],
    mclatchy: ['mclatchy', 'mclatchy hall'],
    bookstore: ['bookstore', 'stanford bookstore'],
  };

  for (const [key, aliases] of Object.entries(buildingAliases)) {
    if (aliases.some((a) => lower.includes(a))) {
      const b = buildings.find((x) => x.name && (x.name.toLowerCase().includes(key) || key.includes(x.name.toLowerCase().replace(/\s+/g, ''))));
      const building = b || buildings.find((x) => x.id === key);
      if (building) {
        const landmark = inferLandmarkFromInput(lower, building);
        return {
          type: 'building',
          name: building.name || key,
          address: building.tags?.addr_street ? `${building.tags.addr_street}, Stanford, CA 94305` : null,
          lat: building.lat,
          lon: building.lon,
          entranceHint: landmark?.entrance,
          landmarkHint: landmark?.landmark,
        };
      }
    }
  }

  // Fallback: match any building name
  for (const b of buildings) {
    if (b.name && lower.includes(b.name.toLowerCase())) {
      const landmark = inferLandmarkFromInput(lower, b);
      return {
        type: 'building',
        name: b.name,
        address: b.tags?.addr_street ? `${b.tags.addr_street}, Stanford, CA 94305` : null,
        lat: b.lat,
        lon: b.lon,
        entranceHint: landmark?.entrance,
        landmarkHint: landmark?.landmark,
      };
    }
  }

  return null;
}

/**
 * Infer entrance or landmark from user text (e.g. "north entrance", "near the bikes", "by the stairs").
 */
function inferLandmarkFromInput(lower, building) {
  const entranceMap = {
    north: 'north',
    south: 'south',
    east: 'east',
    west: 'west',
    main: 'main',
    southwest: 'southwest',
    southeast: 'southeast',
    northwest: 'northwest',
    northeast: 'northeast',
  };
  for (const [keyword, entrance] of Object.entries(entranceMap)) {
    if (lower.includes(keyword) && (lower.includes('entrance') || lower.includes('side') || lower.includes('door'))) {
      return { entrance: `${entrance} entrance`, landmark: null };
    }
  }
  if (lower.includes('bike') || lower.includes('bicycle') || lower.includes('rack')) return { entrance: null, landmark: 'bike racks' };
  if (lower.includes('stair') || lower.includes('step')) return { entrance: null, landmark: 'stairs' };
  if (lower.includes('fountain') || lower.includes('oval')) return { entrance: null, landmark: 'oval/fountain' };
  if (lower.includes('blend') || lower.includes('coffee')) return { entrance: 'north', landmark: 'Blend (coffee)' };
  if (lower.includes('gilbert')) return { entrance: 'southwest', landmark: 'Gilbert' };
  if (lower.includes('gate')) return { entrance: 'east', landmark: 'Gates' };
  if (lower.includes('main')) return { entrance: 'main', landmark: null };
  return { entrance: null, landmark: null };
}
