const TOKEN_KEY = 'token';
const AUTH_FLAG_KEY = 'isAdminAuthenticated';
const EMAIL_KEY = 'adminEmail';

function safeGetItem(storage: Storage | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: Storage | undefined, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota or access errors
  }
}

function safeRemoveItem(storage: Storage | undefined, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
}

export function getStoredAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    safeGetItem(window.localStorage, TOKEN_KEY) ||
    safeGetItem(window.sessionStorage, TOKEN_KEY) ||
    ''
  );
}

export function isStoredAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    safeGetItem(window.localStorage, AUTH_FLAG_KEY) === 'true' ||
    safeGetItem(window.sessionStorage, AUTH_FLAG_KEY) === 'true'
  );
}

export function setStoredAuthSession(
  token: string,
  email: string,
  rememberMe: boolean
): void {
  if (typeof window === 'undefined') return;
  const primary = rememberMe ? window.localStorage : window.sessionStorage;
  const secondary = rememberMe ? window.sessionStorage : window.localStorage;

  safeSetItem(primary, TOKEN_KEY, token);
  safeSetItem(primary, AUTH_FLAG_KEY, 'true');
  safeSetItem(primary, EMAIL_KEY, email);

  safeRemoveItem(secondary, TOKEN_KEY);
  safeRemoveItem(secondary, AUTH_FLAG_KEY);
  safeRemoveItem(secondary, EMAIL_KEY);
}

export function clearStoredAuthSession(): void {
  if (typeof window === 'undefined') return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    safeRemoveItem(storage, TOKEN_KEY);
    safeRemoveItem(storage, AUTH_FLAG_KEY);
    safeRemoveItem(storage, EMAIL_KEY);
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
