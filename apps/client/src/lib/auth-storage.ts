import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@lazyde/auth-token';

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
