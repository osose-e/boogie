/**
 * Boogie bot conversation API: resolves pickup and dropoff from natural language
 * using Stanford campus data. Uses an in-memory trip request object (pickup + entrance,
 * dropoff + entrance) that the AI fills iteratively from the conversation. Campus data
 * is passed to the AI so it can deduce location and entrance without pre-cleaning.
 */

import { fetchStanfordCampusData, searchCampusLocation } from './overpassApi';
import {
  searchCampusFromJson,
  getEntranceDescriptionsForBuilding,
  getLocationNamesForExtraction,
  getCampusDataSummaryForPrompt,
  resolveTripSlotToLocation,
  findBuildingById,
  findBuildingByName,
} from './campusDataLoader';
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

/** Default trip request shape: pickup and dropoff each have building + entrance. */
const EMPTY_SLOT = {
  buildingId: null,
  buildingName: null,
  entranceId: null,
  entranceName: null,
};
const EMPTY_PICKUP = { ...EMPTY_SLOT, isCurrentLocation: false };

/**
 * @returns Initial trip request object (pickup + dropoff slots, no pre-cleaning).
 */
export function getInitialTripRequest() {
  return {
    pickup: { ...EMPTY_PICKUP },
    dropoff: { ...EMPTY_SLOT },
  };
}

/**
 * Build a trip request from navigation context when user comes from Search/EntranceSelect.
 * Fills pickup and/or dropoff with building (+ entrance when available) so the chat starts pre-filled.
 *
 * @param {Object} structuredContext - From route.params when navigating to VoiceInput (e.g. from EntranceSelectScreen).
 *   - mode: 'pickup' | 'dropoff'
 *   - buildingId, buildingName: current screen's building (pickup building if mode is pickup, dropoff if mode is dropoff)
 *   - pickup: { buildingId, buildingName, entranceId?, entranceName? } when mode is 'dropoff' (from rideDraft)
 * @returns {Object} tripRequest in the same shape as getInitialTripRequest().
 */
export function tripRequestFromStructuredContext(structuredContext) {
  const base = getInitialTripRequest();
  if (!structuredContext || typeof structuredContext !== 'object') return base;

  const mode = structuredContext.mode;
  const buildingId = structuredContext.buildingId ?? null;
  const buildingName = structuredContext.buildingName ?? null;
  const pickupFromCtx = structuredContext.pickup;

  if (mode === 'pickup') {
    // User is on EntranceSelect for pickup: they already chose the pickup building (current screen), no entrance yet.
    base.pickup = {
      buildingId,
      buildingName,
      entranceId: null,
      entranceName: null,
      isCurrentLocation: false,
    };
    return base;
  }

  if (mode === 'dropoff') {
    // User is on EntranceSelect for dropoff: we have pickup from rideDraft and dropoff building (current screen), no dropoff entrance yet.
    if (pickupFromCtx && typeof pickupFromCtx === 'object') {
      base.pickup = {
        buildingId: pickupFromCtx.buildingId ?? null,
        buildingName: pickupFromCtx.buildingName ?? null,
        entranceId: pickupFromCtx.entranceId ?? null,
        entranceName: pickupFromCtx.entranceName ?? null,
        isCurrentLocation: false,
      };
    }
    base.dropoff = {
      buildingId,
      buildingName,
      entranceId: null,
      entranceName: null,
    };
    return base;
  }

  return base;
}

/**
 * True when the trip request has both pickup and dropoff filled so the user can continue to ride confirmation.
 * Pickup: isCurrentLocation OR (building set AND entrance set when building has entrances).
 * Dropoff: building set AND entrance set when building has entrances.
 * Used to disable the "Continue to ride confirmation" button when e.g. user came from search with only a building (no entrance).
 */
export function isTripRequestFilled(tripRequest) {
  if (!tripRequest || typeof tripRequest !== 'object') return false;
  const pickup = tripRequest.pickup;
  const dropoff = tripRequest.dropoff;
  if (!pickup || !dropoff) return false;

  const hasBuilding = (slot) => !!(slot && (slot.buildingId || slot.buildingName));
  const hasEntrance = (slot) => !!(slot && (slot.entranceId || slot.entranceName));
  const buildingHasEntrances = (slot) => {
    if (!slot) return false;
    const b = slot.buildingId ? findBuildingById(slot.buildingId) : findBuildingByName(slot.buildingName);
    return b && Array.isArray(b.entrances) && b.entrances.length > 0;
  };

  const pickupFilled =
    pickup.isCurrentLocation === true ||
    (hasBuilding(pickup) && (!buildingHasEntrances(pickup) || hasEntrance(pickup)));
  const dropoffFilled =
    hasBuilding(dropoff) && (!buildingHasEntrances(dropoff) || hasEntrance(dropoff));

  return pickupFilled && dropoffFilled;
}

