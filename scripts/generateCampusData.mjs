#!/usr/bin/env node
/**
 * Generates/refreshes stanfordCampusData.json with Stanford campus buildings.
 * 1. Overpass: fetches ALL buildings + amenities/entrances in Stanford bbox.
 * 2. Infers from Overpass: attaches nearby amenities (bike parking, parking, entrances) to each building.
 * 3. Loads existing JSON; merges (preserves Overpass tags and coords).
 * 4. Optional: fetches web context (Stanford searchable map / internet) if WEB_CONTEXT_URL set.
 * 5. OpenAI: enhances every entry using Overpass tags, nearby features, and Stanford/searchable-map knowledge.
 * 6. Saves periodically so progress is not lost.
 *
 * Usage:
 *   node scripts/generateCampusData.mjs --enhance-web      # Enhance named locations only via web (no AI, no Overpass)
 *   node scripts/generateCampusData.mjs --enhance-only    # Enhance existing JSON with AI (no Overpass)
 *   node scripts/generateCampusData.mjs                   # Full pipeline (Overpass + merge + AI enhance)
 *   node scripts/generateCampusData.mjs --overpass-only   # Only Overpass + merge
 *   ENHANCE_LIMIT=10 node scripts/... --enhance-web       # Web-enhance first 10 named locations
 *
 * Web enhancement uses KNOWN_ADDRESSES in this file for curated addresses (e.g. Mirrielees);
 * add entries there when you find wrong addresses. Parsed addresses are rejected if they look like URL garbage.
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
const ENHANCE_ONLY = process.argv.includes('--enhance-only');
const ENHANCE_WEB = process.argv.includes('--enhance-web'); // enhance named locations using web only (no AI)
const ENHANCE_LIMIT = parseInt(process.env.ENHANCE_LIMIT || '0', 10) || null;

const WEB_FETCH_DELAY_MS = 800; // be polite when scraping
const USER_AGENT = 'StanfordCampusDataGenerator/1.0 (campus building data)';

/** Curated correct addresses for named buildings (override web parsing when wrong). Add entries here as you find errors. */
const KNOWN_ADDRESSES = {
  'mirrielees': '730 Escondido Road, Stanford, CA 94305',
  'mirrielees house': '730 Escondido Road, Stanford, CA 94305',
  'lathrop library': '518 Memorial Way, Stanford, CA 94305',
  'tresidder memorial union': '459 Lagunita Drive, Stanford, CA 94305',
  'tresidder': '459 Lagunita Drive, Stanford, CA 94305',
  'tresidder': '459 Lagunita Drive, Stanford, CA 94305',
  'coda': '385 Serra Mall, Stanford, CA 94305',
  'computing and data science': '385 Serra Mall, Stanford, CA 94305',
  'wallenberg hall': '450 Serra Mall, Stanford, CA 94305',
  'wallenberg': '450 Serra Mall, Stanford, CA 94305',
  'sapp center for science teaching and learning': '376 Lomita Drive, Stanford, CA 94305',
  'sapp center': '376 Lomita Drive, Stanford, CA 94305',
  'stlc': '376 Lomita Drive, Stanford, CA 94305',
  'sapp': '376 Lomita Drive, Stanford, CA 94305',
};

function slug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'building';
}

/** True if the building is a named location (e.g. Lathrop, CoDa, Wallenberg), not just an address or "Building 123". */
function isNamedLocation(building) {
  const name = (building?.name || '').trim();
  if (!name || name.length < 2) return false;
  if (/^\d+\s/.test(name)) return false; // "521 Memorial Way"
  if (/^Building\s*\d+/i.test(name)) return false;
  if (/^building-\d+$/i.test(name)) return false;
  if (/^\d+[\s-]*(Memorial|Serra|Jane|Lagunita|Santa|Campus)/i.test(name)) return false;
  if (name.includes(', Stanford, CA')) return false; // full address as name
  return true;
}

/** Fetch web content for a building: DuckDuckGo HTML search for "Stanford [name]". */
async function fetchWebForBuilding(buildingName) {
  const query = encodeURIComponent(`Stanford University ${buildingName} campus`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return '';
    const html = await res.text();
    return html.replace(/\s+/g, ' ').trim().slice(0, 15000);
  } catch (e) {
    return '';
  }
}

