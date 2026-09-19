import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type { Customer, Product, SalesDocument } from '../domain/models';
import { OrisDb, getScopeCustomers, getScopeDocuments, getScopeProducts, replaceCommercialSnapshot } from './db';
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

  it('R14 keeps identical server IDs isolated in different scopes', async () => {
    db = new OrisDb('collision-test-' + crypto.randomUUID());
    const base = {
      id: 'same-id',
      name: 'Cliente',
      taxId: '123',
      active: true,
      pendingSync: false,
      updatedAt: '2026-09-18T00:00:00Z'
    };
    await db.customers.bulkPut([
      { ...base, scopeKey: 'd:u1:c1' },
      { ...base, scopeKey: 'd:u1:c2', name: 'Outro contexto' }
    ]);
    expect((await db.customers.get(['d:u1:c1', 'same-id']))?.name).toBe('Cliente');
    expect((await db.customers.get(['d:u1:c2', 'same-id']))?.name).toBe('Outro contexto');
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

    await db.customers.bulkPut([customer('same', s1), customer('same', s2)]);
    await db.products.bulkPut([product('same', s1), product('same', s2)]);
    await db.documents.bulkPut([document('same', s1), document('same', s2)]);

    expect((await getScopeCustomers(db, s1)).map(x => x.scopeKey)).toEqual([s1]);
    expect((await getScopeProducts(db, s1)).map(x => x.scopeKey)).toEqual([s1]);
    expect((await getScopeDocuments(db, s1)).map(x => x.scopeKey)).toEqual([s1]);
  });

  it('persists backend-defined customer fields with the commercial snapshot', async () => {
    db = new OrisDb('customer-fields-' + crypto.randomUUID());
    const scopeKey = 'd:u:c';
    await db.contexts.put({
      scopeKey,
      userName: 'User',
      companyName: 'Company',
      activatedAt: '2026-09-18T00:00:00Z',
      accountBlocked: false
    });

    await replaceCommercialSnapshot(db, scopeKey, {
      version: 'v2',
      synchronizedAt: '2026-09-18T12:00:00Z',
      customers: [{
        id: 'c1',
        scopeKey,
        name: 'Cliente',
        taxId: '123',
        active: true,
        pendingSync: false,
        updatedAt: '2026-09-18T12:00:00Z',
        extraFields: { phone: '62999990000' }
      }],
      products: [],
      settings: {
        allowSaleWithoutStock: false,
        accountBlocked: false,
        customerFields: [
          { key: 'phone', label: 'Telefone', type: 'tel' },
          { key: 'evil', label: 'Campo inválido', type: 'file' as never }
        ]
      }
    });

    expect((await db.contexts.get(scopeKey))?.customerFields).toEqual([
      { key: 'phone', label: 'Telefone', type: 'tel' }
    ]);
    expect((await db.customers.get([scopeKey, 'c1']))?.extraFields?.phone).toBe('62999990000');
  });

  it('R14 also isolates identical device/user/company IDs across integration realms', () => {
    const demo = makeScopeKey({
      deviceId: 'd1',
      userId: 'u1',
      companyId: 'c1',
      realm: 'demo'
    });
    const real = makeScopeKey({
      deviceId: 'd1',
      userId: 'u1',
      companyId: 'c1',
      realm: 'http:https://api.example.com|/login|/snapshot'
    });
    expect(real).not.toBe(demo);
  });

});