/** Extract text between ** for highlights. */
function extractHighlights(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/\*\*([^*]+)\*\*/g);
  return matches ? matches.map((m) => m.replace(/\*\*/g, '').trim()).filter(Boolean) : [];
}

const TRIP_JSON_MARKER = 'TRIP_REQUEST_JSON';

/**
 * Parse AI response: natural reply first, then optional TRIP_REQUEST_JSON {...}.
 * @returns {{ botMessage: string, tripRequest: object | null }}
 */
function parseBotResponseWithTrip(content) {
  const raw = (content || '').trim();
  const idx = raw.indexOf(TRIP_JSON_MARKER);
  let botMessage = raw;
  let tripRequest = null;
  if (idx !== -1) {
    botMessage = raw.slice(0, idx).trim();
    const after = raw.slice(idx + TRIP_JSON_MARKER.length).trim();
    const jsonStart = after.search(/\{/);
    if (jsonStart !== -1) {
      let depth = 0;
      let end = -1;
      for (let i = jsonStart; i < after.length; i++) {
        if (after[i] === '{') depth++;
        else if (after[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      if (end !== -1) {
        try {
          tripRequest = JSON.parse(after.slice(jsonStart, end));
        } catch (_) {}
      }
    }
  }
  return { botMessage, tripRequest };
}

/**
 * Single OpenAI call: conversation + campus data + current tripRequest → natural reply + updated tripRequest.
 * The AI deduces location and entrance from the user's message and fills the trip request object.
 */
async function processTurnWithTripRequest(tripRequest, conversationHistory, userMessage, options) {
  const apiKey = options?.openAiApiKey;
  const currentLocation = options?.currentLocation ?? null;
  if (!apiKey) return null;

  const campusSummary = getCampusDataSummaryForPrompt();
  const currentTripStr = JSON.stringify(tripRequest);

  const systemContent = `You are BoogieBot, a friendly assistant for the DisGo ride app at Stanford. You help users set their pickup and dropoff on campus.

You have an in-memory "trip request" that you update from the conversation. The user may say anything: "pick me up at CoDa north entrance and drop me at Tresidder by the bike racks", or give pickup and dropoff in separate messages, or correct one part. Deduce what they mean and update the trip request accordingly.

CRITICAL—extract multiple fields from one message: A single user message often contains several pieces of info. Fill every trip request field you can infer from that message in one go. Examples:
- "I want to go to CoDa at the entrance near the Oval" → set dropoff building (CoDa) AND dropoff entrance (the entrance that matches "Oval" or "east" in the campus data for CoDa) in the same turn.
- "Pick me up at Tresidder by the bike racks" → set pickup building (Tresidder) AND pickup entrance (the entrance with bike racks in the data) together. Make sure to clarify the entrance with more landmark descriptors if multiple entrances share the same landmark.
- "Drop me at Wallenberg, main entrance" → set dropoff building (Wallenberg) AND dropoff entrance (main) together.
- "CoDa north entrance for pickup and Tresidder east for dropoff" → fill pickup building + pickup entrance + dropoff building + dropoff entrance in one update.
Use the campus data to match phrases like "near the Oval", "by the bike racks", "main entrance", "north entrance" to the correct building id and entrance id. Do not ask for the entrance in your reply if you could already infer it from the same message.

Use this Stanford campus data to resolve building and entrance names and IDs. Match the user's words (e.g. "north entrance", "by the bike racks", "CoDa", "Tresidder", "near the Oval", "main") to the correct building id and entrance id from the data.

CRITICAL—ask for entrance when missing: Both pickup and dropoff must include an entrance when the building has multiple entrances in the campus data. If the user names only a building (e.g. "drop me at Tresidder" or "pickup at CoDa") and you set buildingId/buildingName but entranceId/entranceName are still null, you MUST ask which entrance they want. For example: "Got it, dropoff at **Tresidder**. Which entrance? We have the east entrance (White Plaza), the west entrance near parking, or you can say by the bike racks, near the stairs, etc." Do the same for pickup when pickup has a building but no entrance yet. Only say "Tap Continue to ride confirmation" when both pickup and dropoff have building and entrance (or the building has only one entrance).

Campus data (buildings with id, name, alternateNames, address, entrances with id, name, direction, landmarkKeywords):
${campusSummary}

Current trip request (update this from the user's message):
${currentTripStr}

Rules:
- You MUST write your reply to the user FIRST (1-3 sentences). Do not put ${TRIP_JSON_MARKER} before your reply—the user only sees the text that comes before that marker. So always start with a friendly message (e.g. "I've got pickup at **CoDa** at the north entrance and dropoff at **Tresidder**. Say when you're ready to continue."), then put the JSON block after.
- Reply in first person as BoogieBot. Be warm and concise. Use **bold** only for building or place names. Do not mention coordinates or raw addresses. Do not say "here is the updated trip request" or similar—instead confirm the actual locations in plain language.
- If the user says "here", "current location", or "my location" for pickup, set pickup.isCurrentLocation to true and leave pickup.buildingId/buildingName null.
- After your reply, on a new line write exactly: ${TRIP_JSON_MARKER}
Then on the next line output a single JSON object with keys "pickup" and "dropoff". Each is an object with: buildingId (string or null), buildingName (string or null), entranceId (string or null), entranceName (string or null). For pickup only, include isCurrentLocation (boolean).
Example format (reply first, then marker and JSON):
I've set your pickup at **CoDa** at the **north entrance** and dropoff at **Tresidder** at the east entrance. Tap "Continue to ride confirmation" when you're ready.

${TRIP_JSON_MARKER}
{"pickup":{"buildingId":"coda","buildingName":"Computing and Data Science","entranceId":"north-1","entranceName":"North entrance","isCurrentLocation":false},"dropoff":{"buildingId":"tresidder","buildingName":"Tresidder Memorial Union","entranceId":"east-1","entranceName":"East entrance (White Plaza)"}}
- Use building id and entrance id from the campus data when you match (e.g. "coda", "north-1"). Keep buildingName/entranceName human-readable.
- From each user message, fill every trip field you can infer (building + entrance for pickup and/or dropoff). Only leave a field null if the user did not provide enough info for it in this or earlier messages. Preserve existing resolved fields only when the user did not mention that part.
- When dropoff has a building (buildingId/buildingName set) but entranceId/entranceName are null and the user did not describe an entrance in their message, your reply must ask which entrance at that building for dropoff. When pickup has a building but no entrance and they didn't describe one, ask which entrance for pickup. Use the campus data to list or suggest entrances (e.g. north entrance, east entrance, by the bike racks). If the user did describe an entrance in the same message (e.g. "at the entrance near the Oval"), match it from the campus data and fill it—do not ask again.`;

  const messages = [
    { role: 'system', content: systemContent },
    ...conversationHistory.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || '';
  const { botMessage, tripRequest: updatedTripRequest } = parseBotResponseWithTrip(content);

  const normalizedTrip = normalizeTripRequest(updatedTripRequest || tripRequest);
  console.log('[BoogieBot] trip request updated (AI turn):', JSON.stringify(normalizedTrip, null, 2));
  const defaultPickup = {
    displayText: DEFAULT_PICKUP_LOCATION.displayText,
    displayName: DEFAULT_PICKUP_LOCATION.displayName,
    coordinates: DEFAULT_PICKUP_LOCATION.coordinates,
  };
  const resolvedPickup = resolveTripSlotToLocation(normalizedTrip.pickup, {
    currentLocation: currentLocation ?? undefined,
    defaultPickupLocation: defaultPickup,
  });
  const resolvedDropoff = resolveTripSlotToLocation(normalizedTrip.dropoff, {});

  const displayMessage =
    (botMessage && botMessage.trim()) || "I've updated your trip. Tell me your pickup or dropoff if you'd like to change anything.";
  return {
    botMessage: displayMessage,
    highlights: extractHighlights(displayMessage),
    state: {
      tripRequest: normalizedTrip,
      resolvedPickup,
      resolvedDropoff,
      phase: resolvedPickup && resolvedDropoff ? 'done' : 'gathering',
    },
  };
}

/** Ensure trip request has required keys and slot shapes. */
function normalizeTripRequest(tr) {
  if (!tr || typeof tr !== 'object') return getInitialTripRequest();
  const pickup = tr.pickup && typeof tr.pickup === 'object'
    ? {
        buildingId: tr.pickup.buildingId ?? null,
        buildingName: tr.pickup.buildingName ?? null,
        entranceId: tr.pickup.entranceId ?? null,
        entranceName: tr.pickup.entranceName ?? null,
        isCurrentLocation: !!tr.pickup.isCurrentLocation,
      }
    : { ...EMPTY_PICKUP };
  const dropoff = tr.dropoff && typeof tr.dropoff === 'object'
    ? {
        buildingId: tr.dropoff.buildingId ?? null,
        buildingName: tr.dropoff.buildingName ?? null,
        entranceId: tr.dropoff.entranceId ?? null,
        entranceName: tr.dropoff.entranceName ?? null,
      }
    : { ...EMPTY_SLOT };
  return { pickup, dropoff };
}

/**
 * Use OpenAI to extract the Stanford location/building phrase from a sentence
 * (e.g. "I want to go to evgr a" → "evgr a"). Falls back to original input if no API key or on error.
 * @param {string} userMessage - Raw user input
 * @param {string} [apiKey] - OpenAI API key (optional)
 * @param {string[]} [locationNames] - Known building/place names for reference (optional)
 * @returns {Promise<string>} - Extracted phrase to use for resolveLocation, or original trimmed message
 */
async function extractLocationFromMessage(userMessage, apiKey, locationNames = []) {
  const trimmed = (userMessage || '').trim();
  if (!trimmed || !apiKey) return trimmed;
  const names = locationNames.length ? locationNames : getLocationNamesForExtraction();
  const nameList = names.slice(0, 150).join(', ');
  const systemContent = `You extract the Stanford campus location from the user's message. Reply with ONLY the place/building name or phrase they mean—nothing else. No punctuation, no "the", no full sentence. Use a known name from the list if it matches, or the user's exact phrase (e.g. "evgr a", "EVGR A"). Known locations (partial): ${nameList}.`;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: trimmed },
        ],
        max_tokens: 30,
        temperature: 0,
      }),
    });
    if (!res.ok) return trimmed;
    const data = await res.json();
    const extracted = data?.choices?.[0]?.message?.content?.trim() || '';
    return extracted || trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Call OpenAI to generate a natural bot reply.
 * @param {{ phase: string, resolvedPickup: object|null, resolvedDropoff: object|null, awaitingEntrance?: string|null, pendingBuildingName?: string|null, currentLocation: object|null, entranceDescriptions?: string|null }} context
 * @param {{ role: 'user'|'assistant', content: string }[]} conversationHistory
 * @param {string} userMessage
 * @param {string} apiKey
 * @returns {Promise<{ botMessage: string, highlights: string[] }>}
 */