/** Return true if the string looks like a valid Stanford address (not a URL fragment or garbage). */
function isValidAddress(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  if (t.length < 15) return false;
  if (/%2F|%2D|&amp;|&lt;|&gt;|stanford%2F/i.test(t)) return false;
  if (/\d{5,}/.test(t)) return false; // long number strings
  if (!/Stanford,?\s*CA\s*94305/i.test(t)) return false;
  return true;
}

/** Extract address and alternate names from web text. Returns { address, alternateNames } or null. */
function parseWebTextForBuilding(text, buildingName) {
  if (!text || !buildingName) return null;
  const out = { address: null, alternateNames: [] };
  const nameLower = buildingName.toLowerCase().trim();

  // Stanford address pattern: number + street, Stanford, CA 94305
  const addrMatch = text.match(/\d+[\s\w.]+\s*(?:Street|St|Way|Mall|Drive|Dr|Road|Rd|Ave|Lane|Ln)[^.]*?Stanford,?\s*CA\s*94305/i);
  if (addrMatch) {
    const addr = addrMatch[0].trim().replace(/\s+/g, ' ');
    if (isValidAddress(addr)) out.address = addr;
  }

  // Common street names if we didn't get full address
  if (!out.address) {
    for (const street of ['Serra Mall', 'Memorial Way', 'Jane Stanford Way', 'Lagunita Drive', 'Santa Teresa Street', 'Escondido Road']) {
      if (text.toLowerCase().includes(street.toLowerCase())) {
        out.address = `${street}, Stanford, CA 94305`;
        break;
      }
    }
  }

  // Only add alternate names that are clearly for THIS building (e.g. "Mirrielees House" for Mirrielees)
  const firstWord = nameLower.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 2) {
    const aliasMatch = text.match(new RegExp(`\\b(${firstWord}[\\w'\\s]*?)\\s*(?:House|Hall|Library|Center|Building|Union)?`, 'gi'));
    if (aliasMatch) {
      const seen = new Set([nameLower]);
      aliasMatch.forEach((m) => {
        const w = m.trim();
        if (w.length >= 2 && w.length <= 40 && !seen.has(w.toLowerCase())) {
          seen.add(w.toLowerCase());
          out.alternateNames.push(w);
        }
      });
    }
  }
  return out;
}

/** Get curated address for a building name if we have one; otherwise return null. */
function getKnownAddress(buildingName) {
  if (!buildingName) return null;
  const key = buildingName.toLowerCase().trim();
  if (KNOWN_ADDRESSES[key]) return KNOWN_ADDRESSES[key];
  const keyFirst = key.split(/\s+/)[0];
  if (keyFirst && KNOWN_ADDRESSES[keyFirst]) return KNOWN_ADDRESSES[keyFirst];
  return null;
}

/** Enhance one building using web fetch + parse. Uses KNOWN_ADDRESSES when set; otherwise parsed address if valid. Keeps existing entrances and coordinates. */
async function webEnhanceBuilding(building) {
  const name = building?.name || '';
  const knownAddr = getKnownAddress(name);
  const enhanced = { ...building };

  if (knownAddr) {
    enhanced.address = knownAddr;
  }

  const html = await fetchWebForBuilding(name);
  await new Promise((r) => setTimeout(r, WEB_FETCH_DELAY_MS));
  const parsed = parseWebTextForBuilding(html, name);

  if (parsed) {
    if (!knownAddr && parsed.address && isValidAddress(parsed.address)) enhanced.address = parsed.address;
    if (Array.isArray(parsed.alternateNames) && parsed.alternateNames.length) {
      const existing = new Set((building.alternateNames || []).map((a) => (a || '').toLowerCase()));
      parsed.alternateNames.forEach((a) => {
        if (a && !existing.has(a.toLowerCase())) {
          existing.add(a.toLowerCase());
          enhanced.alternateNames = enhanced.alternateNames || [];
          enhanced.alternateNames.push(a);
        }
      });
    }
  }

  return enhanced;
}

