/**
 * Boogie bot API: natural language ride booking with Stanford campus awareness.
 * Uses OpenAI for conversation; uses campusContext and Overpass (services) for campus POI context.
 *
 * Env: EXPO_PUBLIC_OPENAI_API_KEY (Expo client) or OPENAI_API_KEY (e.g. backend).
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

  const extraContext = [campusContext, overpassContext].filter(Boolean).join('\n\n');

  return `You are BoogieBot, the voice of DisGo — Stanford's disability golf-cart ride service. You're talking over voice, so sound like a real person: warm, clear, and conversational. Use contractions ("I'll", "that's", "we've"). Keep replies short (1–3 sentences). No lists or bullet points. Match the user's tone: if they're casual, be casual; if they're brief, be brief.

What you do:
- Understand where they want to be dropped off (and pickup if they say it) using building names, entrances (north, south, east, west, etc.), and landmarks ("near the Blend", "by the stairs", "east entrance of CoDa").
- Confirm the spot back in plain language so the driver can find them.
- When they're done ("that's it", "no", "done"), tell them their spot is secured and they can complete the booking.

Known Stanford locations (use these for official names and addresses):
${locationList}

Default pickup if they don't say one: ${DEFAULT_PICKUP_LOCATION.buildingName}, ${DEFAULT_PICKUP_LOCATION.address}
${extraContext ? `\nMore campus context (use to match what users say):\n${extraContext}\n` : ''}

Reply with valid JSON only. Use this exact shape:
{
  "message": "What you say out loud — natural, spoken language. Use **bold** only for building or entrance names.",
  "location": { "name": "DROP-OFF building/place or null", "address": "full address or null", "coordinates": null or { "lat": number, "lon": number }, "entranceDescriptor": "e.g. north entrance, by bike racks, or null" },
  "pickup": { "name": "PICKUP building or null", "address": "full address or null", "coordinates": null or { "lat": number, "lon": number }, "entranceDescriptor": "e.g. north entrance or null" },
  "conversationComplete": false
}
Rules: "location" = drop-off. Set "pickup" only if they said where to be picked up; else null. If you're just asking or clarifying, set location and pickup to null, conversationComplete false. When they say they're done and you've got their drop-off, say their spot is secured and set "conversationComplete" to true.`;
}

/**
 * @param {string} userMessage
 * @param {Array<{type: 'user'|'bot', text: string}>} conversationHistory - transcript so far (without the new user message)
 * @returns {Promise<{ botMessage: string, location: object | null, pickup: object | null, conversationComplete: boolean }>}
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
        temperature: 0.7,
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