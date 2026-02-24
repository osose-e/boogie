/**
 * App config. EXPO_PUBLIC_OPENAI_API_KEY from .env or app.config.js extra.
 */
import Constants from 'expo-constants';

export function getOpenAIApiKey() {
  return Constants.expoConfig?.extra?.openAiApiKey
    ?? process.env?.EXPO_PUBLIC_OPENAI_API_KEY
    ?? null;
}
