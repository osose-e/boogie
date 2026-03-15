/**
 * Loads the editable Stanford campus JSON and resolves user input to a specific
 * building + entrance using landmarkKeywords, so we can pinpoint pickup/dropoff.
 */

// Metro/React Native can require JSON
let campusData = null;

function getCampusJson() {
  if (campusData) return campusData;
  try {
    campusData = require('../data/stanfordCampusDataRevised.json');
    return campusData;
  } catch (e) {
    return null;
  }
}

/**
 * Search the campus JSON for a building and optional entrance matching user input.
 * Landmarks (bike racks, stairs, north entrance, etc.) map to a specific entrance.
 * Returns the same shape as overpassApi.searchCampusLocation for use in boogieBotApi.
 */
export function searchCampusFromJson(userInput) {
  const data = getCampusJson();
  if (!data?.buildings?.length) return null;

  const lower = (userInput || '').toLowerCase().trim();
  if (!lower) return null;

  const words = lower.split(/\s+/);
  let bestBuilding = null;
  let bestEntrance = null;
  let bestScore = 0;

  for (const building of data.buildings) {
    const nameMatch =
      building.name?.toLowerCase().includes(lower) ||
      lower.includes(building.name?.toLowerCase()) ||
      (building.alternateNames || []).some(
        (a) => a && (lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))
      );
    if (!nameMatch) continue;

    const buildingScore = 1;
    if (!building.entrances?.length) {
      if (buildingScore > bestScore) {
        bestScore = buildingScore;
        bestBuilding = building;
        bestEntrance = null;
      }
      continue;
    }

    for (const entrance of building.entrances) {
      let score = buildingScore;
      const kw = (entrance.landmarkKeywords || []).map((k) => k?.toLowerCase()).filter(Boolean);
      const dir = (entrance.direction || entrance.name || '').toLowerCase();
      const nameEnt = (entrance.name || '').toLowerCase();

      for (const word of words) {
        if (kw.some((k) => k.includes(word) || word.includes(k))) score += 2;
        if (dir && (word === dir || word.includes(dir) || dir.includes(word))) score += 2;
        if (nameEnt && nameEnt.includes(word)) score += 1;
      }
      if (entrance.landmarks) {
        if (entrance.landmarks.bikeRacks && (lower.includes('bike') || lower.includes('bicycle') || lower.includes('rack'))) score += 2;
        if (entrance.landmarks.stairs && (lower.includes('stair') || lower.includes('step'))) score += 2;
        if (entrance.landmarks.parkingLot && (lower.includes('parking') || lower.includes('lot'))) score += 2;
        if (entrance.landmarks.fountain && (lower.includes('fountain') || lower.includes('oval'))) score += 2;
        if ((entrance.landmarks.other || []).some((o) => lower.includes((o || '').toLowerCase()))) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestBuilding = building;
        bestEntrance = entrance;
      }
    }

    if (buildingScore > bestScore && !bestEntrance) {
      bestScore = buildingScore;
      bestBuilding = building;
      bestEntrance = building.entrances?.[0] || null;
    }
  }

  if (!bestBuilding) return null;

  const coords = bestEntrance?.coordinates || bestBuilding.coordinates;
  const entranceName = bestEntrance?.name || (bestEntrance?.direction ? `${bestEntrance.direction} entrance` : null);
  const landmarkHint = bestEntrance?.landmarks?.other?.[0] || (bestEntrance?.landmarks?.bikeRacks ? 'bike racks' : null) || (bestEntrance?.landmarks?.stairs ? 'stairs' : null);

  return {
    type: 'building',
    name: bestBuilding.name,
    address: bestBuilding.address || `${bestBuilding.name}, Stanford, CA 94305`,
    lat: coords?.lat ?? bestBuilding.coordinates?.lat,
    lon: coords?.lon ?? bestBuilding.coordinates?.lon,
    entranceHint: entranceName || null,
    landmarkHint: landmarkHint || null,
  };
}

/**
 * Whether the editable campus JSON is available (so the bot can prefer it).
 */
export function hasCampusJson() {
  return !!getCampusJson()?.buildings?.length;
}

/**
 * Return a list of known location names (building name + alternate names) for use in
 * extraction prompts (e.g. OpenAI). Used so we can extract "evgr a" from "I want to go to evgr a".
 * @param {number} [maxNames] - Optional cap to avoid huge prompts (default 300).
 * @returns {string[]}
 */
export function getLocationNamesForExtraction(maxNames = 300) {
  const data = getCampusJson();
  if (!data?.buildings?.length) return [];
  const names = new Set();
  for (const b of data.buildings) {
    if (b.name?.trim()) names.add(b.name.trim());
    (b.alternateNames || []).forEach((a) => a?.trim() && names.add(a.trim()));
  }
  const list = Array.from(names);
  return list.length <= maxNames ? list : list.slice(0, maxNames);
}

/**
 * Find a building in the JSON by name or alternate name (case-insensitive, partial match).
 */
export function findBuildingByName(buildingName) {
  const data = getCampusJson();
  if (!data?.buildings?.length || !buildingName) return null;
  const search = (buildingName || '').toLowerCase().trim();
  for (const b of data.buildings) {
    if (b.name?.toLowerCase().includes(search) || search.includes(b.name?.toLowerCase())) return b;
    if ((b.alternateNames || []).some((a) => a && (search.includes(a.toLowerCase()) || a.toLowerCase().includes(search)))) return b;
  }
  return null;
}

/**
 * Find a building by id (from campus JSON).
 */
