/**
 * Loads human-editable campus context from src/data/campusContext.json
 * and formats it for the Boogie bot system prompt. No Overpass calls at runtime.
 */

import campusContextData from '../data/campusContext.json';

/**
 * @returns {string} Formatted campus context for the LLM prompt
 */
export function getCampusContextForPrompt() {
  const buildings = campusContextData.buildings || [];
  const humanAdditions = campusContextData.humanAdditions || [];
  const amenities = campusContextData.amenities || [];
  const landmarkContext = campusContextData.landmarkContext || {};

  const lines = [];

  if (landmarkContext.bikeRacks || landmarkContext.parkingLots || landmarkContext.establishments) {
    lines.push('Key landmarks (bike racks, parking, nearby establishments):');
    if (landmarkContext.bikeRacks) lines.push(`- Bike racks: ${landmarkContext.bikeRacks}`);
    if (landmarkContext.parkingLots) lines.push(`- Parking lots: ${landmarkContext.parkingLots}`);
    if (landmarkContext.establishments) lines.push(`- Nearby establishments: ${landmarkContext.establishments}`);
    lines.push('');
  }

  if (buildings.length > 0) {
    lines.push('Buildings and locations (with human-added entrances and landmarks):');
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
    lines.push('\nAdditional human context:');
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
    lines.push('\nAmenities in area: ' + amenities.slice(0, 30).join(', '));
  }

  return lines.length ? lines.join('\n') : '';
}