async function overpassQuery(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Overpass: ${res.status} ${await res.text()}`);
  return res.json();
}

async function overpassQueryAllBuildings() {
  const [south, west, north, east] = STANFORD_BBOX;
  const query = `
    [out:json][timeout:90];
    way["building"](${south},${west},${north},${east});
    out body geom;
  `;
  return overpassQuery(OVERPASS_ENDPOINT, `data=${encodeURIComponent(query)}`);
}

/** Fetch amenities and entrances in Stanford bbox for inference (bike parking, parking lots, entrances). */
async function overpassQueryAmenitiesAndEntrances() {
  const [south, west, north, east] = STANFORD_BBOX;
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"~"bicycle_parking|parking"](${south},${west},${north},${east});
      node["entrance"](${south},${west},${north},${east});
      node["parking"](${south},${west},${north},${east});
      way["amenity"~"bicycle_parking|parking"](${south},${west},${north},${east});
      way["parking"](${south},${west},${north},${east});
    );
    out center;
  `;
  try {
    return await overpassQuery(OVERPASS_ENDPOINT, `data=${encodeURIComponent(query)}`);
  } catch (e) {
    console.warn('Overpass amenities query failed:', e.message);
    return { elements: [] };
  }
}

function getNodeOrWayCenter(el) {
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

/** Normalize Overpass amenities/entrances into a list of { lat, lon, tags, type } for radius lookup. */
function normalizeOverpassAmenities(json) {
  const elements = json.elements || [];
  const out = [];
  elements.forEach((el) => {
    const center = getNodeOrWayCenter(el);
    if (center?.lat == null || center?.lon == null) return;
    const tags = el.tags || {};
    out.push({
      lat: center.lat,
      lon: center.lon,
      tags,
      type: el.type,
      id: el.id,
    });
  });
  return out;
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

/** Attach nearby Overpass amenities/entrances to each building (within ~150m) for OpenAI inference. */
const NEARBY_RADIUS_DEG = 0.0014; // ~150m at Stanford latitude

function attachOverpassNearby(buildings, amenities) {
  buildings.forEach((b) => {
    const lat = b.coordinates?.lat ?? b.lat;
    const lon = b.coordinates?.lon ?? b.lon;
    if (lat == null || lon == null) {
      b.overpassNearby = [];
      return;
    }
    const nearby = amenities.filter(
      (a) =>
        Math.abs(a.lat - lat) <= NEARBY_RADIUS_DEG &&
        Math.abs(a.lon - lon) <= NEARBY_RADIUS_DEG
    );
    b.overpassNearby = nearby.map((a) => ({
      tags: a.tags,
      type: a.type,
      lat: a.lat,
      lon: a.lon,
    }));
  });
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
      if (op.tags) match.overpassTags = op.tags;
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
        overpassTags: op.tags || null,
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

async function openAIEnhanceBuilding(building, index, total, webContext = null) {
  if (!OPENAI_API_KEY) return building;

  const overpassTags = building.overpassTags || {};
  const overpassNearby = building.overpassNearby || [];
  const payload = { ...building };
  delete payload.overpassTags;
  delete payload.overpassNearby;

  const contextParts = [
    'Current building record (for enhancement):',
    JSON.stringify(payload, null, 2),
  ];
  if (Object.keys(overpassTags).length) {
    contextParts.push('\nOverpass API tags for this building (use to infer address, name, type):');
    contextParts.push(JSON.stringify(overpassTags, null, 2));
  }
  if (overpassNearby.length) {
    contextParts.push('\nNearby Overpass features (amenities/entrances within ~150m — use to infer which entrance has bike racks, parking, etc.):');
    contextParts.push(JSON.stringify(overpassNearby.slice(0, 25), null, 2));
  }
  if (webContext) {
    contextParts.push('\nOptional web/Stanford map context (use if relevant to this building):');
    contextParts.push(webContext.slice(0, 3000));
  }

  const prompt = `You are enhancing a Stanford University campus building record for a ride-sharing pickup/dropoff app (DisGo/Boogie).

Use ALL of the following to infer the best data:
1. **Overpass data**: Use the building's Overpass tags (addr:street, name, building type) and nearby Overpass features (bicycle_parking → bikeRacks, parking → parkingLot, entrance nodes) to infer entrances and landmarks. Assign nearby amenities to the most likely entrance (e.g. north side).
2. **Stanford searchable map** (campus-map.stanford.edu): Use knowledge of official building names and locations (Serra Mall, Jane Stanford Way, Lagunita Drive, Main Quad, White Plaza, MemAud, Oval, etc.). Do not add or infer building/facility numbers.
3. **General Stanford campus knowledge**: Addresses, abbreviations (CoDa, TMU, MemAud), and landmarks (Oval, White Plaza, Tresidder, libraries, dorms).

${contextParts.join('\n')}

Return a single JSON object (no markdown, no code block) with these exact keys:
- name: official Stanford building name
- alternateNames: array of common names and abbreviations (e.g. "CoDa", "TMU"). Do not add Building numbers or Bldg codes here.
- address: full street address in Stanford, CA 94305
- buildingNumber: always null (do not add or infer building numbers)
- coordinates: { "lat": number, "lon": number } — keep the existing values from the input
- entrances: array of 1–4 entrance objects. Each entrance must have:
  - id: short id (e.g. "main", "north-1", "east-1")
  - direction: "north"|"south"|"east"|"west"|"main"|null
  - name: human-readable name (e.g. "Main entrance", "North entrance")
  - roadSidewalk: street or plaza name
  - coordinates: { "lat", "lon" } optional
  - landmarks: { "bikeRacks": boolean, "stairs": boolean, "parkingLot": boolean, "fountain": boolean, "other": string[], "establishmentsInside": string[], "nextToBuilding": string|null, "acrossFromBuilding": string|null, "notes": string }
  - landmarkKeywords: array of strings users might say to identify this entrance
Infer from Overpass nearby: e.g. amenity=bicycle_parking → bikeRacks at nearest entrance. Map real Stanford landmarks to the correct entrance.`;

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
        buildingNumber: building.buildingNumber ?? null, // never add from AI; preserve existing only
        coordinates: parsed.coordinates && typeof parsed.coordinates.lat === 'number' ? parsed.coordinates : building.coordinates,
        entrances: Array.isArray(parsed.entrances) ? parsed.entrances : building.entrances,
      };
      delete enhanced.overpassTags;
      delete enhanced.overpassNearby;
      return enhanced;
    }
  } catch (e) {
    console.warn(`OpenAI exception ${index + 1}/${total} [${building.name}]:`, e.message);
  }
  return building;
}

