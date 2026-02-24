/**
 * Campus context for the Boogie bot system prompt.
 * In-app we use a small inline hint (no campusContext.json) to avoid native crashes.
 * Overpass and STANFORD_LOCATIONS in boogieBotApi supply the rest.
 *
 * @returns {string} Short context for natural phrasing and landmarks
 */
export function getCampusContextForPrompt() {
  return [
    'Common phrasing: "CoDa" = Computing and Data Science (CoDa); people say "east entrance", "north entrance", "by the stairs", "at the bike racks", "near the Blend".',
    'Match landmarks and entrance directions to the known locations when resolving drop-off or pickup.',
  ].join(' ');
}