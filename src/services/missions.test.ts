import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  AuthResult, CommercialSnapshot, Customer, Mission, SendDocumentResult
} from '../domain/models';
import { OrisDb } from '../infrastructure/db';
import type { AccountInput, GatewayContext, OrisGateway } from '../infrastructure/orisGateway';
import { completeMissionOffline, flushMissionReturns } from './missions';

class MissionGateway implements OrisGateway {
  returns=0;
  async authenticate(_input: AccountInput): Promise<AuthResult>{throw new Error('unused');}
  async createAccount(_input: AccountInput): Promise<AuthResult>{throw new Error('unused');}
  async upsertCustomer(_c:GatewayContext,x:Customer):Promise<Customer>{return x;}
  async fetchCommercialSnapshot():Promise<CommercialSnapshot>{throw new Error('unused');}
  async sendDocument():Promise<SendDocumentResult>{throw new Error('unused');}
  async fetchMissions():Promise<Mission[]>{return [];}
  async sendMissionReturn():Promise<void>{this.returns++;}
  async sendLocation():Promise<void>{}
}

let db:OrisDb|undefined;
afterEach(async()=>{if(db){const n=db.name;db.close();await new Promise<void>(r=>{const q=indexedDB.deleteDatabase(n);q.onsuccess=()=>r();q.onerror=()=>r();q.onblocked=()=>r();});db=undefined;}});

const scopeKey='d:u:c';
const context:GatewayContext={companyId:'c',userId:'u',scopeKey};

describe('missions automatic exception',()=>{
  it('TEST20 mission received earlier can be completed offline and stays pending',async()=>{
    db=new OrisDb('mission-'+crypto.randomUUID());
    const mission:Mission={id:'m1',scopeKey,title:'Visitar cliente',completed:false,pendingReturn:false,assignedAt:'2026-09-18T09:00:00Z'};
    await db.missions.put(mission);
    const done=await completeMissionOffline(db,mission,{notes:'feito'},'2026-09-18T10:00:00Z');
    expect(done.completed).toBe(true);
    expect(done.pendingReturn).toBe(true);
    expect((await db.missions.get([scopeKey, 'm1']))?.notes).toBe('feito');
  });

  it('TEST21 pending mission return may flush automatically when online',async()=>{
    db=new OrisDb('mission-'+crypto.randomUUID());
    await db.missions.put({id:'m1',scopeKey,title:'T',completed:true,pendingReturn:true,assignedAt:'x'});
    const gateway=new MissionGateway();
    expect(await flushMissionReturns({db,gateway,context,online:false})).toBe(0);
    expect((await db.missions.get([scopeKey, 'm1']))?.pendingReturn).toBe(true);
    expect(await flushMissionReturns({db,gateway,context,online:true})).toBe(1);
    expect(gateway.returns).toBe(1);
    expect((await db.missions.get([scopeKey, 'm1']))?.pendingReturn).toBe(false);
  });
});