function saveData(data, sourceOverride = null) {
  (data.buildings || []).forEach((b) => {
    delete b.overpassTags;
    delete b.overpassNearby;
  });
  data.metadata = {
    ...data.metadata,
    source: sourceOverride ?? 'Overpass API + OpenAI + inferences',
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.buildings?.length ?? 0} buildings to ${DATA_PATH}`);
}

/** Optional: fetch web context (e.g. Stanford page) for inclusion in OpenAI prompt. */
const WEB_CONTEXT_URL = process.env.WEB_CONTEXT_URL || '';

async function fetchWebContext() {
  if (!WEB_CONTEXT_URL) return null;
  try {
    const res = await fetch(WEB_CONTEXT_URL, { headers: { 'User-Agent': 'StanfordCampusDataGenerator/1.0' } });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 8000).replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.warn('Web context fetch failed:', e.message);
    return null;
  }
}

async function main() {
  let data = loadExisting();
  const total = data.buildings?.length ?? 0;
  if (total === 0) {
    console.log('No buildings in JSON. Run without --enhance-only to fetch from Overpass first.');
    process.exit(1);
  }

  // --- Web-only enhancement for named locations (no Overpass, no AI) ---
  if (ENHANCE_WEB) {
    const named = data.buildings
      .map((b, i) => ({ building: b, index: i }))
      .filter(({ building }) => isNamedLocation(building));
    let toEnhance = named;
    if (ENHANCE_LIMIT) toEnhance = toEnhance.slice(0, ENHANCE_LIMIT);
    const totalNamed = named.length;
    const totalBatches = Math.ceil(toEnhance.length / SAVE_EVERY);
    console.log(`Web-enhance mode: ${total} buildings in JSON, ${totalNamed} named locations. Enhancing ${toEnhance.length} (no Overpass, no AI).\n`);
    for (let i = 0; i < toEnhance.length; i++) {
      const { building, index } = toEnhance[i];
      const batchIndex = Math.floor(i / SAVE_EVERY) + 1;
      const batchStart = (batchIndex - 1) * SAVE_EVERY + 1;
      const batchEnd = Math.min(batchIndex * SAVE_EVERY, toEnhance.length);
      process.stdout.write(`  Named location ${i + 1}/${toEnhance.length} (batch ${batchIndex}/${totalBatches}) — ${building.name} ... `);
      data.buildings[index] = await webEnhanceBuilding(building);
      console.log('ok');
      if ((i + 1) % SAVE_EVERY === 0) {
        saveData(data, 'Web enhancement (named locations only)');
        console.log(`  ✓ Batch ${batchIndex}/${totalBatches} complete (${batchStart}-${batchEnd} saved)\n`);
      }
    }
    saveData(data, 'Web enhancement (named locations only)');
    console.log(`Done. Web-enhanced ${toEnhance.length} named locations.`);
    return;
  }

  if (ENHANCE_ONLY) {
    console.log(`Enhance-only mode: using existing JSON (${total} buildings). No Overpass call.\n`);
  } else {
    console.log('Fetching all buildings from Overpass (Stanford bbox)...');
    const overpassJson = await overpassQueryAllBuildings();
    const overpassBuildings = normalizeOverpassAll(overpassJson);
    console.log(`Overpass: ${overpassBuildings.length} buildings`);

    console.log('Fetching Overpass amenities/entrances for inference...');
    const amenitiesJson = await overpassQueryAmenitiesAndEntrances();
    const amenities = normalizeOverpassAmenities(amenitiesJson);
    console.log(`Overpass amenities/entrances: ${amenities.length} features`);

    data = mergeOverpassIntoJson(data, overpassBuildings);
    attachOverpassNearby(data.buildings, amenities);
    console.log(`Merged: ${data.buildings.length} buildings in JSON (with Overpass tags and nearby features)`);

    if (OVERPASS_ONLY) {
      console.log('--overpass-only: skipping OpenAI. Run with --enhance-only to enhance existing entries.');
      saveData(data);
      return;
    }
  }

  const totalToEnhance = data.buildings.length;
  if (!OPENAI_API_KEY) {
    console.log('No OPENAI_API_KEY / EXPO_PUBLIC_OPENAI_API_KEY set. Writing merged data only.');
    saveData(data);
    return;
  }

  let webContext = null;
  if (WEB_CONTEXT_URL) {
    console.log('Fetching web context for OpenAI...');
    webContext = await fetchWebContext();
    if (webContext) console.log('Web context loaded.');
  }

  const toEnhance = ENHANCE_LIMIT ? Math.min(ENHANCE_LIMIT, totalToEnhance) : totalToEnhance;
  const totalBatches = Math.ceil(toEnhance / SAVE_EVERY);
  console.log('');
  if (ENHANCE_LIMIT) {
    console.log(`Enhancing first ${toEnhance} of ${totalToEnhance} entries (ENHANCE_LIMIT=${ENHANCE_LIMIT}) in ${totalBatches} batch(es).`);
  } else {
    console.log(`Enhancing all ${toEnhance} entries in ${totalBatches} batch(es) (saving every ${SAVE_EVERY} buildings).`);
  }
  console.log('');

  for (let i = 0; i < toEnhance; i++) {
    const batchIndex = Math.floor(i / SAVE_EVERY) + 1;
    const batchStart = (batchIndex - 1) * SAVE_EVERY + 1;
    const batchEnd = Math.min(batchIndex * SAVE_EVERY, toEnhance);
    process.stdout.write(`  Building ${i + 1}/${toEnhance} (batch ${batchIndex}/${totalBatches}) — ${data.buildings[i]?.name || '?'} ... `);

    data.buildings[i] = await openAIEnhanceBuilding(data.buildings[i], i, toEnhance, webContext);
    console.log('ok');
    await new Promise((r) => setTimeout(r, OPENAI_DELAY_MS));

    if ((i + 1) % SAVE_EVERY === 0) {
      saveData(data);
      console.log(`  ✓ Batch ${batchIndex}/${totalBatches} complete (buildings ${batchStart}-${batchEnd} saved)\n`);
    }
  }

  saveData(data);
  console.log(`Done. Enhanced ${toEnhance} buildings.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
