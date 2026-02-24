/**
 * Boogie bot conversation API: resolves pickup and dropoff from natural language
 * using Stanford campus data. Optional OpenAI for natural replies; uses actual
 * current location when provided.
 */

import { fetchStanfordCampusData, searchCampusLocation } from './overpassApi';
import { searchCampusFromJson } from './campusDataLoader';
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

/** Extract text between ** for highlights. */
function extractHighlights(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/\*\*([^*]+)\*\*/g);
  return matches ? matches.map((m) => m.replace(/\*\*/g, '').trim()).filter(Boolean) : [];
}

/**
 * Call OpenAI to generate a natural bot reply.
 * @param {{ phase: string, resolvedPickup: object|null, resolvedDropoff: object|null, currentLocation: object|null }} context
 * @param {{ role: 'user'|'assistant', content: string }[]} conversationHistory
 * @param {string} userMessage
 * @param {string} apiKey
 * @returns {Promise<{ botMessage: string, highlights: string[] }>}
 */
async function generateBotReplyWithOpenAI(context, conversationHistory, userMessage, apiKey) {
  const { phase, resolvedPickup, resolvedDropoff, awaitingEntrance, pendingBuildingName, currentLocation } = context;
  const currentLocationStr = currentLocation
    ? (currentLocation.displayName || `Current location (${currentLocation.latitude?.toFixed(5)}, ${currentLocation.longitude?.toFixed(5)})`)
    : 'Not provided';
  const pickupStr = resolvedPickup ? resolvedPickup.displayName || resolvedPickup.displayText : 'Not set';
  const dropoffStr = resolvedDropoff ? resolvedDropoff.displayName || resolvedDropoff.displayText : 'Not set';
  const pickupEntrance = resolvedPickup?.entranceHint || null;
  const pickupLandmark = resolvedPickup?.landmarkHint || null;
  const dropoffEntrance = resolvedDropoff?.entranceHint || null;
  const dropoffLandmark = resolvedDropoff?.landmarkHint || null;
  const entrancePrompt = awaitingEntrance && pendingBuildingName
    ? `You are currently asking which entrance at ${pendingBuildingName}. Ask for the entrance (e.g. north entrance, by the bike racks, near the stairs, or main).`
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
      coordinates: resolved.lat != null && resolved.lon != null ? { latitude: resolved.lat, longitude: resolved.lon } : null,
      entranceHint: resolved.entranceHint,
      landmarkHint: resolved.landmarkHint,
    };
  }
  const addr = resolved.address || `${resolved.name}, Stanford, CA 94305`;
  return {
    displayText: addr,
    displayName: resolved.name,
    coordinates: resolved.lat != null && resolved.lon != null ? { latitude: resolved.lat, longitude: resolved.lon } : null,
    entranceHint: resolved.entranceHint,
    landmarkHint: resolved.landmarkHint,
  };
}

/**
 * Check if user is confirming (e.g. "that's it", "no", "done", "yes", "correct").
 */
function isConfirmation(input) {
  const lower = (input || '').toLowerCase().trim();
  const confirmWords = ["that's it", "that is it", "no", "done", "that's all", "that is all", "yes", "correct", "yep", "sounds good", "good", "perfect"];
  return confirmWords.some((w) => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w));
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
 * @param {{ openAiApiKey?: string, currentLocation?: object, conversationHistory?: array }} options
 * @param {string} userMessage
 */
