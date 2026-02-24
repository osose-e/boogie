#!/usr/bin/env node
/**
 * Enrich campusContext.json using Overpass API + OpenAI + web-researched seed data.
 * Populates addresses, alternate names (e.g. Building 160), entrances, landmarks
 * (stairs, fountains, bike racks, parking, establishments).
 *
 * Requires: OPENAI_API_KEY in env or .env
 * Run: node scripts/enrichCampusContext.js
 */

const fs = require('fs');
const path = require('path');

// Load .env if present
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (_) {}

const STANFORD_BBOX = { south: 37.42, west: -122.18, north: 37.44, east: -122.14 };
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Web-researched seed data: addresses, aliases (building numbers), entrances, landmarks
const SEED_DATA = {
  'Computing and Data Science (CoDa)': {
    address: '385 Serra St., Stanford, CA 94305',
    alternateNames: ['CoDa', 'Computing & Data Science'],
    entrances: ['north', 'east', 'southwest'],
    landmarks: ['near the Blend', 'Blend cafe', 'Gilbert Hall', 'stairs', 'Hive staircase', 'bike racks', 'Oval', 'Main Quad'],
    establishments: ['coffee bar'],
  },
  'Computing & Data Science': { address: '385 Serra St., Stanford, CA 94305', alternateNames: ['CoDa'] },
  'Wallenberg Hall': {
    address: '450 Jane Stanford Way, Stanford, CA 94305',
    alternateNames: ['Building 160', 'Bldg 160'],
    entrances: ['north', 'Outer Quad side'],
    landmarks: ['Main Quad', 'ramp to right of steps', 'Outer Quad arcade'],
  },
  'McLatchy Hall': {
    address: '450 Jane Stanford Way, Stanford, CA 94305',
    alternateNames: ['Building 120', 'Bldg 120'],
    entrances: ['north', 'Outer Quad'],
    landmarks: ['Main Quad', 'Outer Quad'],
  },
  'Gates Computer Science': {
    address: '353 Serra Mall, Stanford, CA 94305',
    alternateNames: ['Gates', 'Gates Building', 'Building 07-450'],
    entrances: ['north', 'Serra Mall side'],
    landmarks: ['corner Serra Mall and North-South Axis', 'stairs'],
  },
  'Gilbert Hall': {
    address: '371 Jane Stanford Way, Stanford, CA 94305',
    alternateNames: ['Gilbert Biological Sciences', 'Building 07-420'],
    entrances: ['north', 'south'],
    landmarks: ['stairs', 'near CoDa', 'near Blend'],
  },
  'Tresidder Memorial Union': {
    address: '459 Lagunita Drive, Stanford, CA 94305',
    alternateNames: ['Tresidder', 'TMU', 'Building 02-300'],
    entrances: ['east (White Plaza)', 'west (Humanities)', 'south ramp'],
    landmarks: ['White Plaza', 'Dinkelspiel Auditorium', 'Old Union', 'Treehouse', 'patio seating', 'ramp south side', 'elevator west near Treehouse'],
    establishments: ['CoHo', 'Campus Bike Shop', 'food court', 'Starbucks', 'Panda Express', 'Jamba Juice', 'Subway', 'Decadence', 'package center'],
  },
  'Stanford Bookstore': {
    address: '519 Lasuen Mall, Stanford, CA 94305',
    alternateNames: ['Bookstore', 'Building 02-001'],
    entrances: ['White Plaza east', 'Lasuen Mall'],
    landmarks: ['White Plaza', 'Post Office nearby', 'bike racks'],
    establishments: ['bookstore', 'cardinal gear'],
  },
  'Lathrop Library': {
    address: '518 Memorial Way, Stanford, CA 94305',
    alternateNames: ['Lathrop', 'Building 08-350'],
    entrances: ['Memorial Way', 'Lasuen Mall'],
    landmarks: ['Memorial Auditorium nearby', 'Lasuen Mall', 'stairs'],
  },
  'Memorial Church': {
    address: '450 Serra Mall, Stanford, CA 94305',
    alternateNames: ['Memorial Church'],
    entrances: ['Main Quad', 'Memorial Court'],
    landmarks: ['Memorial Court', 'Main Quad', 'fountain', 'Memorial fountain'],
  },
  'Memorial Court': {
    address: 'Memorial Court, Stanford, CA 94305',
    entrances: ['Main Quad'],
    landmarks: ['Main Quad', 'Memorial Church', 'fountain'],
  },
  'Stanford Oval': {
    address: 'Stanford Oval, Stanford, CA 94305',
    landmarks: ['Palm Drive', 'central emblem garden', 'benches', 'oak trees'],
  },
  'Dinkelspiel Memorial Music Auditorium': {
    address: '471 Lagunita Drive, Stanford, CA 94305',
    alternateNames: ['Dinkelspiel', 'Dinkelspiel Auditorium'],
    entrances: ['Lagunita Drive'],
    landmarks: ['near Tresidder', 'White Plaza', 'stairs'],
  },
  'Sapp Center for Science Teaching & Learning': {
    address: '376 Lomita Drive, Stanford, CA 94305',
    alternateNames: ['Sapp Center', 'Sapp', 'Old Chemistry', 'Building 07-200'],
    entrances: ['Lomita Drive'],
    landmarks: ['stairs', 'near Gates', 'near CoDa'],
  },
  'Green Library': {
    address: '557 Escondido Mall, Stanford, CA 94305',
    alternateNames: ['Green'],
    entrances: ['Escondido Mall', 'Main Quad'],
    landmarks: ['fountain', 'Main Quad', 'stairs'],
  },
  'Old Union': {
    address: '520 Lasuen Mall, Stanford, CA 94305',
    entrances: ['Lasuen Mall', 'White Plaza'],
    landmarks: ['fountain', 'White Plaza', 'near Tresidder'],
  },
  'Haas Center for Public Service': {
    address: '562 Salvatierra Walk, Stanford, CA 94305',
    alternateNames: ['Haas'],
    entrances: ['Salvatierra Walk'],
    landmarks: ['stairs', 'near White Plaza'],
  },
  'Hoover Tower': {
    address: '550 Serra Mall, Stanford, CA 94305',
    alternateNames: ['Hoover'],
    entrances: ['Serra Mall'],
    landmarks: ['landmark tower', 'observation deck', 'stairs'],
  },
};

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

