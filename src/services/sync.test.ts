import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  AuthResult,
  CommercialSnapshot,
  Customer,
  Mission,
  SalesDocument,
  SendDocumentResult
} from '../domain/models';
import { OrisDb } from '../infrastructure/db';
import {
  GatewayError,
  type AccountInput,
  type GatewayContext,
  type OrisGateway
} from '../infrastructure/orisGateway';
import { synchronizeCommercialBase } from './sync';

class SyncGateway implements OrisGateway {
  documentSendCalls = 0;
  customerCalls: string[] = [];
  snapshotError?: Error;
  customerFailureId?: string;

  constructor(public snapshot: CommercialSnapshot) {}

  async authenticate(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async createAccount(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async upsertCustomer(_context: GatewayContext, customer: Customer): Promise<Customer> {
    this.customerCalls.push(customer.id);
    if (customer.id === this.customerFailureId) throw new GatewayError('INVALID_DATA', 'invalid');
    return { ...customer, officialId: 'official-' + customer.id, pendingSync: false };
  }
  async fetchCommercialSnapshot(_context: GatewayContext): Promise<CommercialSnapshot> {
    if (this.snapshotError) throw this.snapshotError;
    return this.snapshot;
  }
  async sendDocument(_context: GatewayContext, _document: SalesDocument): Promise<SendDocumentResult> {
    this.documentSendCalls += 1;
    throw new Error('SINCRONIZAR must never call sendDocument');
  }
  async fetchMissions(_context: GatewayContext): Promise<Mission[]> { return []; }
  async sendMissionReturn(_context: GatewayContext, _mission: Mission): Promise<void> {}
  async sendLocation(): Promise<void> {}
}

let db: OrisDb | undefined;
afterEach(async () => {
  if (db) {
    const name = db.name;
    db.close();
    await new Promise<void>(resolve => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    db = undefined;
  }
});

const scopeKey = 'd:u:c';
const context: GatewayContext = { companyId: 'c', userId: 'u', scopeKey };

function snapshot(price = 12): CommercialSnapshot {
  return {
    version: 'v2',
    synchronizedAt: '2026-09-18T12:00:00Z',
    customers: [{
      id: 'server-customer', scopeKey, name: 'Servidor', taxId: '222',
      active: true, pendingSync: false, updatedAt: '2026-09-18T12:00:00Z'
    }],
    products: [{
      id: 'p1', scopeKey, name: 'Produto', sku: 'P1', active: true,
      price, stock: 4, updatedAt: '2026-09-18T12:00:00Z'
    }],
    settings: { allowSaleWithoutStock: false, accountBlocked: false }
  };
}

async function seed() {
  db = new OrisDb('sync-test-' + crypto.randomUUID());
  await db.contexts.put({
    scopeKey, userName: 'User', companyName: 'Company',
    activatedAt: '2026-09-17T00:00:00Z',
    lastSuccessfulSyncAt: '2026-09-17T00:00:00Z',
    snapshotVersion: 'v1', accountBlocked: false
  });
  await db.products.put({
    id: 'old-product', scopeKey, name: 'Old', sku: 'OLD', active: true,
    price: 5, stock: 5, updatedAt: '2026-09-17T00:00:00Z'
  });
  await db.customers.bulkPut([
    { id: 'pending-ok', scopeKey, name: 'Ok', taxId: '111', active: true, pendingSync: true, updatedAt: '2026-09-18T10:00:00Z' },
    { id: 'pending-bad', scopeKey, name: 'Bad', taxId: '333', active: true, pendingSync: true, updatedAt: '2026-09-18T10:00:00Z' }
  ]);
  await db.documents.put({
    id: 'doc1', scopeKey, kind: 'quote', state: 'local', customerId: 'pending-ok',
    items: [{ productId: 'p1', quantity: 10, unitPrice: 10 }],
    supplemental: {}, sellerId: 'u', createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z', idempotencyKey: 'idem-doc1'
  });
}

describe('manual commercial synchronization', () => {
  it('R3 syncs customers/base but never sends sales documents', async () => {
    await seed();
    const gateway = new SyncGateway(snapshot());
    gateway.customerFailureId = 'pending-bad';

    const result = await synchronizeCommercialBase({ db: db!, gateway, context, online: true });

    expect(result.ok).toBe(true);
    expect(gateway.documentSendCalls).toBe(0);
    expect(gateway.customerCalls.sort()).toEqual(['pending-bad', 'pending-ok']);
    expect(result.customerErrors).toHaveLength(1);
    expect((await db!.customers.get([scopeKey, 'pending-bad']))?.pendingSync).toBe(true);
    expect((await db!.contexts.get(scopeKey))?.lastSuccessfulSyncAt).toBe('2026-09-18T12:00:00Z');
    expect(await db!.products.get([scopeKey, 'old-product'])).toBeUndefined();
  });

  it('R20 preserves last valid base and timestamp when snapshot download fails', async () => {
    await seed();
    const gateway = new SyncGateway(snapshot());
    gateway.snapshotError = new GatewayError('NETWORK', 'down');

    const result = await synchronizeCommercialBase({ db: db!, gateway, context, online: true });

    expect(result.ok).toBe(false);
    expect((await db!.products.get([scopeKey, 'old-product']))?.price).toBe(5);
    expect((await db!.contexts.get(scopeKey))?.lastSuccessfulSyncAt).toBe('2026-09-17T00:00:00Z');
  });

  it('R16 blocked account cannot replace commercial base', async () => {
    await seed();
    const existing = await db!.contexts.get(scopeKey);
    await db!.contexts.put({ ...existing!, accountBlocked: true });
    const gateway = new SyncGateway(snapshot(99));

    const result = await synchronizeCommercialBase({ db: db!, gateway, context, online: true });

    expect(result).toMatchObject({ ok: false, reason: 'account-blocked' });
    expect(await db!.products.get([scopeKey, 'old-product'])).toBeDefined();
  });

  it('offline sync fails without changing last successful sync', async () => {
    await seed();
    const gateway = new SyncGateway(snapshot());

    const result = await synchronizeCommercialBase({ db: db!, gateway, context, online: false });

    expect(result).toMatchObject({ ok: false, reason: 'offline' });
    expect((await db!.contexts.get(scopeKey))?.lastSuccessfulSyncAt).toBe('2026-09-17T00:00:00Z');
  });
});
