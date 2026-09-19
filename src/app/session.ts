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
  version: 2;
  salt: string;
  iv: string;
  ciphertext: string;
  iterations: number;
  cachedAt: string;
}

const LIVE_SESSION_KEY = 'oris360.liveSession.v1';
const OFFLINE_AUTH_VERSION = 2;
const PBKDF2_ITERATIONS = 210_000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function hexToBytes(value: string): Uint8Array {
  if (!value || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    throw new Error('INVALID_ENCRYPTED_AUTH');
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

async function deriveOfflineKey(
  email: string,
  password: string,
  salt: Uint8Array,
  iterations: number,
  realm: string
): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('WEB_CRYPTO_UNAVAILABLE');

  const material = await globalThis.crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(realm + ':' + normalizeEmail(email) + ':' + password)),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function offlineKey(email: string, realm = 'demo'): string {
  return 'oris360.offlineAuth.v2:' + encodeURIComponent(realm) + ':' + encodeURIComponent(normalizeEmail(email));
}

export async function cacheOfflineCredentials(
  storage: StorageLike,
  email: string,
  password: string,
  auth: AuthResult,
  realm = 'demo'
): Promise<void> {
  if (!globalThis.crypto?.subtle) throw new Error('WEB_CRYPTO_UNAVAILABLE');

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveOfflineKey(email, password, salt, PBKDF2_ITERATIONS, realm);
  const plaintext = new TextEncoder().encode(JSON.stringify(auth));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plaintext)
  );

  const record: OfflineCredentialRecord = {
    version: OFFLINE_AUTH_VERSION,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ciphertext: bytesToHex(new Uint8Array(encrypted)),
    iterations: PBKDF2_ITERATIONS,
    cachedAt: new Date().toISOString()
  };
  storage.setItem(offlineKey(email, realm), JSON.stringify(record));
}

export async function verifyOfflineCredentials(
  storage: StorageLike,
  email: string,
  password: string,
  realm = 'demo'
): Promise<AuthResult | null> {
  const raw = storage.getItem(offlineKey(email, realm));
  if (!raw || !globalThis.crypto?.subtle) return null;

  try {
    const record = JSON.parse(raw) as OfflineCredentialRecord;
    if (
      record.version !== OFFLINE_AUTH_VERSION ||
      !Number.isInteger(record.iterations) ||
      record.iterations < 100_000
    ) {
      return null;
    }

    const salt = hexToBytes(record.salt);
    const iv = hexToBytes(record.iv);
    const ciphertext = hexToBytes(record.ciphertext);
    const key = await deriveOfflineKey(email, password, salt, record.iterations, realm);
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as AuthResult;
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
