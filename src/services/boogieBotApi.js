/**
 * Boogie bot API: natural language ride booking with Stanford campus awareness.
 * Uses OpenAI for conversation and optional Overpass for campus POI context.
 *
 * Env: EXPO_PUBLIC_OPENAI_API_KEY (Expo client) or OPENAI_API_KEY (e.g. backend).
 * For Expo, add EXPO_PUBLIC_OPENAI_API_KEY to .env with the same value as OPENAI_API_KEY.
 */

import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { getCampusContextForPrompt } from './campusContext';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function getApiKey() {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
}

function buildSystemPrompt(campusContext) {
  const locationList = STANFORD_LOCATIONS.map(
    (loc) => `- ${loc.name}: ${loc.address} (full: ${loc.fullAddress})`
  ).join('\n');

  return `You are BoogieBot, a friendly voice dispatcher for DisGo (Stanford's disability golf-cart ride service). You help riders, especially BLV (blind and low vision) users, book rides by understanding where they want to be picked up and dropped off using landmarks and mental maps.

Your goals:
1. Understand drop-off (and pickup if mentioned) in natural language: building names, entrances (north, south, east, west, southwest, etc.), and landmarks (e.g. "near the Blend", "by the stairs", "at the bike racks", "east entrance of CoDa", "across from the fountain").
2. Confirm the location and, when relevant, the specific entrance or landmark so the driver can find the rider.
3. Keep replies concise and natural for voice; avoid long paragraphs.
4. When the user confirms they're done ("that's it", "no", "done"), wrap up and confirm their spot is secured.

Known Stanford campus locations (use these for addresses when you resolve a building):
${locationList}

Current default pickup (if user doesn't specify): ${DEFAULT_PICKUP_LOCATION.buildingName}, ${DEFAULT_PICKUP_LOCATION.address}

${campusContext ? `Campus context (buildings, entrances, landmarks — use this to match what users say):\n${campusContext}\n` : ''}

Always respond with valid JSON only, no markdown or extra text. Use this exact shape:
{
  "message": "Your natural-language reply to the user (1-3 short sentences). Use **bold** only for building names or key phrases like entrance names.",
  "location": {
    "name": "Building or place name if resolved, else null",
    "address": "Full address if resolved, else null",
    "coordinates": { "lat": number, "lon": number } or null,
    "entranceDescriptor": "e.g. north entrance, near the stairs, by bike racks, or null"
  },
  "conversationComplete": false
}
- If the user is just chatting or you're asking a clarifying question, set "location" to null and "conversationComplete" to false.
- When you resolve a specific drop-off, set name, address, and optionally coordinates and entranceDescriptor; set "conversationComplete" to false.
- When the user says they're done (e.g. "that's it", "no", "done", "that's all") and you have already confirmed their drop-off location, reply that their spot is secured and they can proceed to complete the booking, and set "conversationComplete" to true.`;
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
      conversationComplete: false,
    };
  }

  const campusContext = getCampusContextForPrompt();
  const systemPrompt = buildSystemPrompt(campusContext);

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
        conversationComplete: false,
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        botMessage: "I didn't get a clear response. Could you repeat where you'd like to be dropped off?",
        location: null,
        conversationComplete: false,
      };
    }

    const parsed = JSON.parse(content);
    const message = typeof parsed.message === 'string' ? parsed.message : '';
    const location = parsed.location && typeof parsed.location === 'object' ? parsed.location : null;
    const conversationComplete = Boolean(parsed.conversationComplete);

    return {
      botMessage: message || "Got it. Anything else about your drop-off?",
      location,
      conversationComplete,
    };
  } catch (e) {
    console.warn('Boogie bot API error:', e);
    return {
      botMessage: "Something went wrong on my end. Please try again or describe your drop-off in another way.",
      location: null,
      conversationComplete: false,
    };
  }
}
