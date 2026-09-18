import { describe, expect, it } from 'vitest';
import type { AuthResult } from '../domain/models';
import {
  cacheOfflineCredentials,
  clearLiveSession,
  loadLiveSession,
  saveLiveSession,
  verifyOfflineCredentials
} from './session';

class MemoryStorage {
  private data = new Map<string,string>();
  getItem(key:string){ return this.data.get(key) ?? null; }
  setItem(key:string,value:string){ this.data.set(key,value); }
  removeItem(key:string){ this.data.delete(key); }
}

const auth:AuthResult={
  user:{id:'u1',name:'Vendedor Demo',email:'vendedor@demo.local'},
  companies:[{id:'c1',name:'Empresa 1'},{id:'c2',name:'Empresa 2'}],
  token:'demo-token'
};

describe('offline authentication cache',()=>{
  it('TEST1 allows cached login offline only with the correct password after an online login',async()=>{
    const storage=new MemoryStorage();
    await cacheOfflineCredentials(storage,'vendedor@demo.local','secret',auth);
    expect((await verifyOfflineCredentials(storage,'vendedor@demo.local','secret'))?.user.id).toBe('u1');
    expect(await verifyOfflineCredentials(storage,'vendedor@demo.local','wrong')).toBeNull();
    expect(await verifyOfflineCredentials(storage,'unknown@demo.local','secret')).toBeNull();
  });

  it('R15 logout clears only live session and not the offline credential cache',async()=>{
    const storage=new MemoryStorage();
    await cacheOfflineCredentials(storage,'vendedor@demo.local','secret',auth);
    saveLiveSession(storage,{auth,activeCompanyId:'c1'});
    expect(loadLiveSession(storage)?.activeCompanyId).toBe('c1');
    clearLiveSession(storage);
    expect(loadLiveSession(storage)).toBeNull();
    expect((await verifyOfflineCredentials(storage,'vendedor@demo.local','secret'))?.user.id).toBe('u1');
  });
});
