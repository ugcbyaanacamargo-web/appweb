import type { Scope } from '../domain/models';

export function makeScopeKey(scope: Scope): string {
  return [scope.deviceId, scope.userId, scope.companyId].join(':');
}

export function getOrCreateDeviceId(storage: Pick<Storage, 'getItem' | 'setItem'>): string {
  const key = 'oris360.deviceId';
  const current = storage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}
