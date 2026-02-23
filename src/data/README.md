# Campus context for Boogie bot

The Boogie bot uses **`campusContext.json`** in this folder for building/landmark context. No Overpass API is called at runtime.

## Enrich with Overpass + OpenAI (recommended)

To populate addresses, alternate names (e.g. Building 160), entrances, landmarks (stairs, fountains, bike racks), and establishments using Overpass + OpenAI + web-researched seed data:

```bash
npm run enrich:campus
```

Requires `OPENAI_API_KEY` in `.env`. This overwrites `campusContext.json` with enriched data.

## One-time Overpass export

To merge in building names from OpenStreetMap (Overpass) only (no AI enrichment):

```bash
npm run generate:campus
```

## Editing the JSON

Edit **`campusContext.json`** to add human-generated context:

- **buildings**: Each entry can have:
  - `name`, `address` — building name and full address
  - `entrances` — array of strings, e.g. `["north", "east", "southwest"]`
  - `landmarks` — array of strings, e.g. `["near the Blend", "stairs", "bike racks"]`
  - `notes` — free text (e.g. “North entrance near Blend; southwest near Gilbert stairs.”)

- **humanAdditions**: Array of extra context. Each item can have `buildingOrArea`, `entrances`, `landmarks`, `notes`.

The bot reads this file at app load and uses it in the system prompt so it can match user phrases like “near the Blend” or “north entrance of CoDa” to the right building and entrance.
