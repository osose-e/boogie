/**
 * Loads the editable Stanford campus JSON and resolves user input to a specific
 * building + entrance using landmarkKeywords, so we can pinpoint pickup/dropoff.
 */

// Metro/React Native can require JSON
let campusData = null;

function getCampusJson() {
  if (campusData) return campusData;
  try {
    campusData = require('../data/stanfordCampusData.json');
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
