// export const STANFORD_LOCATIONS = [
//   {
//     id: '1',
//     name: 'Computing and Data Science (CoDa)',
//     address: '385 Serra St., Stanford, CA 94305',
//     fullAddress: 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
//   },
//   {
//     id: '2',
//     name: 'Wallenberg Hall',
//     address: '450 Serra Mall, Stanford, CA 94305',
//     fullAddress: 'Wallenberg Hall, 450 Serra Mall, Stanford, CA 94305',
//   },
//   {
//     id: '3',
//     name: 'McLatchy Hall',
//     address: '450 Serra Mall, Stanford, CA 94305',
//     fullAddress: 'McLatchy Hall, 450 Serra Mall, Stanford, CA 94305',
//   },
//   {
//     id: '4',
//     name: 'Stanford Oval',
//     address: 'Stanford Oval, Stanford, CA 94305',
//     fullAddress: 'Stanford Oval, Stanford, CA 94305',
//   },
//   {
//     id: '5',
//     name: 'Memorial Church',
//     address: '450 Serra Mall, Stanford, CA 94305',
//     fullAddress: 'Memorial Church, 450 Serra Mall, Stanford, CA 94305',
//   },
//   {
//     id: '6',
//     name: 'Memorial Court',
//     address: 'Memorial Court, Stanford, CA 94305',
//     fullAddress: 'Memorial Court, Stanford, CA 94305',
//   },
// ];

// export const DEFAULT_PICKUP_LOCATION = {
//   address: '518 Memorial Way, Stanford, CA 94305',
//   fullAddress: '518 Memorial Way, Stanford, CA 94305',
//   displayName: '📍Current Location',
//   coordinates: {
//     latitude: 37.4275,
//     longitude: -122.1697,
//   },
// };

// // Format: "📍Current Location (latitude, longitude)"
// DEFAULT_PICKUP_LOCATION.displayText = `${DEFAULT_PICKUP_LOCATION.displayName} (${DEFAULT_PICKUP_LOCATION.coordinates.latitude}, ${DEFAULT_PICKUP_LOCATION.coordinates.longitude})`;
// src/constants/stanfordLocations.js
// Adapter layer: take data/stanfordCampusData.json and expose a UI-friendly list.

import campusData from '../data/stanfordCampusDataRevised.json';

/**
 * Normalizes strings for search (lowercase, collapse whitespace).
 */
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\uFFFC/g, '') // object replacement char (dictation weirdness)
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Build a single “search blob” for each building that includes:
 * - name
 * - alternateNames
 * - entrance names
 * - landmarkKeywords (per entrance)
 * - address (optional but helpful)
 */
const buildSearchBlob = (b) => {
  const alt = (b.alternateNames || []).join(' ');
  const entranceNames = (b.entrances || []).map(e => e.name).join(' ');
  const landmarkKeywords = (b.entrances || [])
    .flatMap(e => e.landmarkKeywords || [])
    .join(' ');

  const blob = `${b.name} ${alt} ${b.address || ''} ${entranceNames} ${landmarkKeywords}`;
  return norm(blob);
};

/**
 * This is what SearchScreen should render.
 * Keep it building-level so tapping -> EntranceSelect.
 */
export const STANFORD_LOCATIONS = (campusData.buildings || []).map((b) => ({
  id: b.id,
  name: b.name,
  address: b.address || null,
  coordinates: b.coordinates || null,

  // pass-through full building so you can navigate without re-looking it up
  building: b,

  // for search
  searchBlob: buildSearchBlob(b),
}));

/**
 * If you want a default pickup location, pick the first building or a known id.
 */
// export const DEFAULT_PICKUP_LOCATION =
//   STANFORD_LOCATIONS.find((x) => x.id === 'tresidder') || STANFORD_LOCATIONS[0] || null;
export const DEFAULT_PICKUP_LOCATION = {
  id: 'current',
  displayText: 'Current location',
};