export function findBuildingById(buildingId) {
  const data = getCampusJson();
  if (!data?.buildings?.length || !buildingId) return null;
  const id = (buildingId || '').toLowerCase().trim();
  return data.buildings.find((b) => (b.id || '').toLowerCase() === id) || null;
}

/**
 * Resolve trip request slot (pickup or dropoff) to a display location shape used by the app.
 * Input: { buildingId?, buildingName?, entranceId?, entranceName?, isCurrentLocation? }
 * Output: { displayText, displayName, coordinates?, entranceHint?, landmarkHint? } or null.
 */
export function resolveTripSlotToLocation(slot, options = {}) {
  if (!slot) return null;
  const { isCurrentLocation } = slot;
  if (isCurrentLocation && options.currentLocation) {
    const loc = options.currentLocation;
    return {
      displayText: loc.displayName || 'Current location',
      displayName: loc.displayName || 'Current location',
      coordinates: loc.latitude != null && loc.longitude != null ? { latitude: loc.latitude, longitude: loc.longitude } : null,
      entranceHint: null,
      landmarkHint: null,
    };
  }
  if (isCurrentLocation) {
    return options.defaultPickupLocation ? {
      displayText: options.defaultPickupLocation.displayText,
      displayName: options.defaultPickupLocation.displayName,
      coordinates: options.defaultPickupLocation.coordinates || null,
      entranceHint: null,
      landmarkHint: null,
    } : null;
  }
  const buildingId = slot.buildingId || null;
  const buildingName = slot.buildingName || null;
  const entranceId = slot.entranceId || null;
  const entranceName = slot.entranceName || null;
  const data = getCampusJson();
  if (!data?.buildings?.length) return null;

  let building = null;
  if (buildingId) building = findBuildingById(buildingId);
  if (!building && buildingName) building = findBuildingByName(buildingName);
  if (!building) return null;

  let entrance = null;
  if (entranceId && building.entrances?.length) {
    entrance = building.entrances.find((e) => (e.id || '').toLowerCase() === (entranceId || '').toLowerCase());
  }
  if (!entrance && (entranceName || entranceId) && building.entrances?.length) {
    const search = (entranceName || entranceId || '').toLowerCase();
    entrance = building.entrances.find(
      (e) =>
        (e.name || '').toLowerCase().includes(search) ||
        (e.direction || '').toLowerCase().includes(search) ||
        (e.id || '').toLowerCase().includes(search)
    ) || building.entrances[0];
  }
  if (!entrance && building.entrances?.length) entrance = building.entrances[0];

  const coords = entrance?.coordinates || building.coordinates;
  const entranceNameResolved = entrance?.name || (entrance?.direction ? `${entrance.direction} entrance` : null);
  const landmarkHint = entrance?.landmarks?.other?.[0] || (entrance?.landmarks?.bikeRacks ? 'bike racks' : null) || (entrance?.landmarks?.stairs ? 'stairs' : null);

  return {
    displayText: building.address || `${building.name}, Stanford, CA 94305`,
    displayName: building.name,
    coordinates: coords ? { latitude: coords.lat, longitude: coords.lon } : null,
    entranceHint: entranceNameResolved || null,
    landmarkHint: landmarkHint || null,
  };
}

/**
 * Build a condensed campus summary for the AI: buildings with id, name, alternateNames, address,
 * and entrances with id, name, direction, landmarkKeywords. Used so the AI can deduce location
 * and entrance from natural language without pre-cleaning.
 * @returns {string} JSON string of { buildings: [...] } for inclusion in the prompt
 */
export function getCampusDataSummaryForPrompt() {
  const data = getCampusJson();
  if (!data?.buildings?.length) return '[]';
  const buildings = data.buildings.map((b) => ({
    id: b.id,
    name: b.name,
    alternateNames: b.alternateNames || [],
    address: b.address,
    entrances: (b.entrances || []).map((e) => ({
      id: e.id,
      name: e.name,
      direction: e.direction,
      landmarkKeywords: e.landmarkKeywords || [],
      roadSidewalk: e.roadSidewalk,
      notes: e.notes,
    })),
  }));
  return JSON.stringify({ buildings }, null, 0).slice(0, 12000);
}

/**
 * Get digestible descriptions of entrances for a building (for bot prompts).
 * Returns a short string like "east (facing MemAud), west (Main Quad), or near Littlefield and MemAud parking"
 * or null if building not found / no entrances.
 */
export function getEntranceDescriptionsForBuilding(buildingName) {
  const building = findBuildingByName(buildingName);
  if (!building?.entrances?.length) return null;
  const parts = building.entrances.map((e) => {
    const name = e.name || (e.direction ? `${e.direction} entrance` : null);
    const hints = [];
    if (e.landmarks?.other?.length) hints.push(e.landmarks.other[0]);
    else if (e.landmarks?.bikeRacks) hints.push('bike racks');
    else if (e.landmarks?.stairs) hints.push('stairs');
    else if (e.landmarks?.parkingLot) hints.push('parking');
    if (e.roadSidewalk) hints.push(e.roadSidewalk);
    if (e.acrossFromBuilding) hints.push(`facing ${e.acrossFromBuilding}`);
    if (e.nextToBuilding) hints.push(`near ${e.nextToBuilding}`);
    const hint = hints.length ? ` (${hints.slice(0, 2).join(', ')})` : '';
    return name ? `${name}${hint}` : hint ? hint.slice(2, -1) : null;
  }).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ', or ' + parts[parts.length - 1];
}
