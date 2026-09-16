import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBrowserSupabase } from '@/lib/supabase-browser';

const AUTH_TOKEN_KEY = '@lazyde/auth-token';

export async function getAuthToken() {
  const supabase = getBrowserSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
      const refreshed = await supabase.auth.refreshSession();
      return refreshed.data.session?.access_token ?? session.access_token;
    }
    return session?.access_token ?? null;
  }
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  const supabase = getBrowserSupabase();
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