async function maybeOpenAIReply(state, fallbackMessage, fallbackHighlights, options, userMessage) {
  const apiKey = options?.openAiApiKey;
  const history = options?.conversationHistory ?? [];
  if (!apiKey) {
    return { botMessage: fallbackMessage, highlights: fallbackHighlights, state };
  }
  const context = {
    phase: state.phase,
    resolvedPickup: state.resolvedPickup ?? null,
    resolvedDropoff: state.resolvedDropoff ?? null,
    awaitingEntrance: state.awaitingEntrance ?? null,
    pendingBuildingName: state.pendingBuildingName ?? null,
    currentLocation: options?.currentLocation ?? null,
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
 * State can include awaitingEntrance ('pickup'|'dropoff') and pendingBuildingName when we've accepted a place and are asking for entrance.
 *
 * @param {Object} state - { phase, resolvedPickup, resolvedDropoff, awaitingEntrance?, pendingBuildingName? }
 * @param {string} userMessage - Raw user input
 * @param {{ openAiApiKey?: string, currentLocation?: { latitude, longitude, displayName? }, conversationHistory?: { role, content }[] }} options
 * @returns {Promise<{ botMessage: string, highlights?: string[], state: Object }>}
 */
export async function processBoogieBotTurn(state, userMessage, options = {}) {
  const input = (userMessage || '').trim();
  const lower = input.toLowerCase();
  let phase = state?.phase ?? 'pickup';
  let resolvedPickup = state?.resolvedPickup ?? null;
  let resolvedDropoff = state?.resolvedDropoff ?? null;
  let awaitingEntrance = state?.awaitingEntrance ?? null;
  let pendingBuildingName = state?.pendingBuildingName ?? null;
  const currentLocation = options?.currentLocation ?? null;

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
    const fallback = `Which entrance at **${pendingBuildingName}**? You can say north entrance, by the bike racks, near the stairs, or main.`;
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
    const fallback = `Which entrance at **${pendingBuildingName}**? Say north entrance, by the bike racks, near the stairs, or main.`;
    return maybeOpenAIReply(nextState, fallback, [pendingBuildingName], options, input);
  }

  // ----- Pickup phase -----
  if (phase === 'pickup') {
    if (isConfirmation(input) && resolvedPickup) {
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = `Got it, pickup at **${resolvedPickup.displayName}**. Where would you like to be dropped off? Name a building and I'll ask which entrance.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedPickup.displayName], options, input);
    }
    if (isCurrentLocation(input) || (isConfirmation(input) && !resolvedPickup)) {
      resolvedPickup = resolveCurrentLocationAsPickup();
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = `Sounds good. I have your pickup as **${resolvedPickup.displayName}**. Where would you like to be dropped off? Name a building and I'll ask which entrance.`;
      return maybeOpenAIReply(nextState, fallback, [resolvedPickup.displayName], options, input);
    }
    const pickupResolved = await resolveLocation(input);
    if (pickupResolved) {
      const buildingName = pickupResolved.name || resolvedPickup?.displayName || input;
      const nextState = { phase: 'pickup', resolvedPickup, resolvedDropoff, awaitingEntrance: 'pickup', pendingBuildingName: buildingName };
      const fallback = `You said **${buildingName}** — got it. Which entrance do you want? You can say north entrance, by the bike racks, near the stairs, or main.`;
      return maybeOpenAIReply(nextState, fallback, [buildingName], options, input);
    }
    const nextState = { phase: 'pickup', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
    const fallback = "I can set your pickup as your **current location**—say \"here\" or \"current location.\" Or name a building (e.g. **CoDa**, **Tressider**); I'll then ask which entrance.";
    return maybeOpenAIReply(nextState, fallback, ['current location'], options, input);
  }

  // ----- Dropoff phase -----
  if (phase === 'dropoff') {
    if (isConfirmation(input) && resolvedDropoff) {
      const nextState = { phase: 'done', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = "Great, I've got both your pickup and dropoff. Tap \"Continue to ride confirmation\" to complete your Boogie booking.";
      return maybeOpenAIReply(nextState, fallback, [], options, input);
    }
    if (isConfirmation(input) && !resolvedDropoff) {
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
      const fallback = "When you know your dropoff, name the building and I'll ask which entrance—e.g. \"CoDa\" or \"Memorial Church.\"";
      return maybeOpenAIReply(nextState, fallback, [], options, input);
    }

    const dropoffResolved = await resolveLocation(input);
    if (dropoffResolved) {
      const buildingName = dropoffResolved.name || resolvedDropoff?.displayName || input;
      const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: 'dropoff', pendingBuildingName: buildingName };
      const fallback = `You said **${buildingName}** — got it. Which entrance? You can say north entrance, by the bike racks, near the stairs, or main.`;
      return maybeOpenAIReply(nextState, fallback, [buildingName], options, input);
    }

    const nextState = { phase: 'dropoff', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
    const fallback = "Name a building—like **CoDa**, **Memorial Church**, or **Tressider**—and I'll ask which entrance.";
    return maybeOpenAIReply(nextState, fallback, ['CoDa', 'Memorial Church', 'Tressider'], options, input);
  }

  // phase === 'done'
  const nextState = { phase: 'done', resolvedPickup, resolvedDropoff, awaitingEntrance: null, pendingBuildingName: null };
  const fallback = "Your ride details are set. Tap \"Continue to ride confirmation\" to finish booking with Boogie.";
  return maybeOpenAIReply(nextState, fallback, [], options, input);
}

/**
 * Get the initial bot message for the conversation (asks about pickup first).
 * No coordinates in the message—keeps the conversation natural.
 */
export function getInitialBotMessage() {
  return `Hi, I'm BoogieBot. I'm here to help you book a DisGo ride. Where will you be getting picked up? You can say "here" or "current location," or name a building—and you can use **landmarks or nearby features** to describe the entrance (e.g. "north entrance," "by the bike racks," "near the stairs"). Same for dropoff.`;
}
