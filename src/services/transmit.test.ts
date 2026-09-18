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
import type {
  AccountInput,
  GatewayContext,
  OrisGateway
} from '../infrastructure/orisGateway';
import { sendDocumentExplicitly } from './transmit';

class SendGateway implements OrisGateway {
  customerCalls = 0;
  documentCalls = 0;
  failSend = false;
  acceptedQuantity = 6;
  seenKeys = new Map<string, SendDocumentResult>();

  async authenticate(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async createAccount(_input: AccountInput): Promise<AuthResult> { throw new Error('unused'); }
  async upsertCustomer(_context: GatewayContext, customer: Customer): Promise<Customer> {
    this.customerCalls++;
    return { ...customer, officialId: 'official-customer', pendingSync: false };
  }
  async fetchCommercialSnapshot(): Promise<CommercialSnapshot> { throw new Error('unused'); }
  async sendDocument(_context: GatewayContext, document: SalesDocument): Promise<SendDocumentResult> {
    this.documentCalls++;
    if (this.failSend) throw new Error('timeout');
    const existing = this.seenKeys.get(document.idempotencyKey);
    if (existing) return existing;
    const acceptedItems = document.kind === 'order'
      ? document.items.map(item => ({ ...item, quantity: Math.min(item.quantity, this.acceptedQuantity) })).filter(item => item.quantity > 0)
      : document.items.map(item => ({ ...item }));
    const result = {
      officialNumber: (document.kind === 'order' ? 'PD-' : 'ORC-') + '0001',
      acceptedItems,
      sentAt: '2026-09-18T12:00:00Z'
    };
    this.seenKeys.set(document.idempotencyKey, result);
    return result;
  }
  async fetchMissions(): Promise<Mission[]> { return []; }
  async sendMissionReturn(): Promise<void> {}
  async sendLocation(): Promise<void> {}
}

let db: OrisDb | undefined;
afterEach(async () => {
  if (db) {
    const name=db.name; db.close();
    await new Promise<void>(resolve => {
      const req=indexedDB.deleteDatabase(name);
      req.onsuccess=()=>resolve(); req.onerror=()=>resolve(); req.onblocked=()=>resolve();
    });
    db=undefined;
  }
});

const scopeKey='d:u:c';
const context: GatewayContext={ companyId:'c', userId:'u', scopeKey };

async function seed(kind: 'quote'|'order'='order') {
  db=new OrisDb('send-test-'+crypto.randomUUID());
  await db.contexts.put({
    scopeKey,userName:'User',companyName:'Company',activatedAt:'2026-09-17T00:00:00Z',
    lastSuccessfulSyncAt:'2026-09-18T10:00:00Z',snapshotVersion:'v1',accountBlocked:false
  });
  await db.products.put({
    id:'p1',scopeKey,name:'Produto',sku:'P1',active:true,price:12,stock:10,updatedAt:'2026-09-18T10:00:00Z'
  });
  await db.customers.put({
    id:'local-c',scopeKey,name:'Cliente',taxId:'123',active:true,pendingSync:true,updatedAt:'2026-09-18T10:00:00Z'
  });
  await db.documents.put({
    id:'doc1',scopeKey,kind,state:'local',customerId:'local-c',
    items:[{productId:'p1',quantity:10,unitPrice:10}],supplemental:{notes:'n'},
    sellerId:'u',createdAt:'2026-09-18T10:00:00Z',updatedAt:'2026-09-18T10:00:00Z',
    idempotencyKey:'idem-stable'
  });
}

describe('explicit document transmission',()=>{
  it('R4 offline attempt never sends and keeps document unsent',async()=>{
    await seed();
    const gateway=new SendGateway();
    const result=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:false});
    expect(result).toMatchObject({ok:false,reason:'offline'});
    expect(gateway.documentCalls).toBe(0);
    expect((await db!.documents.get([scopeKey, 'doc1']))?.state).toBe('local');
  });

  it('R5/R6 confirms server before marking sent, syncs related client first, reprices and locks',async()=>{
    await seed('order');
    const gateway=new SendGateway();
    const result=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect(result.ok).toBe(true);
    expect(gateway.customerCalls).toBe(1);
    expect(gateway.documentCalls).toBe(1);
    const stored=await db!.documents.get([scopeKey, 'doc1']);
    expect(stored?.state).toBe('sent');
    expect(stored?.officialNumber).toBe('PD-0001');
    expect(stored?.items).toEqual([{productId:'p1',quantity:6,unitPrice:12}]);
  });

  it('failure/timeout never marks document sent',async()=>{
    await seed();
    const gateway=new SendGateway();
    gateway.failSend=true;
    const result=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect(result.ok).toBe(false);
    expect((await db!.documents.get([scopeKey, 'doc1']))?.state).toBe('local');
  });

  it('R17 blocked account still allows explicit document transmission',async()=>{
    await seed();
    const row=await db!.contexts.get(scopeKey);
    await db!.contexts.put({...row!,accountBlocked:true});
    const gateway=new SendGateway();
    const result=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect(result.ok).toBe(true);
  });

  it('R12 quote is sent with full quantity even when server order capacity would be lower',async()=>{
    await seed('quote');
    const gateway=new SendGateway();
    gateway.acceptedQuantity=2;
    await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect((await db!.documents.get([scopeKey, 'doc1']))?.items[0].quantity).toBe(10);
  });

  it('R19 retry with same idempotency key cannot create a second remote document',async()=>{
    await seed();
    const gateway=new SendGateway();
    gateway.failSend=false;
    const first=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect(first.ok).toBe(true);
    // Simulate lost local confirmation: restore local state but keep same idempotency key.
    const sent=await db!.documents.get([scopeKey, 'doc1']);
    await db!.documents.put({...sent!,state:'local',officialNumber:undefined,sentAt:undefined});
    const second=await sendDocumentExplicitly({db:db!,gateway,context,documentId:'doc1',online:true});
    expect(second.ok).toBe(true);
    expect(gateway.seenKeys.size).toBe(1);
    expect((await db!.documents.get([scopeKey, 'doc1']))?.officialNumber).toBe('PD-0001');
  });
});
