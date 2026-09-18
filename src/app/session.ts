import type { AuthResult } from '../domain/models';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LiveSession {
  auth: AuthResult;
  activeCompanyId?: string;
}

interface OfflineCredentialRecord {
  email: string;
  verifier: string;
  auth: AuthResult;
  cachedAt: string;
}

const LIVE_SESSION_KEY = 'oris360.liveSession.v1';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('WEB_CRYPTO_UNAVAILABLE');
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function offlineKey(email: string): string {
  return 'oris360.offlineAuth.v1:' + encodeURIComponent(normalizeEmail(email));
}

export async function cacheOfflineCredentials(
  storage: StorageLike,
  email: string,
  password: string,
  auth: AuthResult
): Promise<void> {
  const normalized = normalizeEmail(email);
  const record: OfflineCredentialRecord = {
    email: normalized,
    verifier: await sha256(normalized + ':' + password),
    auth,
    cachedAt: new Date().toISOString()
  };
  storage.setItem(offlineKey(normalized), JSON.stringify(record));
}

export async function verifyOfflineCredentials(
  storage: StorageLike,
  email: string,
  password: string
): Promise<AuthResult | null> {
  const normalized = normalizeEmail(email);
  const raw = storage.getItem(offlineKey(normalized));
  if (!raw) return null;

  try {
    const record = JSON.parse(raw) as OfflineCredentialRecord;
    const verifier = await sha256(normalized + ':' + password);
    return verifier === record.verifier ? record.auth : null;
  } catch {
    return null;
  }
}

export function saveLiveSession(storage: StorageLike, session: LiveSession): void {
  storage.setItem(LIVE_SESSION_KEY, JSON.stringify(session));
}

export function loadLiveSession(storage: StorageLike): LiveSession | null {
  const raw = storage.getItem(LIVE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LiveSession;
  } catch {
    storage.removeItem(LIVE_SESSION_KEY);
    return null;
  }
}

export function clearLiveSession(storage: StorageLike): void {
  storage.removeItem(LIVE_SESSION_KEY);
}