async function generateBotReplyWithOpenAI(context, conversationHistory, userMessage, apiKey) {
  const {
    phase,
    resolvedPickup,
    resolvedDropoff,
    awaitingEntrance,
    pendingBuildingName,
    currentLocation,
  } = context;

  const currentLocationStr = currentLocation
    ? (currentLocation.displayName ||
        `Current location (${currentLocation.latitude?.toFixed(5)}, ${currentLocation.longitude?.toFixed(5)})`)
    : 'Not provided';

  const pickupStr = resolvedPickup ? resolvedPickup.displayName || resolvedPickup.displayText : 'Not set';
  const dropoffStr = resolvedDropoff ? resolvedDropoff.displayName || resolvedDropoff.displayText : 'Not set';
  const pickupEntrance = resolvedPickup?.entranceHint || null;
  const pickupLandmark = resolvedPickup?.landmarkHint || null;
  const dropoffEntrance = resolvedDropoff?.entranceHint || null;
  const dropoffLandmark = resolvedDropoff?.landmarkHint || null;

  const entranceDescriptions = context.entranceDescriptions || null;
  const entrancePrompt =
    awaitingEntrance && pendingBuildingName
      ? entranceDescriptions
        ? `You are asking which entrance at ${pendingBuildingName}. Use our listed options (digestible): ${entranceDescriptions}. Invite the user to pick one of these or describe in their own words.`
        : `You are currently asking which entrance at ${pendingBuildingName}. Ask for the entrance (e.g. north entrance, by the bike racks, near the stairs, or main).`
      : '';

  const systemContent = `You are BoogieBot, a friendly assistant for the DisGo ride app at Stanford. You help users set their pickup and dropoff on campus. Be warm and concise (1-3 sentences). Use **bold** only for building or place names. Do not mention coordinates or raw addresses in the reply.

CRITICAL: When the user has just given a location or entrance (e.g. "north entrance", "by the bike racks"), your reply MUST:
1. Reflect their words back so they know they were heard (e.g. "You said north entrance" or "I heard by the bike racks").
2. Confirm the inferred entrance/landmark clearly (e.g. "I've got pickup at **CoDa** at the **north entrance** near **bike racks**").
This makes it clear we matched their descriptor to the best entrance.

Current context:
- Phase: ${phase}
- User's current location: ${currentLocationStr}
- Resolved pickup: ${pickupStr}${pickupEntrance ? ` (entrance: ${pickupEntrance}${pickupLandmark ? `, landmark: ${pickupLandmark}` : ''})` : ''}
- Resolved dropoff: ${dropoffStr}${dropoffEntrance ? ` (entrance: ${dropoffEntrance}${dropoffLandmark ? `, landmark: ${dropoffLandmark}` : ''})` : ''}
${entrancePrompt ? `- ${entrancePrompt}` : ''}
- User just said: "${userMessage}"

Reply in first person as BoogieBot. Reflect the user's descriptors back and confirm the inferred entrance so they feel heard. Keep the same intent: ask for entrance, confirm locations, ask for dropoff, or clarify.`;

  const messages = [
    { role: 'system', content: systemContent },
    ...conversationHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const botMessage = data?.choices?.[0]?.message?.content?.trim() || '';
  const highlights = extractHighlights(botMessage);
  return { botMessage, highlights };
}

// Cache Overpass data for the session (used only when campus JSON doesn't resolve)
let campusDataPromise = null;

function getCampusData() {
  if (!campusDataPromise) campusDataPromise = fetchStanfordCampusData();
  return campusDataPromise;
}

/** Resolve user input to a location: try editable JSON first (landmarks → entrance), then Overpass. */
async function resolveLocation(userInput) {
  const fromJson = searchCampusFromJson(userInput);
  if (fromJson) return fromJson;
  const campus = await getCampusData();
  return searchCampusLocation(campus, userInput);
}

/**
 * Match a resolved location name to STANFORD_LOCATIONS for full address and display name.
 */
function toDisplayLocation(resolved) {
  if (!resolved?.name) return null;
  const nameLower = resolved.name.toLowerCase();
  const match = STANFORD_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(loc.name.toLowerCase().replace(/\s*\([^)]*\)\s*/, '').trim())
  );
  if (match) {
    return {
      displayText: match.fullAddress,
      displayName: match.name,
      coordinates:
        resolved.lat != null && resolved.lon != null
          ? { latitude: resolved.lat, longitude: resolved.lon }
          : null,
      entranceHint: resolved.entranceHint,
      landmarkHint: resolved.landmarkHint,
    };
  }
  const addr = resolved.address || `${resolved.name}, Stanford, CA 94305`;
  return {
    displayText: addr,
    displayName: resolved.name,
    coordinates:
      resolved.lat != null && resolved.lon != null
        ? { latitude: resolved.lat, longitude: resolved.lon }
        : null,
    entranceHint: resolved.entranceHint,
    landmarkHint: resolved.landmarkHint,
  };
}

