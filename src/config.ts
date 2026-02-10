import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId as string;
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId as string;
export const GOOGLE_ANDROID_CLIENT_ID = extra.googleAndroidClientId as string;
export const GEMINI_API_KEY = extra.geminiApiKey as string;

// Debug helper (remove in production if strict)
if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing from configuration. Check your .env file.');
}
