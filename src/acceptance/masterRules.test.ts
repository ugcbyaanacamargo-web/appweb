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
import { convertQuoteToOrder } from '../domain/rules';
import { canEnterCompanyContext } from '../app/accessPolicy';
import { clearLiveSession, saveLiveSession } from '../app/session';
import { OrisDb, getScopeDocuments } from '../infrastructure/db';
import { DemoOrisGateway, DEMO_CREDENTIALS } from '../infrastructure/demoOrisGateway';
import type {
  AccountInput,
  GatewayContext,
  OrisGateway
} from '../infrastructure/orisGateway';
import { sendDocumentExplicitly } from '../services/transmit';
import { MAIN_MENU, pageRequiresOnline } from '../ui/menu';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

class NeverSendGateway implements OrisGateway {
  sendCalls = 0;
  async authenticate(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async createAccount(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async upsertCustomer(_context: GatewayContext, customer: Customer): Promise<Customer> { return customer; }
  async fetchCommercialSnapshot(): Promise<CommercialSnapshot> { throw new Error('unused'); }
  async sendDocument(): Promise<SendDocumentResult> {
    this.sendCalls += 1;
    throw new Error('must not send');
  }
  async fetchMissions(): Promise<Mission[]> { return []; }
  async sendMissionReturn(): Promise<void> {}
  async sendLocation(): Promise<void> {}
}

let db: OrisDb | undefined;

afterEach(async () => {
  if (!db) return;
  const name = db.name;
  db.close();
  await new Promise<void>(resolve => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  db = undefined;
});

describe('master acceptance coverage', () => {
  it('TEST1 first activation requires internet but a valid synchronized scope can be used offline', () => {
    expect(canEnterCompanyContext(false)).toBe(false);
    expect(canEnterCompanyContext(true)).toBe(true);
    expect(canEnterCompanyContext(false, '2026-09-18T12:00:00Z')).toBe(true);
  });

  it('TEST10 inactive customer cannot be used to transmit a new document', async () => {
    const scopeKey = 'device:user:company';
    db = new OrisDb('accept-inactive-' + crypto.randomUUID());
    await db.contexts.put({
      scopeKey,
      userName: 'User',
      companyName: 'Company',
      activatedAt: '2026-09-18T10:00:00Z',
      lastSuccessfulSyncAt: '2026-09-18T10:00:00Z',
      accountBlocked: false,
      allowSaleWithoutStock: false
    });
    await db.customers.put({
      id: 'customer',
      officialId: 'official-customer',
      scopeKey,
      name: 'Inativo',
      taxId: '123',
      active: false,
      pendingSync: false,
      updatedAt: '2026-09-18T10:00:00Z'
    });
    await db.products.put({
      id: 'product',
      scopeKey,
      name: 'Produto',
      sku: 'P',
      active: true,
      price: 10,
      stock: 10,
      updatedAt: '2026-09-18T10:00:00Z'
    });
    await db.documents.put({
      id: 'doc',
      scopeKey,
      kind: 'quote',
      state: 'local',
      customerId: 'customer',
      items: [{ productId: 'product', quantity: 1, unitPrice: 10 }],
      supplemental: {},
      sellerId: 'user',
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
      idempotencyKey: 'idem'
    });
    const gateway = new NeverSendGateway();
    const result = await sendDocumentExplicitly({
      db,
      gateway,
      context: { companyId: 'company', userId: 'user', scopeKey },
      documentId: 'doc',
      online: true
    });
    expect(result.ok).toBe(false);
    expect(gateway.sendCalls).toBe(0);
  });

  it('TEST14 an order created from a quote is reduced to current server stock when oversell is disabled', async () => {
    const storage = new MemoryStorage();
    const gateway = new DemoOrisGateway(storage);
    const auth = await gateway.authenticate(DEMO_CREDENTIALS);
    const company = auth.companies[0];
    const context: GatewayContext = {
      companyId: company.id,
      userId: auth.user.id,
      scopeKey: 'device:' + auth.user.id + ':' + company.id
    };
    const snapshot = await gateway.fetchCommercialSnapshot(context);
    const product = snapshot.products.find(item => item.stock === 6)!;
    const quote: SalesDocument = {
      id: 'quote',
      scopeKey: context.scopeKey,
      kind: 'quote',
      state: 'local',
      customerId: snapshot.customers[0].id,
      items: [{ productId: product.id, quantity: 10, unitPrice: product.price }],
      supplemental: {},
      sellerId: auth.user.id,
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
      idempotencyKey: 'accept-test-14'
    };
    const order = convertQuoteToOrder(quote);
    const result = await gateway.sendDocument(context, order);
    expect(result.acceptedItems[0].quantity).toBe(6);
  });

  it('TEST16 a new device starts with zero local sales history and commercial snapshot has no history payload', async () => {
    const storage = new MemoryStorage();
    const gateway = new DemoOrisGateway(storage);
    const auth = await gateway.authenticate(DEMO_CREDENTIALS);
    const company = auth.companies[0];
    const scopeKey = 'brand-new-device:' + auth.user.id + ':' + company.id;
    const snapshot = await gateway.fetchCommercialSnapshot({
      companyId: company.id,
      userId: auth.user.id,
      scopeKey
    });
    expect('documents' in snapshot).toBe(false);

    db = new OrisDb('accept-new-device-' + crypto.randomUUID());
    expect(await getScopeDocuments(db, scopeKey)).toEqual([]);
  });

  it('TEST17 logout clears session but leaves local documents untouched', async () => {
    const storage = new MemoryStorage();
    const gateway = new DemoOrisGateway(storage);
    const auth = await gateway.authenticate(DEMO_CREDENTIALS);
    const scopeKey = 'device:' + auth.user.id + ':' + auth.companies[0].id;
    db = new OrisDb('accept-logout-' + crypto.randomUUID());
    await db.documents.put({
      id: 'local-doc',
      scopeKey,
      kind: 'quote',
      state: 'local',
      items: [],
      supplemental: {},
      sellerId: auth.user.id,
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
      idempotencyKey: 'logout-doc'
    });
    saveLiveSession(storage, { auth, activeCompanyId: auth.companies[0].id });
    clearLiveSession(storage);
    expect((await getScopeDocuments(db, scopeKey)).map(item => item.id)).toEqual(['local-doc']);
  });

  it('TEST22 reports and commissions are classified as online-only', () => {
    expect(pageRequiresOnline('reports')).toBe(true);
  });

  it('TEST23 Sistema Online is classified as online-only', () => {
    expect(pageRequiresOnline('online')).toBe(true);
  });

  it('fixed global menu contains exactly the ten specified entries in order', () => {
    expect(MAIN_MENU.map(item => item.label)).toEqual([
      'Pedidos',
      'Clientes',
      'Produtos',
      'Tarefas / Missões',
      'IA no WhatsApp',
      'Relatórios e Comissões',
      'Sistema Online',
      'Ajuda',
      'Sincronizar',
      'Sair da minha conta'
    ]);
  });
});
