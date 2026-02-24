/**
 * Boogie bot API: natural language ride booking with Stanford campus awareness.
 * Uses OpenAI for conversation and optional Overpass for campus POI context.
 *
 * Env: EXPO_PUBLIC_OPENAI_API_KEY (Expo client) or OPENAI_API_KEY (e.g. backend).
 * For Expo, add EXPO_PUBLIC_OPENAI_API_KEY to .env with the same value as OPENAI_API_KEY.
 */

import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { getCampusContextForPrompt } from './campusContext';
import { getStanfordOverpassContext } from './overpass';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function getApiKey() {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
}

function buildSystemPrompt(campusContext, overpassContext) {
  const locationList = STANFORD_LOCATIONS.map(
    (loc) => `- ${loc.name}: ${loc.address} (full: ${loc.fullAddress})`
  ).join('\n');

  const defaultPickup = DEFAULT_PICKUP_LOCATION.fullAddress || DEFAULT_PICKUP_LOCATION.address || '518 Memorial Way, Stanford, CA 94305';
  const extraContext = [campusContext, overpassContext].filter(Boolean).join('\n\n');

  return `You are BoogieBot, the voice of DisGo — Stanford's disability golf-cart ride service. You are a digital dispatcher for blind and low vision (BLV) students. Riders describe where they want to be dropped off using landmarks and mental maps: building names, entrances (north, south, east, west), and landmarks like parking lots, bike racks, and nearby establishments (e.g. "near the Blend", "by the bike racks", "east entrance of CoDa"). Your job is to resolve these into a specific building, address, and entrance/landmark so drivers can find the rider easily.

Goals:
1. Understand drop-off (and pickup if they mention it) in natural language. Use the campus context below to match landmarks and entrances to buildings.
2. Confirm back the specific entrance or landmark (e.g. "north entrance", "by the bike racks", "near the Blend") so the driver knows exactly where to go.
3. Keep replies short and natural for voice (1–3 sentences). Use contractions. Sound warm and clear.
4. When they say they're done ("that's it", "no", "done"), confirm their spot is secured and they can complete the booking.

Known Stanford locations (use for official names and addresses):
${locationList}

Default pickup if not specified: ${defaultPickup}

${extraContext ? `Campus context (entrances, landmarks, parking, bike racks, establishments — use to resolve user descriptions):\n${extraContext}\n` : ''}

Respond with valid JSON only. Shape:
{
  "message": "Your reply (spoken style). Use **bold** for building names or entrance/landmark phrases.",
  "location": {
    "name": "Building or place name if resolved, else null",
    "address": "Full address if resolved, else null",
    "coordinates": { "lat": number, "lon": number } or null,
    "entranceDescriptor": "e.g. north entrance, by bike racks, near the Blend, or null"
  },
  "pickup": null or { "name": "...", "address": "...", "coordinates": null, "entranceDescriptor": "..." },
  "conversationComplete": false
}
- "location" = drop-off. Set "pickup" only if user said where to be picked up; else null.
- If asking a clarifying question, set location and pickup to null, conversationComplete false.
- When they're done and you have their drop-off, say their spot is secured and set "conversationComplete" to true.`;
}

/**
 * @param {string} userMessage
 * @param {Array<{type: 'user'|'bot', text: string}>} conversationHistory - transcript so far (without the new user message)
 * @returns {Promise<{ botMessage: string, location: { name?: string, address?: string, coordinates?: { lat: number, lon: number }, entranceDescriptor?: string } | null }>}
 */
export async function getBoogieBotResponse(userMessage, conversationHistory = []) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      botMessage: "I'm having trouble connecting right now. Please check that the app is configured with an API key and try again.",
      location: null,
      pickup: null,
      conversationComplete: false,
    };
  }

  const campusContext = getCampusContextForPrompt();
  let overpassContext = '';
  try {
    overpassContext = await getStanfordOverpassContext();
  } catch (e) {
    console.warn('Overpass context skipped:', e?.message);
  }
  const systemPrompt = buildSystemPrompt(campusContext, overpassContext);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.type === 'bot' ? m.text : m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('OpenAI error', res.status, errText);
      return {
        botMessage: "I couldn't process that right now. Please try again in a moment.",
        location: null,
        pickup: null,
        conversationComplete: false,
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        botMessage: "I didn't get a clear response. Could you repeat where you'd like to be dropped off?",
        location: null,
        pickup: null,
        conversationComplete: false,
      };
    }

    const parsed = JSON.parse(content);
    const message = typeof parsed.message === 'string' ? parsed.message : '';
    const location = parsed.location && typeof parsed.location === 'object' ? parsed.location : null;
    const pickup = parsed.pickup && typeof parsed.pickup === 'object' ? parsed.pickup : null;
    const conversationComplete = Boolean(parsed.conversationComplete);

    return {
      botMessage: message || "Got it. Anything else about your drop-off?",
      location,
      pickup,
      conversationComplete,
    };
  } catch (e) {
    console.warn('Boogie bot API error:', e);
    return {
      botMessage: "Something went wrong on my end. Please try again or describe your drop-off in another way.",
      location: null,
      pickup: null,
      conversationComplete: false,
    };
  }
}