function findSeedMatch(name) {
  const n = normalizeName(name);
  for (const [key, data] of Object.entries(SEED_DATA)) {
    if (n.includes(normalizeName(key)) || normalizeName(key).includes(n)) return { key, data };
    const aliases = data.alternateNames || [];
    if (aliases.some((a) => normalizeName(a) === n || n.includes(normalizeName(a)))) return { key, data };
  }
  return null;
}

async function fetchOverpass() {
  const { south, west, north, east } = STANFORD_BBOX;
  const bbox = `${south},${west},${north},${east}`;
  const query = `
[out:json][timeout:25];
(
  way["building"]["name"](${bbox});
  node["amenity"](${bbox});
  node["natural"="water"](${bbox});
);
out body;
`.trim();
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();
  return json;
}

const BATCH_SIZE = 40;

async function enrichWithOpenAI(batch, apiKey) {
  const buildingsToEnrich = batch.map((b) => ({
    name: b.name,
    address: b.address || null,
    alternateNames: b.alternateNames || [],
    entrances: b.entrances || [],
    landmarks: b.landmarks || [],
    establishments: b.establishments || [],
  }));

  const sys = `You are enriching Stanford campus building data. For each building, fill in:
- address: full street address in Stanford, CA 94305 format (correct if wrong)
- alternateNames: building numbers (e.g. "Building 160"), abbreviations, common names
- entrances: cardinal directions and descriptors (north, east, southwest, Main Quad side, etc.)
- landmarks: stairs, fountains, bike racks, parking lots, ramps, nearby buildings, notable features
- establishments: cafes, restaurants, shops inside the building
Return JSON object: { "buildings": [ ... ] } with array same length and order. Use empty arrays [] for unknown.`;
  const user = `Enrich these Stanford buildings. Use your knowledge of Stanford campus.\n${JSON.stringify(buildingsToEnrich)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No OpenAI response');
  const parsed = JSON.parse(content);
  const arr = parsed.buildings || parsed.result || (Array.isArray(parsed) ? parsed : []);
  return Array.isArray(arr) ? arr : [];
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Set OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY in env');
    process.exit(1);
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'campusContext.json');

  let buildings = [];
  let amenities = [];
  let existingData = null;

  // Try to load existing campusContext.json
  if (fs.existsSync(outPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      buildings = (existingData.buildings || []).map((b) => ({
        name: b.name || '',
        address: b.address || '',
        alternateNames: b.alternateNames || [],
        entrances: b.entrances || [],
        landmarks: b.landmarks || [],
        establishments: b.establishments || [],
        notes: b.notes || '',
      }));
      amenities = existingData.amenities || [];
      console.log(`Loaded ${buildings.length} buildings from existing campusContext.json`);
    } catch (e) {
      console.warn('Could not load existing file:', e.message);
    }
  }

  // If no existing file, fetch from Overpass and seed
  if (buildings.length === 0) {
    console.log('Fetching Overpass data...');
    let elements = [];
    try {
      const overpass = await fetchOverpass();
      elements = overpass.elements || [];
      for (const el of elements) {
        const tags = el.tags || {};
        if (el.type === 'node' && tags.amenity) {
          amenities.push(tags.name || tags.amenity);
        }
      }
    } catch (e) {
      console.warn('Overpass error:', e.message);
    }

    const buildingNames = new Set();
    for (const el of elements) {
      const tags = el.tags || {};
      if (el.type === 'way' && tags.building && tags.name) {
        buildingNames.add(tags.name);
      }
    }

    const seedNames = Object.keys(SEED_DATA);
    const orderedNames = [...new Set([...seedNames, ...buildingNames])];
    buildings = orderedNames.map((name) => {
      const match = findSeedMatch(name);
      const seed = match ? match.data : {};
      return {
        name,
        address: seed.address || '',
        alternateNames: seed.alternateNames || [],
        entrances: seed.entrances || [],
        landmarks: seed.landmarks || [],
        establishments: seed.establishments || [],
        notes: seed.notes || '',
      };
    });
  } else if (existingData && existingData.landmarkContext) {
    amenities = existingData.amenities || amenities;
  }

  const totalBatches = Math.ceil(buildings.length / BATCH_SIZE);
  console.log(`Enriching ${buildings.length} buildings in ${totalBatches} batches...`);
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, buildings.length);
    const batch = buildings.slice(start, end);
    try {
      const enriched = await enrichWithOpenAI(batch, apiKey);
      for (let i = 0; i < Math.min(enriched.length, batch.length); i++) {
        const e = enriched[i];
        if (e && typeof e === 'object') {
          const b = buildings[start + i];
          if (e.address) b.address = e.address;
          if (Array.isArray(e.alternateNames) && e.alternateNames.length) b.alternateNames = e.alternateNames;
          if (Array.isArray(e.entrances) && e.entrances.length) b.entrances = e.entrances;
          if (Array.isArray(e.landmarks) && e.landmarks.length) b.landmarks = e.landmarks;
          if (Array.isArray(e.establishments) && e.establishments.length) b.establishments = e.establishments;
        }
      }
      console.log(`  Batch ${batchIndex + 1}/${totalBatches} (buildings ${start + 1}-${end}) done`);
      if (batchIndex < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (e) {
      console.warn(`  Batch ${batchIndex + 1} error:`, e.message);
    }
  }

  const landmarkContext = {
    bikeRacks: 'CoDa north entrance; Tresidder; Stanford Bookstore; Gates; Lathrop Library; near Memorial Church. Cardinal Bike Shop, The Bike Connection.',
    parkingLots: 'Roth Way Garage; Via Ortega Garage; PAMF Parking Structure; Ted Thompson Garage; Lot 3; Pasteur Staff Garage. Parking near Tresidder, Stanford Hospital.',
    establishments: 'Tresidder: Starbucks, Panda Express, Jamba Juice, Subway, food court, Decadence. CoHo, Axe & Palm, Bytes Cafe, Coupa Café, Peet\'s Coffee. Stanford Bookstore. CVS, Trader Joe\'s, Mollie\'s.',
  };

  const output = {
    generatedAt: new Date().toISOString(),
    source: existingData?.source || 'Overpass + OpenAI + web-researched seed data. Edit to refine.',
    buildings,
    amenities: [...new Set(amenities)].filter(Boolean).slice(0, 80),
    landmarkContext: existingData?.landmarkContext || landmarkContext,
    humanAdditions: existingData?.humanAdditions || [],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});