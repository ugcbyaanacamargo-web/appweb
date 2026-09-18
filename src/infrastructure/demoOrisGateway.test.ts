import { beforeEach, describe, expect, it } from 'vitest';
import type { SalesDocument } from '../domain/models';
import { DemoOrisGateway, DEMO_CREDENTIALS } from './demoOrisGateway';
import { GatewayError, type GatewayContext } from './orisGateway';

class MemoryStorage {
  private data=new Map<string,string>();
  getItem(k:string){return this.data.get(k)??null;}
  setItem(k:string,v:string){this.data.set(k,v);}
  removeItem(k:string){this.data.delete(k);}
}

let storage:MemoryStorage;
let gateway:DemoOrisGateway;

beforeEach(()=>{
  storage=new MemoryStorage();
  gateway=new DemoOrisGateway(storage);
});

async function login(){
  return gateway.authenticate(DEMO_CREDENTIALS);
}

describe('DemoOrisGateway',()=>{
  it('authenticates the seeded demo seller with two companies',async()=>{
    const auth=await login();
    expect(auth.companies).toHaveLength(2);
    expect(auth.user.email).toBe(DEMO_CREDENTIALS.email);
  });

  it('R18 deduplicates a customer by normalized CPF/CNPJ inside the same company',async()=>{
    const auth=await login();
    const companyId=auth.companies[0].id;
    const context:GatewayContext={companyId,userId:auth.user.id,scopeKey:'d:u:'+companyId};
    const snap=await gateway.fetchCommercialSnapshot(context);
    const existing=snap.customers[0];

    const linked=await gateway.upsertCustomer(context,{
      ...existing,
      id:'local-new',
      officialId:undefined,
      taxId:existing.taxId.replace(/\D/g,''),
      name:'Nome atualizado',
      pendingSync:true,
      updatedAt:'2026-09-18T14:00:00.000Z'
    });

    expect(linked.officialId).toBe(existing.officialId);
    const after=await gateway.fetchCommercialSnapshot(context);
    expect(after.customers.filter(c=>c.taxId.replace(/\D/g,'')===existing.taxId.replace(/\D/g,''))).toHaveLength(1);
  });

  it('keeps the newest customer version when offline and server edits conflict',async()=>{
    const auth=await login();
    const companyId=auth.companies[0].id;
    const context:GatewayContext={companyId,userId:auth.user.id,scopeKey:'d:u:'+companyId};
    const snap=await gateway.fetchCommercialSnapshot(context);
    const existing=snap.customers[0];

    const older=await gateway.upsertCustomer(context,{
      ...existing,
      id:'local-old',
      name:'Versão antiga offline',
      pendingSync:true,
      updatedAt:'2000-01-01T00:00:00.000Z'
    });
    expect(older.name).toBe(existing.name);

    const newer=await gateway.upsertCustomer(context,{
      ...existing,
      id:'local-newer',
      name:'Versão mais recente offline',
      pendingSync:true,
      updatedAt:'2999-01-01T00:00:00.000Z'
    });
    expect(newer.name).toBe('Versão mais recente offline');
  });

  it('R19 returns the same official result for the same idempotency key',async()=>{
    const auth=await login();
    const companyId=auth.companies[0].id;
    const context:GatewayContext={companyId,userId:auth.user.id,scopeKey:'scope'};
    const snap=await gateway.fetchCommercialSnapshot(context);
    const customer=snap.customers[0];
    const product=snap.products[0];
    const document:SalesDocument={
      id:'local-1',scopeKey:'scope',kind:'order',state:'local',customerId:customer.id,
      items:[{productId:product.id,quantity:1,unitPrice:product.price}],supplemental:{},
      sellerId:auth.user.id,createdAt:'2026-09-18T12:00:00Z',updatedAt:'2026-09-18T12:00:00Z',
      idempotencyKey:'same-key'
    };

    const first=await gateway.sendDocument(context,document);
    const second=await gateway.sendDocument(context,document);
    expect(second).toEqual(first);
  });

  it('R12 quote never reduces server stock',async()=>{
    const auth=await login();
    const companyId=auth.companies[0].id;
    const context:GatewayContext={companyId,userId:auth.user.id,scopeKey:'scope'};
    const before=await gateway.fetchCommercialSnapshot(context);
    const product=before.products[0];
    const document:SalesDocument={
      id:'q1',scopeKey:'scope',kind:'quote',state:'local',customerId:before.customers[0].id,
      items:[{productId:product.id,quantity:999,unitPrice:product.price}],supplemental:{},
      sellerId:auth.user.id,createdAt:'x',updatedAt:'x',idempotencyKey:'quote-key'
    };
    const result=await gateway.sendDocument(context,document);
    expect(result.acceptedItems[0].quantity).toBe(999);
    const after=await gateway.fetchCommercialSnapshot(context);
    expect(after.products.find(p=>p.id===product.id)?.stock).toBe(product.stock);
  });

  it('R16/R17 blocked company rejects commercial snapshot but still accepts explicit document send',async()=>{
    const auth=await login();
    const companyId=auth.companies[0].id;
    const context:GatewayContext={companyId,userId:auth.user.id,scopeKey:'scope'};
    const snap=await gateway.fetchCommercialSnapshot(context);
    await gateway.setCompanyBlockedForDemo(companyId,true);
    await expect(gateway.fetchCommercialSnapshot(context)).rejects.toMatchObject({code:'ACCOUNT_BLOCKED'} satisfies Partial<GatewayError>);
    const product=snap.products[0];
    const document:SalesDocument={
      id:'o1',scopeKey:'scope',kind:'order',state:'local',customerId:snap.customers[0].id,
      items:[{productId:product.id,quantity:1,unitPrice:product.price}],supplemental:{},
      sellerId:auth.user.id,createdAt:'x',updatedAt:'x',idempotencyKey:'blocked-send'
    };
    await expect(gateway.sendDocument(context,document)).resolves.toMatchObject({officialNumber:expect.any(String)});
  });
});
