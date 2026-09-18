import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type { Customer, Product, SalesDocument } from '../domain/models';
import { OrisDb, getScopeCustomers, getScopeDocuments, getScopeProducts } from './db';
import { makeScopeKey } from './scope';

let db: OrisDb | undefined;
afterEach(async () => {
  if (db) {
    db.close();
    await DexieDelete(db.name);
    db = undefined;
  }
});

async function DexieDelete(name: string) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

describe('local database isolation', () => {
  it('R14 produces different scope keys for device/user/company combinations', () => {
    const a = makeScopeKey({ deviceId: 'd1', userId: 'u1', companyId: 'c1' });
    const b = makeScopeKey({ deviceId: 'd1', userId: 'u1', companyId: 'c2' });
    const c = makeScopeKey({ deviceId: 'd1', userId: 'u2', companyId: 'c1' });
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('R14 queries never leak customers/products/documents from another scope', async () => {
    db = new OrisDb('scope-test-' + crypto.randomUUID());
    const s1 = 'd:u1:c1';
    const s2 = 'd:u2:c1';
    const customer = (id: string, scopeKey: string): Customer => ({
      id, scopeKey, name: id, taxId: id, active: true, pendingSync: false,
      updatedAt: '2026-09-18T00:00:00Z'
    });
    const product = (id: string, scopeKey: string): Product => ({
      id, scopeKey, name: id, sku: id, active: true, price: 10, stock: 10,
      updatedAt: '2026-09-18T00:00:00Z'
    });
    const document = (id: string, scopeKey: string): SalesDocument => ({
      id, scopeKey, kind: 'quote', state: 'local', items: [], supplemental: {},
      sellerId: 'u', createdAt: '2026-09-18T00:00:00Z',
      updatedAt: '2026-09-18T00:00:00Z', idempotencyKey: 'idem-' + id
    });

    await db.customers.bulkPut([customer('c-a', s1), customer('c-b', s2)]);
    await db.products.bulkPut([product('p-a', s1), product('p-b', s2)]);
    await db.documents.bulkPut([document('d-a', s1), document('d-b', s2)]);

    expect((await getScopeCustomers(db, s1)).map(x => x.id)).toEqual(['c-a']);
    expect((await getScopeProducts(db, s1)).map(x => x.id)).toEqual(['p-a']);
    expect((await getScopeDocuments(db, s1)).map(x => x.id)).toEqual(['d-a']);
  });
});