/**
 * Static check if user is confirming (e.g. "that's it", "no", "done", "yes", "correct").
 */
function isConfirmation(input) {
  const lower = (input || '').toLowerCase().trim();
  const confirmWords = [
    "that's it",
    'that is it',
    'no',
    'done',
    "that's all",
    'that is all',
    'yes',
    'correct',
    'yep',
    'sounds good',
    'good',
    'perfect',
    'all set',
    "we're good",
    'we are good',
    'looks good',
    'that works',
    'all good',
  ];
  return confirmWords.some((w) => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w));
}

/**
 * Check if user is confirming / done / "that's it" — uses OpenAI when API key is present
 * to accept varied phrasing (e.g. "we're good", "all set", "looks good", "I'm done").
 * Falls back to isConfirmation() when no key or on error.
 * @param {string} input - User message
 * @param {string} [apiKey] - OpenAI API key (optional)
 * @returns {Promise<boolean>}
 */
async function checkConfirmation(input, apiKey) {
  const trimmed = (input || '').trim();
  if (!trimmed) return false;
  if (!apiKey || trimmed.length > 200) return isConfirmation(input);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You decide if the user is confirming, saying they are done, or that there are no more changes (e.g. "that\'s it", "we\'re good", "all set", "looks good", "I\'m done", "no more", "that works"). Reply with only YES or NO.',
          },
          { role: 'user', content: trimmed },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    if (!res.ok) return isConfirmation(input);
    const data = await res.json();
    const answer = (data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
    return answer.startsWith('YES');
  } catch {
    return isConfirmation(input);
  }
}

