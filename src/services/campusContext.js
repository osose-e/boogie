/**
 * Campus context for the Boogie bot: buildings, entrances, landmarks (parking, bike racks,
 * nearby establishments) so the digital dispatcher can resolve specific entrances for drivers.
 * Loaded lazily with limits to avoid parsing a very large JSON at once (can cause native crashes).
 */

let cachedContext = null;

/**
 * @returns {string} Formatted campus context for the LLM prompt
 */
export function getCampusContextForPrompt() {
  if (cachedContext !== null) return cachedContext;

  let campusContextData;
  try {
    campusContextData = require('../data/campusContext.json');
  } catch (e) {
    console.warn('campusContext: could not load JSON', e?.message);
    cachedContext = '';
    return '';
  }

  const buildings = (campusContextData.buildings || []).slice(0, 50);
  const humanAdditions = (campusContextData.humanAdditions || []).slice(0, 15);
  const amenities = (campusContextData.amenities || []).slice(0, 25);
  const landmarkContext = campusContextData.landmarkContext || {};

  const lines = [];

  if (landmarkContext.bikeRacks || landmarkContext.parkingLots || landmarkContext.establishments) {
    lines.push('Key landmarks for finding riders: bike racks, parking lots, nearby establishments:');
    if (landmarkContext.bikeRacks) lines.push(`- Bike racks: ${landmarkContext.bikeRacks}`);
    if (landmarkContext.parkingLots) lines.push(`- Parking lots: ${landmarkContext.parkingLots}`);
    if (landmarkContext.establishments) lines.push(`- Nearby establishments: ${landmarkContext.establishments}`);
    lines.push('');
  }

  if (buildings.length > 0) {
    lines.push('Buildings with entrances and landmarks (use to match user descriptions):');
    for (const b of buildings) {
      const aliasStr = Array.isArray(b.alternateNames) && b.alternateNames.length > 0
        ? ` (aka ${b.alternateNames.join(', ')})`
        : '';
      const parts = [`- ${b.name}${aliasStr}${b.address ? ` — ${b.address}` : ''}`];
      if (Array.isArray(b.entrances) && b.entrances.length > 0) {
        parts.push(`  Entrances: ${b.entrances.join(', ')}`);
      }
      if (Array.isArray(b.landmarks) && b.landmarks.length > 0) {
        parts.push(`  Landmarks: ${b.landmarks.join(', ')}`);
      }
      if (b.bikeRacks) parts.push(`  Bike racks: ${typeof b.bikeRacks === 'string' ? b.bikeRacks : 'yes'}`);
      if (b.parkingLot) parts.push(`  Parking: ${typeof b.parkingLot === 'string' ? b.parkingLot : 'yes'}`);
      if (Array.isArray(b.establishments) && b.establishments.length > 0) {
        parts.push(`  Inside/nearby: ${b.establishments.join(', ')}`);
      }
      if (b.notes && b.notes.trim()) {
        parts.push(`  Notes: ${b.notes.trim()}`);
      }
      lines.push(parts.join('\n'));
    }
  }

  if (Array.isArray(humanAdditions) && humanAdditions.length > 0) {
    lines.push('\nAdditional context:');
    for (const h of humanAdditions) {
      const parts = [];
      if (h.buildingOrArea) parts.push(h.buildingOrArea);
      if (h.entrances?.length) parts.push(`entrances: ${h.entrances.join(', ')}`);
      if (h.landmarks?.length) parts.push(`landmarks: ${h.landmarks.join(', ')}`);
      if (h.notes) parts.push(h.notes);
      if (parts.length) lines.push(`- ${parts.join('; ')}`);
    }
  }

  if (amenities.length > 0) {
    lines.push('\nAmenities in area: ' + amenities.join(', '));
  }

  cachedContext = lines.length ? lines.join('\n') : '';
  return cachedContext;
}
