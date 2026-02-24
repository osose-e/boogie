#!/usr/bin/env node
/**
 * Generates/refreshes stanfordCampusData.json with ~400 Stanford campus buildings.
 * 1. Fetches ALL buildings in Stanford bbox from Overpass API.
 * 2. Loads existing JSON; merges (updates coords for existing, adds new buildings).
 * 3. Uses OpenAI to enhance EVERY entry: correct addresses, alternate names,
 *    entrances with landmarks (stairs, bike racks, parking, fountains, establishments)
 *    mapped to specific entrances. Uses knowledge of Stanford campus.
 * 4. Saves periodically so progress is not lost.
 *
 * Usage:
 *   node scripts/generateCampusData.mjs                    # Overpass + merge + OpenAI enhance all (~890 buildings; ~30+ min)
 *   node scripts/generateCampusData.mjs --overpass-only    # Only fetch Overpass and merge, no OpenAI
 *   ENHANCE_LIMIT=10 node scripts/generateCampusData.mjs   # Only enhance first 10 (for testing)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_PATH = join(ROOT, 'src', 'data', 'stanfordCampusData.json');

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const STANFORD_BBOX = [37.418, -122.185, 37.435, -122.155]; // south, west, north, east
const SAVE_EVERY = 25; // save after every N OpenAI calls
const OPENAI_DELAY_MS = 400; // rate limit between calls

// Load .env
try {
  const envPath = join(ROOT, '.env');
  const env = readFileSync(envPath, 'utf8');
  env.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch (_) {}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OVERPASS_ONLY = process.argv.includes('--overpass-only');
const ENHANCE_LIMIT = parseInt(process.env.ENHANCE_LIMIT || '0', 10) || null; // e.g. ENHANCE_LIMIT=5 for testing

function slug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'building';
}

async function overpassQueryAllBuildings() {
  const [south, west, north, east] = STANFORD_BBOX;
  const query = `
    [out:json][timeout:90];
    way["building"](${south},${west},${north},${east});
    out body geom;
  `;
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass: ${res.status} ${await res.text()}`);
  return res.json();
}

function getCenter(el) {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  if (el.geometry?.length) {
    const g = el.geometry;
    return {
      lat: g.reduce((s, p) => s + p.lat, 0) / g.length,
      lon: g.reduce((s, p) => s + p.lon, 0) / g.length,
    };
  }
  return null;
}

function buildAddress(tags) {
  if (!tags) return null;
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (parts.length) return parts.join(' ') + ', Stanford, CA 94305';
  if (tags['addr:full']) return tags['addr:full'];
  return null;
}

function normalizeOverpassAll(json) {
  const elements = json.elements || [];
  const buildings = [];
  const seenIds = new Set();
  elements.forEach((el) => {
    if (el.type !== 'way' || !el.tags?.building) return;
    const center = getCenter(el);
    if (center?.lat == null || center?.lon == null) return;
    const name = el.tags.name || buildAddress(el.tags) || `Building ${el.id}`;
    const baseId = slug(el.tags.name || el.tags['addr:street'] || '') || `way-${el.id}`;
    let uniqId = baseId;
    if (seenIds.has(baseId)) {
      uniqId = `${baseId}-${el.id}`;
    } else {
      seenIds.add(baseId);
    }
    seenIds.add(uniqId);
    buildings.push({
      id: uniqId,
      name,
      tags: el.tags,
      address: buildAddress(el.tags),
      coordinates: { lat: center.lat, lon: center.lon },
      lat: center.lat,
      lon: center.lon,
    });
  });
  return buildings;
}

function loadExisting() {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { metadata: {}, buildings: [] };
  }
}

function mergeOverpassIntoJson(existing, overpassBuildings) {
  const existingBuildings = existing.buildings || [];
  const byId = new Map(existingBuildings.map((b) => [b.id, b]));
  const byNameLower = new Map();
  existingBuildings.forEach((b) => {
    if (b.name) byNameLower.set(b.name.toLowerCase().trim(), b);
    (b.alternateNames || []).forEach((a) => a && byNameLower.set(a.toLowerCase().trim(), b));
  });

  const merged = [];
  const mergedSet = new Set();

  for (const op of overpassBuildings) {
    const nameLower = (op.name || '').toLowerCase().trim();
    const matchById = byId.get(op.id);
    const matchByName = nameLower && byNameLower.get(nameLower);
    const matchByCoords = existingBuildings.find(
      (b) =>
        b.coordinates?.lat != null &&
        Math.abs((b.coordinates?.lat || 0) - op.lat) < 1e-3 &&
        Math.abs((b.coordinates?.lon || 0) - op.lon) < 1e-3
    );
    const match = matchById || matchByName || matchByCoords;

    if (match) {
      if (op.lat != null && op.lon != null) match.coordinates = { lat: op.lat, lon: op.lon };
      if (!mergedSet.has(match.id)) {
        mergedSet.add(match.id);
        merged.push(match);
      }
    } else {
      if (mergedSet.has(op.id)) continue;
      mergedSet.add(op.id);
      merged.push({
        id: op.id,
        name: op.name,
        alternateNames: [],
        address: op.address || null,
        buildingNumber: null,
        coordinates: { lat: op.lat, lon: op.lon },
        entrances: [],
      });
    }
  }

  existingBuildings.forEach((b) => {
    if (!mergedSet.has(b.id)) {
      mergedSet.add(b.id);
      merged.push(b);
    }
  });

  return { ...existing, buildings: merged };
}

async function openAIEnhanceBuilding(building, index, total) {
  if (!OPENAI_API_KEY) return building;
  const prompt = `You are enhancing a Stanford University campus building record for a ride-sharing pickup/dropoff app (DisGo/Boogie). Use your knowledge of Stanford campus, official building names, addresses (Serra Mall, Jane Stanford Way, etc.), and Building numbers from the Campus Access Guide.

Current building record:
${JSON.stringify(building, null, 2)}

Return a single JSON object (no markdown, no code block) with these exact keys:
- name: official Stanford building name
- alternateNames: array of common names, abbreviations, and Building numbers (e.g. "Building 160", "Bldg 02-300", "CoDa", "TMU")
- address: full street address in Stanford, CA 94305 (use Serra Mall, Jane Stanford Way, Lagunita Drive, etc. as appropriate)
- buildingNumber: Stanford facility/building number if known (e.g. "160", "02-300", "01-500")
- coordinates: { "lat": number, "lon": number } — keep the existing values from the input
- entrances: array of 1–4 entrance objects. Each entrance must have:
  - id: short id (e.g. "main", "north-1", "east-1")
  - direction: "north"|"south"|"east"|"west"|"main"|null
  - name: human-readable name (e.g. "Main entrance", "North entrance")
  - roadSidewalk: street or plaza name
  - coordinates: { "lat", "lon" } optional; can approximate from building center
  - landmarks: { "bikeRacks": boolean, "stairs": boolean, "parkingLot": boolean, "fountain": boolean, "other": string[], "establishmentsInside": string[], "nextToBuilding": string|null, "acrossFromBuilding": string|null, "notes": string }
  - landmarkKeywords: array of strings that a user might say to identify this entrance (e.g. "bike racks", "north entrance", "blend", "starbucks", "white plaza")
Map real landmarks (stairs, bike racks, parking, fountains, cafes, Oval, White Plaza) to the correct entrance. Be specific so we can pinpoint pickup/dropoff.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`OpenAI ${index + 1}/${total} [${building.name}]: ${res.status} ${err.slice(0, 200)}`);
      return building;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const enhanced = {
        ...building,
        name: parsed.name ?? building.name,
        alternateNames: Array.isArray(parsed.alternateNames) ? parsed.alternateNames : building.alternateNames,
        address: parsed.address ?? building.address,
        buildingNumber: parsed.buildingNumber ?? building.buildingNumber,
        coordinates: parsed.coordinates && typeof parsed.coordinates.lat === 'number' ? parsed.coordinates : building.coordinates,
        entrances: Array.isArray(parsed.entrances) ? parsed.entrances : building.entrances,
      };
      console.log(`Enhanced ${index + 1}/${total}: ${enhanced.name}`);
      return enhanced;
    }
  } catch (e) {
    console.warn(`OpenAI exception ${index + 1}/${total} [${building.name}]:`, e.message);
  }
  return building;
}

function saveData(data) {
  data.metadata = {
    ...data.metadata,
    source: 'Overpass API + OpenAI',
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.buildings?.length ?? 0} buildings to ${DATA_PATH}`);
}

async function main() {
  console.log('Fetching all buildings from Overpass (Stanford bbox)...');
  const overpassJson = await overpassQueryAllBuildings();
  const overpassBuildings = normalizeOverpassAll(overpassJson);
  console.log(`Overpass: ${overpassBuildings.length} buildings`);

  let data = loadExisting();
  data = mergeOverpassIntoJson(data, overpassBuildings);
  const total = data.buildings.length;
  console.log(`Merged: ${total} buildings in JSON`);

  if (OVERPASS_ONLY) {
    console.log('--overpass-only: skipping OpenAI. Run without flag to enhance all entries.');
    saveData(data);
    return;
  }

  if (!OPENAI_API_KEY) {
    console.log('No OPENAI_API_KEY / EXPO_PUBLIC_OPENAI_API_KEY set. Writing merged data only.');
    saveData(data);
    return;
  }

  const toEnhance = ENHANCE_LIMIT ? Math.min(ENHANCE_LIMIT, total) : total;
  if (ENHANCE_LIMIT) console.log(`Enhancing first ${toEnhance} entries (ENHANCE_LIMIT=${ENHANCE_LIMIT})...`);
  else console.log(`Enhancing all ${total} entries with OpenAI (saving every ${SAVE_EVERY})...`);
  for (let i = 0; i < toEnhance; i++) {
    data.buildings[i] = await openAIEnhanceBuilding(data.buildings[i], i, toEnhance);
    await new Promise((r) => setTimeout(r, OPENAI_DELAY_MS));
    if ((i + 1) % SAVE_EVERY === 0) saveData(data);
  }

  saveData(data);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
