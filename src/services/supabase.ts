import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = "https://xpglbyxjszpusclmpwut.supabase.co";
const supabaseAnonKey = "***REMOVED***";

console.log('[Supabase Config] URL:', supabaseUrl ? 'Set' : 'MISSING');
console.log('[Supabase Config] Key:', supabaseAnonKey ? 'Set' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Constants.extra:', JSON.stringify(Constants.expoConfig?.extra));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