/**
 * Check if user wants to use current/default pickup (e.g. "current location", "here", "default").
 */
function isCurrentLocation(input) {
  const lower = (input || '').toLowerCase().trim();
  return /^(current location|here|my location|default|same|memorial way|518 memorial)$/.test(lower);
}

/**
 * Optionally replace fallback reply with OpenAI-generated reply.
 * @param {Object} state - next state
 * @param {string} fallbackMessage
 * @param {string[]} fallbackHighlights
 * @param {{ openAiApiKey?: string, currentLocation?: object, conversationHistory?: array, navigationContext?: object }} options
 * @param {string} userMessage
 */
async function maybeOpenAIReply(state, fallbackMessage, fallbackHighlights, options, userMessage) {
  const apiKey = options?.openAiApiKey;
  const history = options?.conversationHistory ?? [];
  const navCtx = options?.navigationContext ?? null;

  if (!apiKey) {
    return { botMessage: fallbackMessage, highlights: fallbackHighlights, state };
  }

  const entranceDescriptions =
    state.awaitingEntrance && state.pendingBuildingName
      ? // Prefer the exact entrance list passed from UI if it matches this building.
        (navCtx?.buildingName &&
        navCtx?.entrances &&
        Array.isArray(navCtx.entrances) &&
        navCtx.entrances.length > 0 &&
        (navCtx.buildingName || '').toLowerCase() === (state.pendingBuildingName || '').toLowerCase()
          ? navCtx.entrances
              .slice(0, 6)
              .map((e) => {
                const name = (e?.name || 'Entrance').trim();
                const dir = e?.direction ? ` (${e.direction} side)` : '';
                return `${name}${dir}`;
              })
              .join('. ') + '.'
          : getEntranceDescriptionsForBuilding(state.pendingBuildingName))
      : null;

  const context = {
    phase: state.phase,
    resolvedPickup: state.resolvedPickup ?? null,
    resolvedDropoff: state.resolvedDropoff ?? null,
    awaitingEntrance: state.awaitingEntrance ?? null,
    pendingBuildingName: state.pendingBuildingName ?? null,
    currentLocation: options?.currentLocation ?? null,
    entranceDescriptions,
  };

  try {
    const { botMessage, highlights } = await generateBotReplyWithOpenAI(context, history, userMessage, apiKey);
    return { botMessage, highlights, state };
  } catch (err) {
    console.warn('OpenAI reply failed, using fallback:', err?.message);
    return { botMessage: fallbackMessage, highlights: fallbackHighlights, state };
  }
}

