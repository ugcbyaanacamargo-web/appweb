import type { Scope } from '../domain/models';

export function makeScopeKey(scope: Scope): string {
  const base = [scope.deviceId, scope.userId, scope.companyId].join(':');
  const realm = scope.realm?.trim();
  if (!realm || realm === 'demo') return base;
  return ['realm', encodeURIComponent(realm), base].join(':');
}

export function getOrCreateDeviceId(storage: Pick<Storage, 'getItem' | 'setItem'>): string {
  const key = 'oris360.deviceId';
  const current = storage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}
