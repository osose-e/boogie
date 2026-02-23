#!/usr/bin/env node
/**
 * One-time script: fetch Stanford campus data from Overpass API and write
 * src/data/campusContext.json. Edit that file to add human-generated context
 * (entrances, landmarks, notes). The Boogie bot uses this JSON instead of
 * calling Overpass at runtime.
 *
 * Run from project root: node scripts/generateCampusContext.js
 */

const fs = require('fs');
const path = require('path');

const STANFORD_BBOX = { south: 37.42, west: -122.18, north: 37.44, east: -122.14 };
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const STANFORD_LOCATIONS = [
  { name: 'Computing and Data Science (CoDa)', address: '385 Serra St., Stanford, CA 94305', fullAddress: 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305' },
  { name: 'Wallenberg Hall', address: '450 Serra Mall, Stanford, CA 94305', fullAddress: 'Wallenberg Hall, 450 Serra Mall, Stanford, CA 94305' },
  { name: 'McLatchy Hall', address: '450 Serra Mall, Stanford, CA 94305', fullAddress: 'McLatchy Hall, 450 Serra Mall, Stanford, CA 94305' },
  { name: 'Stanford Oval', address: 'Stanford Oval, Stanford, CA 94305', fullAddress: 'Stanford Oval, Stanford, CA 94305' },
  { name: 'Memorial Church', address: '450 Serra Mall, Stanford, CA 94305', fullAddress: 'Memorial Church, 450 Serra Mall, Stanford, CA 94305' },
  { name: 'Memorial Court', address: 'Memorial Court, Stanford, CA 94305', fullAddress: 'Memorial Court, Stanford, CA 94305' },
];

function buildQuery() {
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

function findAddressForBuilding(name) {
  const n = (name || '').toLowerCase();
  const found = STANFORD_LOCATIONS.find(
    (loc) => loc.name.toLowerCase().includes(n) || n.includes(loc.name.toLowerCase().split(' ')[0])
  );
  return found ? found.fullAddress : null;
}

async function main() {
  const outPath = path.join(__dirname, '..', 'src', 'data', 'campusContext.json');

  const buildingsFromApi = new Map(); // name -> true
  let amenities = [];

  try {
    const query = buildQuery();
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.warn('Overpass request failed:', res.status);
    } else {
      const json = await res.json();
      const elements = json.elements || [];
      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name;
        if (el.type === 'way' && tags.building && name) {
          buildingsFromApi.set(name, true);
        }
        if (el.type === 'node' && tags.amenity) {
          amenities.push(name || tags.amenity);
        }
      }
    }
  } catch (e) {
    console.warn('Overpass error:', e);
  }

  const buildingNames = [...buildingsFromApi.keys()].sort();
  const buildings = [];

  for (const name of STANFORD_LOCATIONS.map((l) => l.name)) {
    buildings.push({
      name,
      address: findAddressForBuilding(name) || '',
      entrances: [],
      landmarks: [],
      notes: '',
    });
  }

  for (const name of buildingNames) {
    if (buildings.some((b) => b.name === name)) continue;
    buildings.push({
      name,
      address: findAddressForBuilding(name) || '',
      entrances: [],
      landmarks: [],
      notes: '',
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: 'One-time Overpass export. Edit entrances, landmarks, and notes to add human context for the Boogie bot.',
    buildings,
    amenities: [...new Set(amenities)].filter(Boolean).slice(0, 50),
    humanAdditions: [],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('Wrote', outPath);
  console.log('Edit that file to add entrances, landmarks, and notes for each building.');
}

main();
