import { computed, reactive } from 'vue';
import type { AuthPayload } from './auth';

export const AUTH_TOKEN_KEY = 'heritage-auth-token';

export const authSession = reactive<{
  token: string;
  auth: AuthPayload | null;
}>({
  token: window.localStorage.getItem(AUTH_TOKEN_KEY) || '',
  auth: null,
});

export const currentAuth = computed(() => authSession.auth);
export const currentUser = computed(() => authSession.auth?.user ?? null);

export function getAuthToken() {
  return authSession.token || window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthSession(payload: AuthPayload) {
  authSession.auth = payload;
  if (payload.token) {
    authSession.token = payload.token;
    window.localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
  }
}

export function clearAuthSession() {
  authSession.auth = null;
  authSession.token = '';
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
