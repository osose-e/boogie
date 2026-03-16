#!/usr/bin/env node
/**
 * Removes incorrect building numbers from stanfordCampusData.json.
 * Building 160 = Wallenberg Hall only; 02-300 = Tresidder only; etc.
 * Other buildings (Mirrielees, Stock Farm Garage, etc.) get buildingNumber: null
 * and have "Building 160" / "Bldg 02-300" etc. removed from alternateNames.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_PATH = join(ROOT, 'src', 'data', 'stanfordCampusData.json');

// Official Stanford building numbers (from Campus Access Guide).
// Main Quad: 01-001 through 01-460; named buildings; Lane (07-308), etc.
const BUILDING_NUMBER_WHITELIST = {
  // Named buildings
  wallenberg: '01-160',
  'wallenberg hall': '01-160',
  'memorial church': '01-500',
  'memorial-church': '01-500',
  tresidder: '02-300',
  tresidder: '02-300',
  'tresidder memorial union': '02-300',
  'trèsidder memorial union': '02-300',
  gilbert: '07-420',
  'gilbert biological sciences': '07-420',
  'gilbert building': '07-420',
  gates: '07-450',
  'gates building': '07-450',
  'gates computer science': '07-450',
  bookstore: '02-010',
  'stanford university bookstore': '02-010',
  'stanford bookstore': '02-010',
  mclatchy: '01-120',
  'mclatchy hall': '01-120',
  'mcclatchy hall': '01-120',
  'lane building': '07-308',
  'lane hall': '07-308',
  'lane medical library': '07-308',
  'lane medical': '07-308',
  'e.d. stone lane': '07-308',
  'e.d. stone - lane building and lane medical library': '07-308',
  // Main Quad by number (Building 1 = 01-001, Building 120 = 01-120, etc.)
  'building 1': '01-001',
  'building 10': '01-010',
  'building 20': '01-020',
  'building 30': '01-030',
  'building 40': '01-040',
  'building 50': '01-050',
  'building 60': '01-060',
  'building 70': '01-070',
  'building 80': '01-080',
  'building 90': '01-090',
  'building 100': '01-100',
  'building 110': '01-110',
  'building 120': '01-120',
  'building 160': '01-160',
  'building 170': '01-170',
  'building 200': '01-200',
  'building 240': '01-240',
  'building 250': '01-250',
  'building 260': '01-260',
  'building 300': '01-300',
  'building 310': '01-310',
  'building 320': '01-320',
  'building 360': '01-360',
  'building 370': '01-370',
  'building 380': '01-380',
  'building 420': '01-420',
  'building 460': '01-460',
};

function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Remove alternate names that look like "Building 123" or "Bldg 02-300" (generic pattern)
function isWrongBuildingOrBldgAlias(name) {
  if (!name || typeof name !== 'string') return false;
  const n = name.trim();
  return /^Building\s+\d+$/i.test(n) || /^Bldg\s+[\d-]+$/i.test(n);
}

function getCorrectBuildingNumber(building) {
  const id = (building.id || '').toLowerCase().trim();
  const idSpaces = id.replace(/-/g, ' ');
  const name = normalize(building.name || '');
  return BUILDING_NUMBER_WHITELIST[id] ||
    BUILDING_NUMBER_WHITELIST[idSpaces] ||
    BUILDING_NUMBER_WHITELIST[name] ||
    Object.entries(BUILDING_NUMBER_WHITELIST).find(([key]) => name.includes(key) || idSpaces.includes(key) || id.includes(key.replace(/\s/g, '-')))?.[1];
}

function cleanAlternateNames(alternateNames, correctNumber) {
  let list = Array.isArray(alternateNames) ? alternateNames.filter((a) => a != null && String(a).trim()) : [];
  list = list.filter((a) => !isWrongBuildingOrBldgAlias(a));
  if (correctNumber) {
    const shortNum = correctNumber.replace(/^0\d-/, ''); // 01-120 -> 120, 07-308 -> 308
    if (!list.some((a) => /Building\s+\d+/i.test(a) || /Bldg\s+[\d-]+/i.test(a))) {
      list.push(`Bldg ${correctNumber}`);
      list.push(`Building ${shortNum}`);
    }
  }
  return list;
}

const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
let fixed = 0;
for (const building of data.buildings || []) {
  const correct = getCorrectBuildingNumber(building);
  if (correct) {
    building.buildingNumber = correct;
    building.alternateNames = cleanAlternateNames(building.alternateNames, correct);
    fixed++;
  } else {
    if (building.buildingNumber != null) {
      building.buildingNumber = null;
      fixed++;
    }
    if (Array.isArray(building.alternateNames)) {
      const before = building.alternateNames.length;
      building.alternateNames = building.alternateNames.filter((a) => !isWrongBuildingOrBldgAlias(a));
      if (building.alternateNames.length !== before) fixed++;
    }
    // If this building's name is "Building 160" (or similar) but it's not Wallenberg, rename to avoid confusion
    if (/^Building\s+\d+$/i.test(building.name) || /^Building\s+[\d-]+$/i.test(building.name)) {
      const alt = (building.alternateNames || []).find((a) => a && !isWrongBuildingOrBldgAlias(a));
      if (alt) {
        building.name = alt;
        building.alternateNames = (building.alternateNames || []).filter((a) => a !== alt);
        fixed++;
      }
    }
  }
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log(`Fixed building numbers and alternate names. Updated ${fixed} building entries.`);
console.log(`Building numbers set for: Wallenberg, Memorial Church, Tresidder, Gilbert, Gates, Bookstore, McLatchy Hall, Lane Building, and Main Quad Building 1–120, 160, 170, 200, 240–260, 300–320, 360–380, 420, 460.`);