/**
 * Single turn: process user message and return bot reply and updated state.
 * When OpenAI API key is present, uses a single AI call with in-memory trip request object
 * and campus data so the AI deduces location/entrance and fills the object (fluid conversation).
 * Otherwise falls back to phase-based pickup → dropoff flow.
 *
 * @param {Object} state - { tripRequest?, phase?, resolvedPickup?, resolvedDropoff?, awaitingEntrance?, pendingBuildingName? }
 * @param {string} userMessage - Raw user input
 * @param {{
 *   openAiApiKey?: string,
 *   currentLocation?: { latitude, longitude, displayName? },
 *   conversationHistory?: { role, content }[],
 *   navigationContext?: object
 * }} options
 * @returns {Promise<{ botMessage: string, highlights?: string[], state: Object }>}
 */
export async function processBoogieBotTurn(state, userMessage, options = {}) {
  const input = (userMessage || '').trim();
  const apiKey = options?.openAiApiKey;
  const conversationHistory = options?.conversationHistory ?? [];

  // New flow: trip request object + single OpenAI call with campus data
  if (apiKey) {
    const tripRequest = state?.tripRequest ?? getInitialTripRequest();
    try {
      const result = await processTurnWithTripRequest(tripRequest, conversationHistory, input, {
        openAiApiKey: apiKey,
        currentLocation: options?.currentLocation ?? null,
      });
      if (result) return result;
    } catch (err) {
      console.warn('Trip-request AI turn failed, falling back to phase-based flow:', err?.message);
    }
  }

  // Fallback: phase-based flow (no API key or AI failed)
  let phase = state?.phase ?? 'pickup';
  let resolvedPickup = state?.resolvedPickup ?? null;
  let resolvedDropoff = state?.resolvedDropoff ?? null;
  let awaitingEntrance = state?.awaitingEntrance ?? null;
  let pendingBuildingName = state?.pendingBuildingName ?? null;
  const currentLocation = options?.currentLocation ?? null;
  const navCtx = options?.navigationContext ?? null;

  function formatEntrancesFromNavCtx(buildingName) {
    const ents = navCtx?.entrances ?? [];
    if (!Array.isArray(ents) || ents.length === 0) return null;
    // Only use if the nav context is for the same building we're asking about.
    if (
      buildingName &&
      navCtx?.buildingName &&
      (navCtx.buildingName || '').toLowerCase() !== (buildingName || '').toLowerCase()
    ) {
      return null;
    }
    return (
      ents
        .slice(0, 6)
        .map((e) => {
          const name = (e?.name || 'Entrance').trim();
          const dir = e?.direction ? ` (${e.direction} side)` : '';
          return `${name}${dir}`;
        })
        .join('. ') + '.'
    );
  }

  /** Use current location for "here" when provided; else default. */
  function resolveCurrentLocationAsPickup() {
    if (currentLocation?.latitude != null && currentLocation?.longitude != null) {
      return {
        displayText: currentLocation.displayName || 'Current location',
        displayName: currentLocation.displayName || 'Current location',
        coordinates: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      };
    }
    return {
      displayText: DEFAULT_PICKUP_LOCATION.displayText,
      displayName: DEFAULT_PICKUP_LOCATION.displayName,
      coordinates: DEFAULT_PICKUP_LOCATION.coordinates,
    };
  }
 
  // ----- Deep link: user came from EntranceSelectScreen and needs entrance help -----
  // If the UI already knows which building + whether it's pickup/dropoff, jump straight into "awaiting entrance".
  if (
    navCtx?.intent === 'choose_entrance' &&
    navCtx?.buildingName &&
    !awaitingEntrance &&
    !pendingBuildingName
  ) {
    phase = navCtx?.mode === 'dropoff' ? 'dropoff' : 'pickup';

    if (phase === 'dropoff' && navCtx?.pickup && !resolvedPickup) {
      // Minimal shape; displayText isn't required for conversation, but helpful if you later surface it.
      resolvedPickup = {
        displayName: navCtx.pickup.buildingName || 'Pickup location',
        displayText: navCtx.pickup.buildingName || 'Pickup location',
        entranceHint: navCtx.pickup.entranceName || null,
      };
    }

    awaitingEntrance = phase; // 'pickup' | 'dropoff'
    pendingBuildingName = navCtx.buildingName;

    const entranceOpts = formatEntrancesFromNavCtx(pendingBuildingName) || getEntranceDescriptionsForBuilding(pendingBuildingName);

    const pickupClause =
      phase === 'dropoff' && resolvedPickup?.displayName
        ? `Your pickup is **${resolvedPickup.displayName}**${
            resolvedPickup.entranceHint ? ` at the **${resolvedPickup.entranceHint}**` : ''
          }. `
        : '';

    const fallback = entranceOpts
      ? `${pickupClause}For **${pendingBuildingName}**, which entrance do you want? Options: ${entranceOpts}`
      : `${pickupClause}For **${pendingBuildingName}**, which entrance do you want? You can say north entrance, by the bike racks, near the stairs, or main.`;

    const nextState = {
      phase,
      resolvedPickup,
      resolvedDropoff,
      awaitingEntrance,
      pendingBuildingName,
    };

    return maybeOpenAIReply(nextState, fallback, [pendingBuildingName], options, input);
  }

  // ----- Awaiting entrance for pickup -----
  if (phase === 'pickup' && awaitingEntrance === 'pickup' && pendingBuildingName) {
    const combined = `${pendingBuildingName} ${input}`.trim();
    const pickupResolved = await resolveLocation(combined);
    if (pickupResolved) {
      resolvedPickup = toDisplayLocation(pickupResolved);
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const entrance = pickupResolved.entranceHint ? ` at the **${pickupResolved.entranceHint}**` : '';
      const landmark = pickupResolved.landmarkHint ? ` near **${pickupResolved.landmarkHint}**` : '';
      const reflect = input ? `You said "${input}" — I have that as ` : 'I have ';
      const fallback = `${reflect}pickup at **${resolvedPickup.displayName}**${entrance}${landmark}. Where would you like to be dropped off? Name a building, then I'll ask which entrance.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedPickup.displayName], options, input);
    }
    const nextState = { phase: 'pickup', resolvedPickup, resolvedDropoff, awaitingEntrance: 'pickup', pendingBuildingName };
    const entranceOpts = formatEntrancesFromNavCtx(pendingBuildingName) || getEntranceDescriptionsForBuilding(pendingBuildingName);
    const fallback = entranceOpts
      ? `Which entrance at **${pendingBuildingName}**? We have: ${entranceOpts}.`
      : `Which entrance at **${pendingBuildingName}**? You can say north entrance, by the bike racks, near the stairs, or main.`;
    return maybeOpenAIReply(nextState, fallback, [pendingBuildingName], options, input);
  }

  // ----- Awaiting entrance for dropoff -----
  if (phase === 'dropoff' && awaitingEntrance === 'dropoff' && pendingBuildingName) {
    const combined = `${pendingBuildingName} ${input}`.trim();
    const dropoffResolved = await resolveLocation(combined);
    if (dropoffResolved) {
      resolvedDropoff = toDisplayLocation(dropoffResolved);
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const entrance = dropoffResolved.entranceHint ? ` at the **${dropoffResolved.entranceHint}**` : '';
      const landmark = dropoffResolved.landmarkHint ? ` near **${dropoffResolved.landmarkHint}**` : '';
      const reflect = input ? `You said "${input}" — I have dropoff at ` : 'Dropoff at ';
      const fallback = `${reflect}**${resolvedDropoff.displayName}**${entrance}${landmark}. Say "that's it" to confirm, or tell me another detail.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedDropoff.displayName].filter(Boolean), options, input);
    }
    const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: 'dropoff', pendingBuildingName };
    const entranceOpts = formatEntrancesFromNavCtx(pendingBuildingName) || getEntranceDescriptionsForBuilding(pendingBuildingName);
    const fallback = entranceOpts
      ? `Which entrance at **${pendingBuildingName}**? We have: ${entranceOpts}.`
      : `Which entrance at **${pendingBuildingName}**? Say north entrance, by the bike racks, near the stairs, or main.`;
    return maybeOpenAIReply(nextState, fallback, [pendingBuildingName], options, input);
  }

  // ----- Pickup phase -----
  if (phase === 'pickup') {
    const confirmingPickup = await checkConfirmation(input, options?.openAiApiKey);
    if (confirmingPickup && resolvedPickup) {
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = `Got it, pickup at **${resolvedPickup.displayName}**. Where would you like to be dropped off? Name a building and I'll ask which entrance.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedPickup.displayName], options, input);
    }
    if (isCurrentLocation(input) || (confirmingPickup && !resolvedPickup)) {
      resolvedPickup = resolveCurrentLocationAsPickup();
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = `Sounds good. I have your pickup as **${resolvedPickup.displayName}**. Where would you like to be dropped off? Name a building and I'll ask which entrance.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedPickup.displayName], options, input);
    }
    const pickupPhrase = await extractLocationFromMessage(input, options?.openAiApiKey);
    const pickupResolved = await resolveLocation(pickupPhrase);
    if (pickupResolved) {
      const buildingName = pickupResolved.name || resolvedPickup?.displayName || input;
      const nextState = { phase: 'pickup', resolvedPickup, resolvedDropoff, awaitingEntrance: 'pickup', pendingBuildingName: buildingName };
      const fallback = `You said **${buildingName}** — got it. Which entrance do you want? You can say north entrance, by the bike racks, near the stairs, or main.`;
      return maybeOpenAIReply(nextState, fallback, [buildingName], options, input);
    }
    const nextState = { phase: 'pickup', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
    const fallback =
      'I can set your pickup as your **current location**—say "here" or "current location." Or name a building (e.g. **CoDa**, **Tresidder**); I\'ll then ask which entrance.';
    return maybeOpenAIReply(nextState, fallback, ['current location'], options, input);
  }

  // ----- Dropoff phase -----
  if (phase === 'dropoff') {
    const confirmingDropoff = await checkConfirmation(input, options?.openAiApiKey);
    if (confirmingDropoff && resolvedDropoff) {
      const nextState = { phase: 'done', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback =
        'Great, I\'ve got both your pickup and dropoff. Tap "Continue to ride confirmation" to complete your Boogie booking.';
      return maybeOpenAIReply(nextState, fallback, [], options, input);
    }
    if (confirmingDropoff && !resolvedDropoff) {
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = 'When you know your dropoff, name the building and I\'ll ask which entrance—e.g. "CoDa" or "Memorial Church."';
      return maybeOpenAIReply(nextState, fallback, [], options, input);
    }

    const dropoffPhrase = await extractLocationFromMessage(input, options?.openAiApiKey);
    const dropoffResolved = await resolveLocation(dropoffPhrase);
    if (dropoffResolved) {
      const buildingName = dropoffResolved.name || resolvedDropoff?.displayName || input;
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: 'dropoff', pendingBuildingName: buildingName };
      const fallback = `You said **${buildingName}** — got it. Which entrance? You can say north entrance, by the bike racks, near the stairs, or main.`;
      return maybeOpenAIReply(nextState, fallback, [buildingName], options, input);
    }

    const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
    const fallback = 'Name a building—like **CoDa**, **Memorial Church**, or **Tresidder**—and I\'ll ask which entrance.';
    return maybeOpenAIReply(nextState, fallback, ['CoDa', 'Memorial Church', 'Tresidder'], options, input);
  }

  // phase === 'done'
  const nextState = { phase: 'done', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
  const fallback = 'Your ride details are set. Tap "Continue to ride confirmation" to finish booking with Boogie.';
  return maybeOpenAIReply(nextState, fallback, [], options, input);
}

/**
 * Get the initial bot message for the conversation.
 * Open-ended so the user can give pickup and dropoff in any order or in one go.
 */
export function getInitialBotMessage() {
  return `Hi, I'm BoogieBot. I'm here to help you book a DisGo ride. Tell me where you'd like to be picked up and where you're going—you can say both at once (e.g. "Pick me up at **CoDa** at the north entrance and drop me at **Tresidder** by the bike racks") or one at a time. You can use building names and **landmarks** like north entrance, by the bike racks, or near the stairs.`;
}